# Bugfix Requirements Document

## Introduction

For every Indian city a user enters, the app shows a weather retrieval error instead of weather data. City lookup through Nominatim succeeds, but the Open-Meteo forecast request is rejected with HTTP 400 Bad Request. The request's `current` parameter lists an invalid variable name, `relative_humidity_2`, instead of the valid `relative_humidity_2m`. Open-Meteo rejects the whole request when any variable name is unknown, so no weather is ever returned. The same URL fetched directly during investigation returned HTTP 400. This affects every city and blocks the main purpose of the app. The error text in `app.js` is "Weather data could not be retrieved. Please try again."

Investigation found no fault in `index.html` or `start-server.ps1`. The server serves `index.html` and `app.js` correctly, and the Nominatim request follows the steering rules.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user enters any valid Indian city (for example Pune) and requests weather THEN the system sends an Open-Meteo request whose `current` parameter contains the invalid variable `relative_humidity_2`, Open-Meteo responds with HTTP 400, and the system shows "Weather data could not be retrieved. Please try again." instead of weather.

1.2 WHEN the Open-Meteo request fails with HTTP 400 THEN the system gives the user no indication that the failure is caused by the request itself, so retrying never succeeds.

### Expected Behavior (Correct)

2.1 WHEN a user enters any valid Indian city and requests weather THEN the system SHALL send an Open-Meteo request whose `current` parameter contains only valid variable names (`temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `precipitation`, `weather_code`, `wind_speed_10m`) with `timezone=Asia/Kolkata`, receive HTTP 200, and display the place name, temperature, feels-like, humidity, wind speed, precipitation, and weather description.

2.2 WHEN Open-Meteo returns a successful response THEN the system SHALL show the humidity value read from `current.relative_humidity_2m` with its unit from `current_units.relative_humidity_2m` (%), rather than "N/A".

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the input is empty THEN the system SHALL CONTINUE TO show "Please enter a city name".

3.2 WHEN the input is longer than 100 characters THEN the system SHALL CONTINUE TO show the "City name is too long" message.

3.3 WHEN Nominatim returns no result for the typed city within `countrycodes=in` THEN the system SHALL CONTINUE TO show "City not found in India".

3.4 WHEN the Nominatim request fails (network error, timeout, or non-OK status) THEN the system SHALL CONTINUE TO show "Location lookup failed. Please try again."

3.5 WHEN the Open-Meteo request genuinely fails (network error, timeout, non-OK status, or missing `current` object) THEN the system SHALL CONTINUE TO show "Weather data could not be retrieved. Please try again."

3.6 WHEN a lookup is in progress THEN the system SHALL CONTINUE TO show "Loading..." and ignore repeated submissions until it finishes.

3.7 WHEN the user toggles °C/°F or light/dark mode, or presses Enter in the city input THEN the system SHALL CONTINUE TO behave as it does now.

3.8 WHEN the app is served by `start-server.ps1` on http://localhost:8080 THEN the system SHALL CONTINUE TO serve `index.html` and `app.js` with the correct content types, with no API keys and no proxy.

## Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type WeatherRequest (city typed by user, Nominatim returned a result)
  OUTPUT: boolean

  // Every request that reaches the forecast call is affected, because the
  // request URL always contains the invalid variable name.
  RETURN X.forecastUrl.current CONTAINS "relative_humidity_2"
         AND NOT X.forecastUrl.current CONTAINS "relative_humidity_2m"
END FUNCTION
```

```pascal
// Property: Fix Checking
FOR ALL X WHERE isBugCondition(X) DO
  result ← getWeather'(X)
  ASSERT forecastResponse.status = 200
         AND result DISPLAYS place, temperature, feels-like, humidity, wind, precipitation, description
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT getWeather(X) = getWeather'(X)
END FOR
```

Counterexample: `getWeather("Pune")` triggers `GET https://api.open-meteo.com/v1/forecast?...&current=temperature_2m,relative_humidity_2,...` and receives HTTP 400.
