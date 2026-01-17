# Stream Feed (Frontend)

Static frontend for the Stream Aggregator API. Built with plain HTML/CSS/JS.

## Files
- `index.html`
- `styles.css`
- `app.js`

## Configure API URL
Edit `app.js` and update `CONFIG.API_URL` if needed.

## Local Preview
Any static file server is OK. Example:

```
python -m http.server 8000
```

Then open `http://localhost:8000/stream-feed/`.

## GitHub Pages
GitHub Pages expects content at repo root or `/docs`.
Recommended options:

1) Create a dedicated repo and place these three files at the repo root.
2) Copy the contents of `stream-feed/` to a `/docs` folder and set Pages to `/docs`.

No build step required.
