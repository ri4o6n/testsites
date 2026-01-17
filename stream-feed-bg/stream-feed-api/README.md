# Stream Feed API (Cloudflare Workers + D1)

Backend for the stream aggregator.

## Requirements
- Node.js LTS
- Wrangler v4

## D1
- DB name: `stream_feed_db`
- Tables: `sources`, `cache_kv` (see `schema.sql`)

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
- `GET /api/sources/list?enabled=1`
- `POST /api/sources/upsert` (admin)
- `POST /api/sources/toggle` (admin)
- `GET /api/feed`

Admin APIs require `X-ADMIN-TOKEN` header.

## Feed Behavior
- YouTube: live + upcoming, and fallback to latest videos if none.
- Twitch: live streams; if offline, a profile card is returned with `status=archive`.
- `startAt` is UTC ISO 8601; convert to JST on the client.

## Operational Notes
- Rotate `ADMIN_TOKEN` periodically via `wrangler secret put ADMIN_TOKEN`.
- Clear cache with:
  ```
  wrangler d1 execute stream_feed_db --remote --command "DELETE FROM cache_kv WHERE key='feed:default';"
  ```
