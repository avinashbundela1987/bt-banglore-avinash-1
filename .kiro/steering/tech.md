# Tech

## Stack
- Plain HTML and vanilla JavaScript (ES5-style `var`, `async/await`, `fetch`). No build step, no framework, no npm dependencies.
- No classes, interfaces, or caching.
- APIs called directly from the browser (no proxy, no keys):
  - Nominatim (`countrycodes=in`, `limit=1`) for city lookup. Pass the typed city through `encodeURIComponent`. Never hardcode city names.
  - Open-Meteo `current` forecast with `timezone=Asia/Kolkata`. Values are read from `current` and units from `current_units`.
- Do not use the NWS or IMD APIs.
- Keep CSS minimal and inline in `index.html`. Use relative paths only so the app deploys unchanged.

## Commands (Windows)
- Syntax check: `node --check app.js` (the only testing required).
- Run locally: `powershell -ExecutionPolicy Bypass -File start-server.ps1` serves http://localhost:8080. Always start it as a background process, never blocking.
- Only if path issues occur, add `start-server.bat` running `powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"`.
- Before calling the demo done, open http://localhost:8080 and confirm Pune returns weather.
