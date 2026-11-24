---
inclusion: always
---

# Weather app for India: live demo rules

This project is a live demo for workshop participants. It must work on the first run, with no API keys, no accounts, and no server-side code.

## Scope

- Keep the design simple. The goal is to complete the project in 20 minutes.
- The app shows current weather conditions for a city in India that the user types.
- Use HTML and JavaScript. Do not implement caching, classes, or interfaces.
- Create only these files: `index.html`, `app.js`, `start-server.ps1`, and `start-server.bat` (only if path issues occur).
- Keep everything static (no build step, no server code, relative paths only) so the app can be deployed later to Netlify or AWS (S3 and CloudFront) without changes.

## Data sources (both verified working, no API key, CORS enabled)

- City lookup: Nominatim, restricted to India.
  `https://nominatim.openstreetmap.org/search?q=<city>&countrycodes=in&format=json&limit=1`
  - Pass the city name the user typed directly into `q` (use `encodeURIComponent`).
  - Do not hardcode or store city names in the app code.
  - Read `lat`, `lon` (both strings), and `display_name` from the first result.
- Current weather: Open-Meteo.
  `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`
  - Read values from the `current` object. Units are in `current_units` (°C, %, mm, km/h).
- Call both APIs directly from the browser with `fetch`. Do not add a proxy.
- Do not use the National Weather Service API (US only). Do not use the IMD API in this demo, because it needs a registered API key that cannot be placed in browser code.

## UI

- One text input, one "Get Weather" button, and a result area. Pressing Enter in the input also submits.
- Show: the place name (`display_name`), temperature (°C), feels-like (°C), humidity (%), wind speed (km/h), precipitation (mm), and a text description of `weather_code`.
- Map `weather_code` to text with a small lookup in app.js: 0 Clear sky, 1-3 Mainly clear or partly cloudy or overcast, 45 and 48 Fog, 51-57 Drizzle, 61-67 Rain, 71-77 Snow, 80-82 Rain showers, 95-99 Thunderstorm.
- Show "Loading..." while fetching.
- Show clear messages for: empty input ("Please enter a city name"), city not found in India, and network or API failure.
- Show a footer line: "Weather data: Open-Meteo. Location data: OpenStreetMap Nominatim."
- Keep styling minimal (a few lines of inline CSS in `index.html`).

## Running locally

- Run the app on http://localhost:8080 using the PowerShell script `start-server.ps1`. It starts a local HTTP server using `System.Net.HttpListener` that serves files from the script's own folder (`$PSScriptRoot`), returns `index.html` for `/`, and sets correct content types for `.html` and `.js`.
- Print "Serving on http://localhost:8080" when the server starts.
- If you face path issues trying to start the web app, create `start-server.bat` that runs `powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"`.
- Start the server as a background process. Never run it as a blocking command.

## Testing

- Limit the unit test code to only basic testing. If `node --check app.js` passes, the JavaScript is valid. No further test infrastructure is needed.
- Before calling the demo done, open http://localhost:8080 and confirm that a city such as Pune returns weather.

## Later: deployment

- Deployment to Netlify (using the Netlify power) or AWS happens after the app works locally. Do not add deployment files until the user asks.
