# Tiping-for-you

Simple static app that generates formatted documents from JSON templates. To run locally (recommended):

1. Clone the repo

```bash
git clone https://github.com/ajaysingh132/Tiping-for-you.git
cd Tiping-for-you
```

2. Start a simple HTTP server (so fetch() can load template JSON files):

```bash
# Using Python 3
python3 -m http.server 8000
# or using live-server
# npm i -g live-server
# live-server --port=8000
```

3. Open http://localhost:8000 in your browser and test the UI.

Notes:
- I added a templates/manifest.json and sanitized templates/court/petition.json so the app can load categories and templates reliably.
- If you deploy to GitHub Pages, ensure files are served over HTTP(S) (no file://), or adjust paths accordingly.
