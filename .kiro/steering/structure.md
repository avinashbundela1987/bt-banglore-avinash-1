# Structure

```
index.html          Page: input #city, button #go, result area #result, footer credit, inline CSS
app.js              Weather code lookup, fetch helpers, getWeather(), DOM event wiring
start-server.ps1    Local HttpListener server on :8080, serves files from $PSScriptRoot
.kiro/steering/     Steering rules
.kiro/specs/india-weather-app/   requirements.md, design.md, tasks.md
```

## Conventions
- Only create `index.html`, `app.js`, `start-server.ps1`, and (if needed) `start-server.bat`. Do not add deployment files until asked.
- `app.js` uses top-level functions and a `WEATHER_CODES` table. User-facing text is set with `textContent`, never `innerHTML`.
- Footer text: "Weather data: Open-Meteo. Location data: OpenStreetMap Nominatim."
- Keep the design simple. The project should be finishable in about 20 minutes.
