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
	"Access-Control-Allow-Headers": "Content-Type, X-ADMIN-TOKEN, X-USER-TOKEN",
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

type FeedItemBase = Omit<FeedItem, "sourceId">;

type FeedError = {
	platform: "youtube" | "twitch";
	sourceId: string;
	message: string;
};

type UserRow = {
	user_id: string;
	owner_token: string;
	read_token: string;
};

type TwitchToken = {
	access_token: string;
	expires_in: number;
	token_type: string;
};

const YT_TTL = {
	live: 600,
	scheduled: 900,
	archive: 3600,
};

const TW_TTL = {
	live: 120,
	offline: 600,
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

async function readCache<T>(
	env: Env,
	key: string
): Promise<{ items: T; ttlSec: number; fetchedAt: string } | null> {
	const cached = await env.STREAM_FEED_DB.prepare(
		"SELECT payload_json, fetched_at FROM cache_kv WHERE key = ?"
	)
		.bind(key)
		.first<{ payload_json: string; fetched_at: string }>();

	if (!cached?.payload_json || !cached?.fetched_at) return null;

	try {
		const parsed = JSON.parse(cached.payload_json) as { items: T; ttlSec: number };
		if (typeof parsed.ttlSec !== "number") return null;
		return { items: parsed.items, ttlSec: parsed.ttlSec, fetchedAt: cached.fetched_at };
	} catch {
		return null;
	}
}

function isFresh(fetchedAt: string, ttlSec: number): boolean {
	const fetchedAtMs = new Date(fetchedAt + "Z").getTime();
	if (Number.isNaN(fetchedAtMs)) return false;
	return Date.now() - fetchedAtMs < ttlSec * 1000;
}

async function writeCache<T>(env: Env, key: string, items: T[], ttlSec: number): Promise<void> {
	await env.STREAM_FEED_DB.prepare(
		"INSERT INTO cache_kv (key, payload_json, fetched_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET payload_json=excluded.payload_json, fetched_at=datetime('now')"
	)
		.bind(key, JSON.stringify({ items, ttlSec }))
		.run();
}

function calcYoutubeTtl(items: FeedItemBase[]): number {
	if (items.some((i) => i.status === "live")) return YT_TTL.live;
	if (items.some((i) => i.status === "scheduled")) return YT_TTL.scheduled;
	return YT_TTL.archive;
}

function getUserToken(request: Request, url: URL): string | null {
	return url.searchParams.get("token") ?? request.headers.get("X-USER-TOKEN");
}

function createToken(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function getUserByToken(env: Env, token: string): Promise<UserRow | null> {
	const row = await env.STREAM_FEED_DB.prepare(
		"SELECT user_id, owner_token, read_token FROM users WHERE owner_token = ? OR read_token = ? LIMIT 1"
	)
		.bind(token, token)
		.first<UserRow>();
	return row ?? null;
}

async function requireUser(
	request: Request,
	env: Env,
	allowReadOnly = true
): Promise<{ user: UserRow; isOwner: boolean } | Response> {
	const url = new URL(request.url);
	const token = getUserToken(request, url);
	if (!token) {
		return json({ ok: false, error: "token required" }, 400);
	}
	const user = await getUserByToken(env, token);
	if (!user) {
		return json({ ok: false, error: "invalid token" }, 401);
	}
	const isOwner = token === user.owner_token;
	if (!allowReadOnly && !isOwner) {
		return json({ ok: false, error: "owner token required" }, 403);
	}
	return { user, isOwner };
}

async function isMaintenance(env: Env): Promise<boolean> {
	const row = await env.STREAM_FEED_DB.prepare(
		"SELECT value FROM settings WHERE key = 'maintenance' LIMIT 1"
	).first<{ value: string }>();
	return row?.value === "1";
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

		// maintenance: stop all actions except health
		if (await isMaintenance(env)) {
			return json({ ok: false, error: "maintenance" }, 503);
		}

		// bootstrap user (open)
		if (url.pathname === "/api/bootstrap" && request.method === "POST") {
			const userId = crypto.randomUUID();
			const ownerToken = createToken();
			const readToken = createToken();

			await env.STREAM_FEED_DB.prepare(
				"INSERT INTO users (user_id, owner_token, read_token) VALUES (?, ?, ?)"
			)
				.bind(userId, ownerToken, readToken)
				.run();

			return json({ ok: true, userId, ownerToken, readToken });
		}

		// resolve youtube channel url -> UC id
		if (url.pathname === "/api/resolve/youtube" && request.method === "POST") {
			const userOrErr = await requireUser(request, env);
			if (userOrErr instanceof Response) return userOrErr;

			const body = await readJson<{ url: string }>(request);
			const rawUrl = body?.url ?? "";
			let parsed: URL;
			try {
				parsed = new URL(rawUrl);
			} catch {
				return json({ ok: false, error: "invalid_url" }, 400);
			}

			const host = parsed.hostname.replace("www.", "");
			if (host !== "youtube.com" && host !== "m.youtube.com") {
				return json({ ok: false, error: "unsupported_host" }, 400);
			}

			const parts = parsed.pathname.split("/").filter(Boolean);
			if (parts[0] === "channel" && parts[1]?.startsWith("UC")) {
				return json({
					ok: true,
					channelId: parts[1],
					url: `https://www.youtube.com/channel/${parts[1]}`,
				});
			}

			if (parts[0]?.startsWith("@")) {
				const handle = parts[0].slice(1);
				const apiKey = env.YOUTUBE_API_KEY;
				const urlStr =
					"https://www.googleapis.com/youtube/v3/channels" +
					`?part=id&forHandle=${encodeURIComponent(handle)}` +
					`&key=${encodeURIComponent(apiKey)}`;
				const res = await fetch(urlStr);
				if (!res.ok) {
					return json({ ok: false, error: `youtube resolve failed: ${res.status}` }, 502);
				}
				const data: any = await res.json();
				const id = data?.items?.[0]?.id;
				if (!id) {
					return json({ ok: false, error: "not_found" }, 404);
				}
				return json({
					ok: true,
					channelId: id,
					url: `https://www.youtube.com/channel/${id}`,
				});
			}

			return json({ ok: false, error: "unsupported_path" }, 400);
		}

		// admin: maintenance toggle
		if (url.pathname === "/api/admin/maintenance" && request.method === "POST") {
			const denied = requireAdmin(request, env);
			if (denied) return denied;
			const body = await readJson<{ enabled: number }>(request);
			const enabled = body?.enabled === 1 ? "1" : "0";
			await env.STREAM_FEED_DB.prepare(
				"INSERT INTO settings (key, value) VALUES ('maintenance', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
			)
				.bind(enabled)
				.run();
			return json({ ok: true, maintenance: enabled === "1" });
		}

		// sources count (疎通用)
		if (url.pathname === "/api/sources") {
			const userOrErr = await requireUser(request, env);
			if (userOrErr instanceof Response) return userOrErr;
			const { user } = userOrErr;

			try {
				const r1 = await env.STREAM_FEED_DB.prepare("SELECT 1 AS one").first();
				const r2 = await env.STREAM_FEED_DB.prepare(
					"SELECT COUNT(*) AS cnt FROM sources WHERE user_id = ?"
				)
					.bind(user.user_id)
					.first();
				return json({ ok: true, db: { select1: r1, sourcesCount: r2 } });
			} catch (err: any) {
				return json({ ok: false, error: { message: err?.message ?? String(err) } }, 500);
			}
		}

		// ✅ list
		if (url.pathname === "/api/sources/list" && request.method === "GET") {
			const userOrErr = await requireUser(request, env);
			if (userOrErr instanceof Response) return userOrErr;
			const { user } = userOrErr;

			try {
				const enabledOnly = url.searchParams.get("enabled") === "1";

				const sql = enabledOnly
					? `SELECT id, platform, handle, display_name, url, enabled, created_at
             FROM sources
             WHERE user_id = ? AND enabled = 1
             ORDER BY platform ASC, created_at DESC`
					: `SELECT id, platform, handle, display_name, url, enabled, created_at
             FROM sources
             WHERE user_id = ?
             ORDER BY platform ASC, created_at DESC`;

				const { results } = await env.STREAM_FEED_DB.prepare(sql)
					.bind(user.user_id)
					.all<SourceItem>();

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
			const userOrErr = await requireUser(request, env, false);
			if (userOrErr instanceof Response) return userOrErr;
			const { user } = userOrErr;

			try {
				const body = await readJson<UpsertBody>(request);

				if (!body?.id || !body?.platform || !body?.handle) {
					return json({ ok: false, error: "id/platform/handle are required" }, 400);
				}

				const enabled = body.enabled === 0 ? 0 : 1;
				const displayName = body.display_name ?? null;
				const urlStr = body.url ?? null;

				const existed = await env.STREAM_FEED_DB.prepare(
					"SELECT 1 AS x FROM sources WHERE id = ? AND user_id = ? LIMIT 1"
				)
					.bind(body.id, user.user_id)
					.first();

				await env.STREAM_FEED_DB.prepare(
					`INSERT INTO sources (id, user_id, platform, handle, display_name, url, enabled)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             user_id=excluded.user_id,
             platform=excluded.platform,
             handle=excluded.handle,
             display_name=excluded.display_name,
             url=excluded.url,
             enabled=excluded.enabled`
				)
					.bind(body.id, user.user_id, body.platform, body.handle, displayName, urlStr, enabled)
					.run();

				const item = await env.STREAM_FEED_DB.prepare(
					`SELECT id, platform, handle, display_name, url, enabled, created_at
           FROM sources WHERE id = ? AND user_id = ?`
				)
					.bind(body.id, user.user_id)
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
			const userOrErr = await requireUser(request, env, false);
			if (userOrErr instanceof Response) return userOrErr;
			const { user } = userOrErr;

			try {
				const body = await readJson<ToggleBody>(request);
				if (!body?.id || (body.enabled !== 0 && body.enabled !== 1)) {
					return json({ ok: false, error: "id and enabled(0|1) are required" }, 400);
				}

				const r = await env.STREAM_FEED_DB.prepare(
					"UPDATE sources SET enabled = ? WHERE id = ? AND user_id = ?"
				)
					.bind(body.enabled, body.id, user.user_id)
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
			const userOrErr = await requireUser(request, env);
			if (userOrErr instanceof Response) return userOrErr;
			const { user } = userOrErr;

			try {
				const ttlSec = 90;
				const now = Date.now();

				const cacheKey = `feed:${user.user_id}`;
				const cached = await readCache<any>(env, cacheKey);
				if (cached && isFresh(cached.fetchedAt, ttlSec)) {
					return json(cached.items);
				}

				// enabled sources
				const { results } = await env.STREAM_FEED_DB.prepare(
					`SELECT id, platform, handle, display_name, url, enabled, created_at
           FROM sources
           WHERE user_id = ? AND enabled = 1
           ORDER BY platform ASC, created_at DESC`
				)
					.bind(user.user_id)
					.all<SourceItem>();

				const enabledSources = results ?? [];
				const youtubeSources = enabledSources.filter((s) => s.platform === "youtube");
				const twitchSources = enabledSources.filter((s) => s.platform === "twitch");

				const items: FeedItem[] = [];
				const errors: FeedError[] = [];

				for (const s of youtubeSources) {
					try {
						const channelCacheKey = `yt:channel:${s.handle}`;
						const cachedChannel = await readCache<FeedItemBase>(env, channelCacheKey);
						if (cachedChannel && isFresh(cachedChannel.fetchedAt, cachedChannel.ttlSec)) {
							for (const base of cachedChannel.items) {
								items.push({ ...base, sourceId: s.id });
							}
							continue;
						}

						const apiKey = env.YOUTUBE_API_KEY;
						let uploadsId = "";
						const uploadsKey = `yt:uploads:${s.handle}`;
						const cachedUploads = await readCache<{ uploadsId: string }>(env, uploadsKey);
						if (cachedUploads && isFresh(cachedUploads.fetchedAt, cachedUploads.ttlSec)) {
							uploadsId = cachedUploads.items?.uploadsId ?? "";
						}

						if (!uploadsId) {
							const chUrl =
								"https://www.googleapis.com/youtube/v3/channels" +
								`?part=contentDetails&id=${encodeURIComponent(s.handle)}` +
								`&key=${encodeURIComponent(apiKey)}`;
							const chRes = await fetch(chUrl);
							if (!chRes.ok) throw new Error(`youtube channel fetch failed: ${chRes.status}`);
							const chJson: any = await chRes.json();
							uploadsId = chJson?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? "";
							if (!uploadsId) throw new Error("youtube uploads playlist not found");
							await writeCache(env, uploadsKey, { uploadsId }, 86400);
						}

						const listUrl =
							"https://www.googleapis.com/youtube/v3/playlistItems" +
							`?part=contentDetails&playlistId=${encodeURIComponent(uploadsId)}` +
							`&maxResults=6&key=${encodeURIComponent(apiKey)}`;
						const listRes = await fetch(listUrl);
						if (!listRes.ok) throw new Error(`youtube playlist fetch failed: ${listRes.status}`);
						const listJson: any = await listRes.json();
						const videoIds = (listJson?.items ?? [])
							.map((it: any) => it?.contentDetails?.videoId)
							.filter((id: any): id is string => typeof id === "string" && id.length > 0);
						if (videoIds.length === 0) throw new Error("youtube videos not found");

						const vidsUrl =
							"https://www.googleapis.com/youtube/v3/videos" +
							`?part=snippet,liveStreamingDetails&id=${encodeURIComponent(videoIds.join(","))}` +
							`&key=${encodeURIComponent(apiKey)}`;
						const vidsRes = await fetch(vidsUrl);
						if (!vidsRes.ok) throw new Error(`youtube videos fetch failed: ${vidsRes.status}`);
						const vidsJson: any = await vidsRes.json();

						const baseItems: FeedItemBase[] = [];
						for (const v of vidsJson?.items ?? []) {
							const vid = v?.id;
							const sn = v?.snippet;
							const live = v?.liveStreamingDetails ?? {};
							const liveFlag = sn?.liveBroadcastContent ?? "none";
							const status =
								liveFlag === "live" ? "live" : liveFlag === "upcoming" ? "scheduled" : "archive";
							const thumb =
								sn?.thumbnails?.medium?.url ??
								sn?.thumbnails?.high?.url ??
								sn?.thumbnails?.default?.url ??
								null;
							const startAt =
								status === "live"
									? live?.actualStartTime ?? live?.scheduledStartTime ?? null
									: status === "scheduled"
									? live?.scheduledStartTime ?? null
									: null;

							baseItems.push({
								platform: "youtube",
								channelName: sn?.channelTitle ?? s.display_name ?? null,
								title: sn?.title ?? "(no title)",
								url: vid ? `https://www.youtube.com/watch?v=${vid}` : (s.url ?? ""),
								thumbnailUrl: thumb,
								status,
								startAt,
							});
						}

						const liveOrScheduled = baseItems.filter(
							(i) => i.status === "live" || i.status === "scheduled"
						);
						const finalItems =
							liveOrScheduled.length > 0 ? liveOrScheduled : baseItems.slice(0, 3);

						for (const base of finalItems) {
							items.push({ ...base, sourceId: s.id });
						}

						await writeCache(env, channelCacheKey, finalItems, calcYoutubeTtl(finalItems));
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
							const channelCacheKey = `tw:channel:${login.toLowerCase()}`;
							const cachedChannel = await readCache<FeedItemBase>(env, channelCacheKey);
							if (cachedChannel && isFresh(cachedChannel.fetchedAt, cachedChannel.ttlSec)) {
								for (const base of cachedChannel.items) {
									items.push({ ...base, sourceId: s.id });
								}
								continue;
							}

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

							const baseItems: FeedItemBase[] = [];
							for (const it of data) {
								const thumbTemplate = it?.thumbnail_url ?? null;
								const thumb =
									typeof thumbTemplate === "string"
										? thumbTemplate.replace("{width}", "320").replace("{height}", "180")
										: null;
								baseItems.push({
									platform: "twitch",
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

								baseItems.push({
									platform: "twitch",
									channelName,
									title: `${channelName} - Offline`,
									url: `https://www.twitch.tv/${login}`,
									thumbnailUrl: user?.profile_image_url ?? null,
									status: "archive",
									startAt: null,
								});
							}

							for (const base of baseItems) {
								items.push({ ...base, sourceId: s.id });
							}

							const ttl = data.length > 0 ? TW_TTL.live : TW_TTL.offline;
							await writeCache(env, channelCacheKey, baseItems, ttl);
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

				await writeCache(env, cacheKey, payload, ttlSec);

				return json(payload);
			} catch (err: any) {
				return json({ ok: false, error: { message: err?.message ?? String(err) } }, 500);
			}
		}

		return json({ ok: false, error: "Not Found" }, 404);
	},
};
