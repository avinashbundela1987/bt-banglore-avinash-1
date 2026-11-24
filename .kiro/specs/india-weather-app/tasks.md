# Implementation Plan: India Weather App

## Overview

Build a static page (`index.html` + `app.js`) in JavaScript, plus a PowerShell static server. Work proceeds in order: page markup, app logic, local server, then the two checks allowed by the steering file (`node --check` and the manual Pune check). No test files, frameworks, caching, classes, or deployment files are created. `start-server.bat` is created only if path issues occur.

## Tasks

- [x] 1. Create the page
  - [x] 1.1 Create `index.html`
    - Add one `<input id="city">`, one `<button id="go">Get Weather</button>`, one `<div id="result"></div>`
    - Add the footer after `#result`: "Weather data: Open-Meteo. Location data: OpenStreetMap Nominatim."
    - Add inline CSS in a `<style>` block, 20 lines or fewer, no external stylesheet
    - Load `app.js` by relative path at the end of `<body>`
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 8.3, 8.4_

- [x] 2. Implement app logic in `app.js`
  - [x] 2.1 Add helpers and the weather code table
    - `WEATHER_CODES` object: 0, 1-3, 45/48, 51-57, 61-67, 71-77, 80-82, 95-99 with the descriptions from Requirement 5.2
    - `describeCode(code)` returns "Unknown conditions" for missing, non-integer, or unlisted codes
    - `formatValue(value, unit)` returns "N/A" for null or missing, otherwise the raw value followed by the unit
    - `showText(message)` clears `#result` and sets plain text
    - `showWeather(place, current, units, description)` clears `#result` and builds the seven labelled lines with `textContent` (no `innerHTML` with API strings)
    - `fetchJson(url)` uses `fetch` with an `AbortController` and a 10 second timeout, and throws on network error, timeout, or non-OK status
    - _Requirements: 3.2, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

  - [x] 2.2 Implement `getWeather()` and event wiring
    - Use a `busy` flag to ignore submissions while a lookup runs
    - Trim input. Empty shows "Please enter a city name" with no request and no "Loading...". Over 100 characters shows a "too long" message with no request
    - Show "Loading..." (replacing prior content), then call Nominatim with `encodeURIComponent(city)`, `countrycodes=in`, `format=json`, `limit=1`
    - Empty result list shows "City not found in India". Geocoder failure shows "Location lookup failed. Please try again." Neither sends a weather request
    - Read `lat`, `lon`, `display_name` from the first result, then call Open-Meteo with the steering `current=` list and `timezone=Asia%2FKolkata`
    - Weather failure or missing `current` shows "Weather data could not be retrieved. Please try again." with no partial values
    - Reset `busy` in `finally`. Leave the input text unchanged
    - Wire button `click` and input `keydown` (Enter) to `getWeather()`
    - Include no hardcoded city names and no NWS or IMD URLs
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5, 8.5, 8.6_

- [x] 3. Create the local server
  - [x] 3.1 Create `start-server.ps1`
    - `System.Net.HttpListener` on `http://localhost:8080/`, started inside `try`/`catch`. On failure, print the cause and exit without the success line
    - Print "Serving on http://localhost:8080" after a successful start
    - Serve from `$PSScriptRoot`. Map `/` to `index.html`
    - Resolve each path with `[IO.Path]::GetFullPath`. Return 404 if it is outside the root or the file does not exist, and keep serving
    - Content types: `.html` is `text/html`, `.js` is `application/javascript`, anything else `application/octet-stream`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 4. Verify
  - [x] 4.1 Run the syntax check
    - Run `node --check app.js` from the project folder. It must exit 0 with no output
    - _Requirements: 10.1_

  - [x] 4.2 Start the server and check Pune
    - Start `start-server.ps1` as a background process (never a blocking command) and confirm it prints "Serving on http://localhost:8080"
    - If path issues occur, create `start-server.bat` containing `powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"` and start that instead
    - Open http://localhost:8080, submit "Pune", and confirm all seven values appear within 10 seconds
    - Confirm the project folder has no test files and no deployment files
    - _Requirements: 8.1, 8.2, 8.7, 9.8, 9.9, 10.2, 10.3, 10.4_

## Notes

- No property-based tests: the design has no Correctness Properties section, and Requirement 10.4 forbids test files and frameworks.
- Deployment (Netlify or AWS) is out of scope until the user asks.
- Tasks 2.1 and 2.2 both edit `app.js`, so they run in separate waves.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2"] }
  ]
}
```
