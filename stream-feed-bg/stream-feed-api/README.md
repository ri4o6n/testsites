# Stream Feed API (Cloudflare Workers + D1)

Backend for the stream aggregator.

## Requirements
- Node.js LTS
- Wrangler v4

## D1
- DB name: `stream_feed_db`
- Tables: `sources`, `cache_kv` (see `schema.sql`)

### Migration (existing DB)
If `sources` already exists, run these once:
```
wrangler d1 execute stream_feed_db --remote --command "ALTER TABLE sources ADD COLUMN user_id TEXT;"
```
Create a user and attach existing rows:
```
wrangler d1 execute stream_feed_db --remote --command "INSERT INTO users (user_id, owner_token, read_token) VALUES ('legacy', 'LEGACY_OWNER', 'LEGACY_READ');"
wrangler d1 execute stream_feed_db --remote --command "UPDATE sources SET user_id = 'legacy' WHERE user_id IS NULL;"
```

## Secrets
Set these in Workers:
- `ADMIN_TOKEN`
- `YOUTUBE_API_KEY`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`

Example:
```
wrangler secret put ADMIN_TOKEN
wrangler secret put YOUTUBE_API_KEY
wrangler secret put TWITCH_CLIENT_ID
wrangler secret put TWITCH_CLIENT_SECRET
```

## Deploy
```
wrangler deploy
```

## API Endpoints
- `GET /api/health`
- `POST /api/bootstrap`
- `POST /api/admin/maintenance`
- `GET /api/sources/list?enabled=1`
- `POST /api/sources/upsert` (admin)
- `POST /api/sources/toggle` (admin)
- `GET /api/feed`

Admin APIs require `X-ADMIN-TOKEN` header.
User-scoped APIs require `token` query or `X-USER-TOKEN` header.

## Feed Behavior
- YouTube: live + upcoming, and fallback to latest videos if none.
- Twitch: live streams; if offline, a profile card is returned with `status=archive`.
- `startAt` is UTC ISO 8601; convert to JST on the client.
- Cache: shared per-channel cache to reduce API calls (YouTube TTL is longer than Twitch).

## Operational Notes
- Rotate `ADMIN_TOKEN` periodically via `wrangler secret put ADMIN_TOKEN`.
- Clear cache with:
  ```
  wrangler d1 execute stream_feed_db --remote --command "DELETE FROM cache_kv WHERE key='feed:default';"
  ```
