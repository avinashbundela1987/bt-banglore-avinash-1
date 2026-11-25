# Implementation Plan

## Overview

Fix the Open-Meteo HTTP 400 by correcting `relative_humidity_2` to `relative_humidity_2m` in `app.js`. Verification is limited to `node --check app.js` and a manual Pune check on http://localhost:8080, per the project rules.

## Tasks

- [x] 1. Write bug condition exploration check
  - **Property 1: Bug Condition** - Forecast request with `relative_humidity_2` returns HTTP 400
  - **IMPORTANT**: Run this BEFORE implementing the fix
  - **GOAL**: Confirm the root cause. Per project rules, no test framework is added; this is a lightweight manual check
  - Scoped to the concrete failing case: Pune (latitude 18.52, longitude 73.86) with `current` containing `relative_humidity_2`
  - Start the server as a background process with `powershell -ExecutionPolicy Bypass -File start-server.ps1`, open http://localhost:8080, enter Pune, and observe "Weather data could not be retrieved. Please try again."
  - **EXPECTED OUTCOME**: Check FAILS on unfixed code (error shown instead of weather), which confirms the bug
  - Document the counterexample: `getWeather("Pune")` sends `current=...relative_humidity_2,...` and receives HTTP 400
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation checks (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-forecast behavior and error handling unchanged
  - **IMPORTANT**: Follow observation-first methodology. Property-based tooling is not used, per design and project rules
  - Observe on UNFIXED app: empty input shows "Please enter a city name"
  - Observe on UNFIXED app: a nonsense city shows "City not found in India"
  - Observe on UNFIXED app: °C/°F toggle, light/dark toggle, and Enter-key submit work
  - **EXPECTED OUTCOME**: All checks PASS on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix for Open-Meteo HTTP 400 on every weather lookup

  - [x] 3.1 Implement the fix
    - In `app.js`, function `getWeather`, change `relative_humidity_2` to `relative_humidity_2m` in the Open-Meteo URL `current` parameter
    - Make no other edits (not `index.html`, `start-server.ps1`, error handling, or rendering)
    - Run `node --check app.js` and confirm it passes
    - Confirm the URL string contains `relative_humidity_2m` and no bare `relative_humidity_2`
    - _Bug_Condition: isBugCondition(input) where input.forecastUrl.current CONTAINS "relative_humidity_2" AND NOT CONTAINS "relative_humidity_2m"_
    - _Expected_Behavior: forecast status 200 and result displays place, temperature, feels-like, humidity (with %), wind, precipitation, description_
    - _Preservation: Preservation Requirements from design_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 3.2 Verify bug condition exploration check now passes
    - **Property 1: Expected Behavior** - Forecast succeeds and weather is displayed
    - **IMPORTANT**: Re-run the SAME check from task 1, do not write a new one
    - Reload http://localhost:8080 (server running in the background), enter Pune, and confirm place, temperature, feels-like, humidity with %, wind speed, precipitation, and description appear
    - **EXPECTED OUTCOME**: Check PASSES (bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation checks still pass
    - **Property 2: Preservation** - Non-forecast behavior and error handling unchanged
    - **IMPORTANT**: Re-run the SAME checks from task 2, do not write new ones
    - Confirm empty input, unknown city, °C/°F toggle, light/dark toggle, and Enter submit behave as before
    - **EXPECTED OUTCOME**: Checks PASS (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 4. Checkpoint - Ensure all checks pass
  - Ensure `node --check app.js` passes and the Pune check works on localhost:8080. Ask the user if questions arise.

## Notes

- Tasks 1 and 2 run on the unfixed code and must finish before task 3.
- The local server must be started as a background process, never as a blocking command.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["4"] }
  ]
}
```
