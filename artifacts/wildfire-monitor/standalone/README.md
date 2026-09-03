# Wildfire Watch — portable version

This folder is a plain HTML/CSS/JavaScript version of the Wildfire Watch dashboard. It does not need React, Vite, TypeScript, npm, or a build step.

## Run it locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

You can also put this folder in a GitHub repository and enable GitHub Pages. The relative file paths are intentional so it works from a repository subfolder.

## Connect the Raspberry Pi

Open `app.js` and set the one configuration variable near the top:

```js
const RASPBERRY_PI_API_URL = 'http://192.168.1.42:5000/api/readings';
```

The Flask endpoint should return:

```json
{
  "zones": [
    { "id": "A", "temperature": 82, "moisture": 35, "smoke": 12 },
    { "id": "B", "temperature": 91, "moisture": 18, "smoke": 75 },
    { "id": "C", "temperature": 84, "moisture": 42, "smoke": 11 },
    { "id": "D", "temperature": 79, "moisture": 50, "smoke": 7 }
  ]
}
```

The browser needs permission to call the dashboard from the Pi. Add CORS support to Flask, for example with `flask-cors`, when the dashboard and Pi are on different origins. If the request fails, the dashboard automatically shows demo data instead.