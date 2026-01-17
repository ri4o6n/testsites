export interface Env {
	STREAM_FEED_DB: D1Database;
	ADMIN_TOKEN: string;
	YOUTUBE_API_KEY: string;
	TWITCH_CLIENT_ID: string;
	TWITCH_CLIENT_SECRET: string;
}

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, X-ADMIN-TOKEN",
};

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
	});
}

function requireAdmin(request: Request, env: Env): Response | null {
	const token = request.headers.get("X-ADMIN-TOKEN");
	if (!token || token !== env.ADMIN_TOKEN) {
		return json({ ok: false, error: "unauthorized" }, 401);
	}
	return null;
}

async function readJson<T>(request: Request): Promise<T> {
	const ct = request.headers.get("Content-Type") || "";
	if (!ct.includes("application/json")) {
		throw new Error("Content-Type must be application/json");
	}
	return (await request.json()) as T;
}

type SourceItem = {
	id: string;
	platform: string;
	handle: string;
	display_name: string | null;
	url: string | null;
	enabled: number;
	created_at: string;
};

type UpsertBody = {
	id: string;
	platform: string;
	handle: string;
	display_name?: string | null;
	url?: string | null;
	enabled?: number; // 0/1
};

type ToggleBody = {
	id: string;
	enabled: number; // 0/1
};

type FeedItem = {
	platform: "youtube" | "twitch";
	sourceId: string;
	channelName: string | null;
	title: string;
	url: string;
	thumbnailUrl: string | null;
	status: "live" | "scheduled" | "archive";
	startAt: string | null; // MVPでは null（次ステップで埋める）
};

type FeedError = {
	platform: "youtube" | "twitch";
	sourceId: string;
	message: string;
};

type TwitchToken = {
	access_token: string;
	expires_in: number;
	token_type: string;
};

async function getTwitchToken(env: Env): Promise<string> {
	if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
		throw new Error("twitch credentials missing");
	}

	const cacheKey = "twitch:app_token";
	const cached = await env.STREAM_FEED_DB.prepare(
		"SELECT payload_json, fetched_at FROM cache_kv WHERE key = ?"
	)
		.bind(cacheKey)
		.first<{ payload_json: string; fetched_at: string }>();

	if (cached?.payload_json && cached?.fetched_at) {
		const payload = JSON.parse(cached.payload_json) as { token: string; expiresAt: string };
		const expiresAtMs = Date.parse(payload.expiresAt);
		if (!Number.isNaN(expiresAtMs) && Date.now() + 60_000 < expiresAtMs) {
			return payload.token;
		}
	}

	const body = new URLSearchParams({
		client_id: env.TWITCH_CLIENT_ID,
		client_secret: env.TWITCH_CLIENT_SECRET,
		grant_type: "client_credentials",
	});

	const res = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});
	if (!res.ok) {
		const detail = await res.text();
		throw new Error(`twitch token fetch failed: ${res.status} ${detail}`);
	}
	const json = (await res.json()) as TwitchToken;
	const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString();

	await env.STREAM_FEED_DB.prepare(
		"INSERT INTO cache_kv (key, payload_json, fetched_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET payload_json=excluded.payload_json, fetched_at=datetime('now')"
	)
		.bind(cacheKey, JSON.stringify({ token: json.access_token, expiresAt }))
		.run();

	return json.access_token;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// CORS preflight
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		// health
		if (url.pathname === "/api/health") {
			return json({ ok: true, service: "stream-feed-api", now: new Date().toISOString() });
		}

		// sources count (疎通用)
		if (url.pathname === "/api/sources") {
			try {
				const r1 = await env.STREAM_FEED_DB.prepare("SELECT 1 AS one").first();
				const r2 = await env.STREAM_FEED_DB.prepare("SELECT COUNT(*) AS cnt FROM sources").first();
				return json({ ok: true, db: { select1: r1, sourcesCount: r2 } });
			} catch (err: any) {
				return json({ ok: false, error: { message: err?.message ?? String(err) } }, 500);
			}
		}

		// ✅ list
		if (url.pathname === "/api/sources/list" && request.method === "GET") {
			try {
				const enabledOnly = url.searchParams.get("enabled") === "1";

				const sql = enabledOnly
					? `SELECT id, platform, handle, display_name, url, enabled, created_at
             FROM sources
             WHERE enabled = 1
             ORDER BY platform ASC, created_at DESC`
					: `SELECT id, platform, handle, display_name, url, enabled, created_at
             FROM sources
             ORDER BY platform ASC, created_at DESC`;

				const { results } = await env.STREAM_FEED_DB.prepare(sql).all<SourceItem>();

				return json({
					ok: true,
					items: results ?? [],
					meta: { count: (results ?? []).length, enabledOnly },
				});
			} catch (err: any) {
				return json(
					{ ok: false, error: { message: err?.message ?? String(err), name: err?.name } },
					500
				);
			}
		}

		// ✅ admin: upsert
		if (url.pathname === "/api/sources/upsert" && request.method === "POST") {
			const denied = requireAdmin(request, env);
			if (denied) return denied;

			try {
				const body = await readJson<UpsertBody>(request);

				if (!body?.id || !body?.platform || !body?.handle) {
					return json({ ok: false, error: "id/platform/handle are required" }, 400);
				}

				const enabled = body.enabled === 0 ? 0 : 1;
				const displayName = body.display_name ?? null;
				const urlStr = body.url ?? null;

				const existed = await env.STREAM_FEED_DB.prepare(
					"SELECT 1 AS x FROM sources WHERE id = ? LIMIT 1"
				)
					.bind(body.id)
					.first();

				await env.STREAM_FEED_DB.prepare(
					`INSERT INTO sources (id, platform, handle, display_name, url, enabled)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             platform=excluded.platform,
             handle=excluded.handle,
             display_name=excluded.display_name,
             url=excluded.url,
             enabled=excluded.enabled`
				)
					.bind(body.id, body.platform, body.handle, displayName, urlStr, enabled)
					.run();

				const item = await env.STREAM_FEED_DB.prepare(
					`SELECT id, platform, handle, display_name, url, enabled, created_at
           FROM sources WHERE id = ?`
				)
					.bind(body.id)
					.first<SourceItem>();

				return json({
					ok: true,
					action: existed ? "update" : "insert",
					item,
				});
			} catch (err: any) {
				return json(
					{ ok: false, error: { message: err?.message ?? String(err), name: err?.name } },
					500
				);
			}
		}

		// ✅ admin: toggle enabled
		if (url.pathname === "/api/sources/toggle" && request.method === "POST") {
			const denied = requireAdmin(request, env);
			if (denied) return denied;

			try {
				const body = await readJson<ToggleBody>(request);
				if (!body?.id || (body.enabled !== 0 && body.enabled !== 1)) {
					return json({ ok: false, error: "id and enabled(0|1) are required" }, 400);
				}

				const r = await env.STREAM_FEED_DB.prepare("UPDATE sources SET enabled = ? WHERE id = ?")
					.bind(body.enabled, body.id)
					.run();

				if ((r.meta?.changes ?? 0) === 0) {
					return json({ ok: false, error: "not_found", id: body.id }, 404);
				}

				return json({ ok: true, id: body.id, enabled: body.enabled });
			} catch (err: any) {
				return json(
					{ ok: false, error: { message: err?.message ?? String(err), name: err?.name } },
					500
				);
			}
		}

		// ✅ feed (MVP: YouTube live + upcoming)
		if (url.pathname === "/api/feed" && request.method === "GET") {
			try {
				const ttlSec = 90;
				const now = Date.now();

				const cacheKey = "feed:default";
				const cached = await env.STREAM_FEED_DB.prepare(
					"SELECT payload_json, fetched_at FROM cache_kv WHERE key = ?"
				)
					.bind(cacheKey)
					.first<{ payload_json: string; fetched_at: string }>();

				if (cached?.payload_json && cached?.fetched_at) {
					const fetchedAtMs = new Date(cached.fetched_at + "Z").getTime();
					if (!Number.isNaN(fetchedAtMs) && now - fetchedAtMs < ttlSec * 1000) {
						return json(JSON.parse(cached.payload_json));
					}
				}

				// enabled sources
				const { results } = await env.STREAM_FEED_DB.prepare(
					`SELECT id, platform, handle, display_name, url, enabled, created_at
           FROM sources
           WHERE enabled = 1
           ORDER BY platform ASC, created_at DESC`
				).all<SourceItem>();

				const enabledSources = results ?? [];
				const youtubeSources = enabledSources.filter((s) => s.platform === "youtube");
				const twitchSources = enabledSources.filter((s) => s.platform === "twitch");

				const items: FeedItem[] = [];
				const errors: FeedError[] = [];

				for (const s of youtubeSources) {
					try {
						const apiKey = env.YOUTUBE_API_KEY;

						const base = "https://www.googleapis.com/youtube/v3/search";
						const common =
							`part=snippet&channelId=${encodeURIComponent(s.handle)}` +
							`&type=video&maxResults=10&key=${encodeURIComponent(apiKey)}`;

						const liveUrl = `${base}?${common}&eventType=live`;
						const liveRes = await fetch(liveUrl);
						if (!liveRes.ok) throw new Error(`youtube live fetch failed: ${liveRes.status}`);
						const liveJson: any = await liveRes.json();

						const upUrl = `${base}?${common}&eventType=upcoming`;
						const upRes = await fetch(upUrl);
						if (!upRes.ok) throw new Error(`youtube upcoming fetch failed: ${upRes.status}`);
						const upJson: any = await upRes.json();

						const detailMap = new Map<
							string,
							{ actualStartTime?: string; scheduledStartTime?: string }
						>();
						try {
							const ids = [
								...(liveJson?.items ?? []),
								...(upJson?.items ?? []),
							]
								.map((it: any) => it?.id?.videoId)
								.filter((id: any): id is string => typeof id === "string" && id.length > 0);
							const uniqueIds = Array.from(new Set(ids));
							if (uniqueIds.length > 0) {
								const vidsUrl =
									"https://www.googleapis.com/youtube/v3/videos" +
									`?part=liveStreamingDetails&id=${encodeURIComponent(uniqueIds.join(","))}` +
									`&key=${encodeURIComponent(apiKey)}`;
								const vidsRes = await fetch(vidsUrl);
								if (vidsRes.ok) {
									const vidsJson: any = await vidsRes.json();
									for (const v of vidsJson?.items ?? []) {
										const vid = v?.id;
										const live = v?.liveStreamingDetails ?? {};
										if (vid) {
											detailMap.set(vid, {
												actualStartTime: live.actualStartTime,
												scheduledStartTime: live.scheduledStartTime,
											});
										}
									}
								}
							}
						} catch {
							// startAt is best-effort
						}

						const toItem = (it: any, status: "live" | "scheduled" | "archive"): FeedItem => {
							const vid = it?.id?.videoId;
							const sn = it?.snippet;
							const thumb =
								sn?.thumbnails?.medium?.url ??
								sn?.thumbnails?.high?.url ??
								sn?.thumbnails?.default?.url ??
								null;
							const detail = vid ? detailMap.get(vid) : null;
							const startAt =
								status === "live"
									? detail?.actualStartTime ?? detail?.scheduledStartTime ?? null
									: status === "scheduled"
									? detail?.scheduledStartTime ?? null
									: null;

							return {
								platform: "youtube",
								sourceId: s.id,
								channelName: sn?.channelTitle ?? s.display_name ?? null,
								title: sn?.title ?? "(no title)",
								url: vid ? `https://www.youtube.com/watch?v=${vid}` : (s.url ?? ""),
								thumbnailUrl: thumb,
								status,
								startAt,
							};
						};

						const liveItems = liveJson?.items ?? [];
						const upcomingItems = upJson?.items ?? [];

						for (const it of liveItems) items.push(toItem(it, "live"));
						for (const it of upcomingItems) items.push(toItem(it, "scheduled"));

						if (liveItems.length + upcomingItems.length === 0) {
							const archiveUrl = `${base}?${common}&order=date`;
							const archiveRes = await fetch(archiveUrl);
							if (!archiveRes.ok) {
								throw new Error(`youtube archive fetch failed: ${archiveRes.status}`);
							}
							const archiveJson: any = await archiveRes.json();
							for (const it of archiveJson?.items ?? []) {
								items.push(toItem(it, "archive"));
							}
						}
					} catch (e: any) {
						errors.push({
							platform: "youtube",
							sourceId: s.id,
							message: e?.message ?? String(e),
						});
					}
				}

				if (twitchSources.length > 0) {
					let twitchToken = "";
					try {
						twitchToken = await getTwitchToken(env);
					} catch (e: any) {
						for (const s of twitchSources) {
							errors.push({
								platform: "twitch",
								sourceId: s.id,
								message: e?.message ?? String(e),
							});
						}
						twitchToken = "";
					}

					for (const s of twitchSources) {
						if (!twitchToken) break;
						try {
							const login = s.handle;
							const streamsUrl = `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(
								login
							)}`;
							const streamsRes = await fetch(streamsUrl, {
								headers: {
									"Client-ID": env.TWITCH_CLIENT_ID,
									Authorization: `Bearer ${twitchToken}`,
								},
							});
							if (!streamsRes.ok) {
								throw new Error(`twitch streams fetch failed: ${streamsRes.status}`);
							}
							const streamsJson: any = await streamsRes.json();
							const data = streamsJson?.data ?? [];

							for (const it of data) {
								const thumbTemplate = it?.thumbnail_url ?? null;
								const thumb =
									typeof thumbTemplate === "string"
										? thumbTemplate.replace("{width}", "320").replace("{height}", "180")
										: null;
								items.push({
									platform: "twitch",
									sourceId: s.id,
									channelName: it?.user_name ?? s.display_name ?? s.handle,
									title: it?.title ?? "(no title)",
									url: `https://www.twitch.tv/${login}`,
									thumbnailUrl: thumb,
									status: "live",
									startAt: null,
								});
							}

							if (data.length === 0) {
								const usersUrl = `https://api.twitch.tv/helix/users?login=${encodeURIComponent(
									login
								)}`;
								const usersRes = await fetch(usersUrl, {
									headers: {
										"Client-ID": env.TWITCH_CLIENT_ID,
										Authorization: `Bearer ${twitchToken}`,
									},
								});
								if (!usersRes.ok) {
									throw new Error(`twitch users fetch failed: ${usersRes.status}`);
								}
								const usersJson: any = await usersRes.json();
								const user = (usersJson?.data ?? [])[0] ?? null;
								const channelName =
									user?.display_name ?? s.display_name ?? user?.login ?? s.handle;

								items.push({
									platform: "twitch",
									sourceId: s.id,
									channelName,
									title: `${channelName} - Offline`,
									url: `https://www.twitch.tv/${login}`,
									thumbnailUrl: user?.profile_image_url ?? null,
									status: "archive",
									startAt: null,
								});
							}
						} catch (e: any) {
							errors.push({
								platform: "twitch",
								sourceId: s.id,
								message: e?.message ?? String(e),
							});
						}
					}
				}

				// sort: live first, then scheduled
				items.sort((a, b) => {
					const order = { live: 0, scheduled: 1, archive: 2 } as const;
					if (a.status !== b.status) return order[a.status] - order[b.status];
					const aTime = a.startAt ? Date.parse(a.startAt) : Number.NaN;
					const bTime = b.startAt ? Date.parse(b.startAt) : Number.NaN;
					if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) {
						return aTime - bTime;
					}
					// startAt が無い場合は安定化のため title で
					return a.title.localeCompare(b.title);
				});

				const payload = {
					ok: true,
					updatedAt: new Date().toISOString(),
					items,
					errors,
				};

				await env.STREAM_FEED_DB.prepare(
					"INSERT INTO cache_kv (key, payload_json, fetched_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET payload_json=excluded.payload_json, fetched_at=datetime('now')"
				)
					.bind(cacheKey, JSON.stringify(payload))
					.run();

				return json(payload);
			} catch (err: any) {
				return json({ ok: false, error: { message: err?.message ?? String(err) } }, 500);
			}
		}

		return json({ ok: false, error: "Not Found" }, 404);
	},
};
