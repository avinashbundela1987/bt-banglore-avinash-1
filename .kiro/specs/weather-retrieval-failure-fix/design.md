# Weather Retrieval Failure Bugfix Design

## Overview

Every weather lookup fails because the Open-Meteo request in `getWeather()` (`app.js`) lists an invalid variable, `relative_humidity_2`, in its `current` parameter. Open-Meteo rejects the whole request with HTTP 400, `fetchJson` throws, and the user sees "Weather data could not be retrieved. Please try again." for every city.

The fix is a one-token change in the forecast URL: `relative_humidity_2` becomes `relative_humidity_2m`. No other code changes. `showWeather` already reads `current.relative_humidity_2m` and `current_units.relative_humidity_2m`, so humidity displays correctly once the request succeeds.

## Glossary

- **Bug_Condition (C)**: A request reaches the forecast call with a `current` list containing `relative_humidity_2` and not `relative_humidity_2m`. This holds for every request that passes city lookup.
- **Property (P)**: The forecast request returns HTTP 200 and the app displays place, temperature, feels-like, humidity, wind speed, precipitation, and weather description.
- **Preservation**: All validation messages, error handling, loading/busy behavior, toggles, Enter-key submit, and server behavior that must stay unchanged.
- **getWeather**: Function in `app.js` that validates input, calls Nominatim, then calls Open-Meteo and renders the result.
- **fetchJson**: Helper in `app.js` that fetches with a 10 second timeout and throws on non-OK status.
- **showWeather**: Function in `app.js` that renders the result lines, reading `relative_humidity_2m` from `current`.

## Bug Details

### Bug Condition

The bug manifests whenever a user submits a valid city that Nominatim resolves. `getWeather` builds the forecast URL with the misspelled variable `relative_humidity_2`. Open-Meteo returns HTTP 400, `fetchJson` throws, and the `catch` block shows the generic retrieval error.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type WeatherRequest (city resolved by Nominatim)
  OUTPUT: boolean

  RETURN input.forecastUrl.current CONTAINS "relative_humidity_2"
         AND NOT input.forecastUrl.current CONTAINS "relative_humidity_2m"
END FUNCTION
```

### Examples

- `getWeather("Pune")`: expected weather for Pune; actual "Weather data could not be retrieved. Please try again." (HTTP 400).
- `getWeather("Mumbai")`: same failure, since the URL is identical apart from latitude and longitude.
- Retrying any city: fails every time, because the request itself is invalid.
- Edge case: empty input or an unknown city never reaches the forecast call, so they already behave correctly and must stay that way.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Empty input shows "Please enter a city name".
- Input over 100 characters shows the "City name is too long" message.
- City not found in India shows "City not found in India".
- Nominatim failure shows "Location lookup failed. Please try again."
- Genuine Open-Meteo failure (network, timeout, non-OK, missing `current`) shows "Weather data could not be retrieved. Please try again."
- "Loading..." is shown during a lookup and repeated submissions are ignored until it finishes.
- °C/°F toggle, light/dark toggle, and Enter-key submit behave as before.
- `start-server.ps1` serves `index.html` and `app.js` as before, with no API keys or proxy.

**Scope:**
Only the `current` query parameter string changes. Everything else, including `index.html`, `start-server.ps1`, the Nominatim request, and rendering code, is untouched.

## Hypothesized Root Cause

1. **Typo in variable name (confirmed by direct request)**: `relative_humidity_2` was written instead of `relative_humidity_2m` in the URL string in `getWeather`. The same URL returned HTTP 400 during investigation.
2. **Strict server validation**: Open-Meteo rejects the entire request when any variable is unknown, so the other five valid variables are not returned either.
3. **Generic error message**: `getWeather` collapses all forecast failures into one message, which hid the cause. This is not a defect to fix here (see requirement 3.5).

## Correctness Properties

Property 1: Bug Condition - Forecast request uses valid variables and weather is displayed

_For any_ request where the bug condition holds (the forecast URL contains `relative_humidity_2` without the trailing `m`), the fixed `getWeather` SHALL send a forecast request whose `current` parameter contains only valid variable names (`temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `precipitation`, `weather_code`, `wind_speed_10m`) with `timezone=Asia/Kolkata`, receive HTTP 200, and display place, temperature, feels-like, humidity (from `current.relative_humidity_2m` with its `%` unit), wind speed, precipitation, and weather description.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Non-forecast behavior and error handling unchanged

_For any_ input where the bug condition does NOT hold (empty input, over-long input, city not found, Nominatim failure, genuine Open-Meteo failure, busy state, UI toggles, Enter key, static serving), the fixed code SHALL produce the same result as the original code, preserving all existing messages and behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

**File**: `app.js`

**Function**: `getWeather`

**Specific Changes**:
1. **Correct the variable name**: In the Open-Meteo URL string, replace `relative_humidity_2` with `relative_humidity_2m`.
2. **No other edits**: Leave error handling, rendering, the Nominatim call, `index.html`, and `start-server.ps1` as they are.

## Testing Strategy

### Validation Approach

Per the project rules, testing is minimal: `node --check app.js` for syntax, plus a manual check in the browser. Because the app is browser-only with no test framework, the tests below are described as lightweight checks, not new infrastructure.

### Exploratory Bug Condition Checking

**Goal**: Confirm the root cause before the fix.

**Test Plan**: Request the forecast URL with the current `current` list for a fixed coordinate (Pune: 18.52, 73.86) and inspect the status and body. Then request it with only the variable name corrected.

**Test Cases**:
1. **Unfixed URL**: Request with `relative_humidity_2` returns HTTP 400 (fails on unfixed code).
2. **Corrected URL**: Request with `relative_humidity_2m` returns HTTP 200 with a `current` object.
3. **Browser run on unfixed code**: Enter Pune and observe the retrieval error.

**Expected Counterexamples**:
- HTTP 400 with an error message naming the unknown variable.
- Cause: the misspelled variable name in the URL.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := getWeather_fixed(input)
  ASSERT forecastStatus = 200
         AND result DISPLAYS place, temperature, feels-like, humidity, wind, precipitation, description
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, behavior matches the original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT getWeather_original(input) = getWeather_fixed(input)
END FOR
```

**Testing Approach**: The changed token is isolated to one string, so a small set of manual checks covers preservation. Property-based tooling is not warranted for this demo and would add test infrastructure the project rules exclude.

**Test Plan**: Observe each non-bug path on the unfixed app, then repeat after the fix.

**Test Cases**:
1. **Empty input**: still shows "Please enter a city name".
2. **Unknown city** (for example a nonsense string): still shows "City not found in India".
3. **Toggles and Enter**: °F/°C, dark/light, and Enter submit still work.

### Unit Tests

- `node --check app.js` passes.
- Confirm the URL string in `app.js` contains `relative_humidity_2m` and no bare `relative_humidity_2`.
- Confirm `describeCode` and `formatValue` outputs are unchanged.

### Property-Based Tests

- Not planned. The fix is a single string correction and the project limits testing to a syntax check plus a manual run.

### Integration Tests

- Start `start-server.ps1` as a background process, open http://localhost:8080, enter Pune, and confirm place, temperature, feels-like, humidity (with %), wind speed, precipitation, and description appear.
- Toggle °F after a successful lookup and confirm temperatures convert.
- Disconnect the network (or block the API) and confirm the retrieval error still appears.
