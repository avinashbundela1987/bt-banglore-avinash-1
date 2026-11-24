# Requirements Document

## Introduction

The India Weather App is a static web page where a user types the name of a city in India and sees the current weather conditions. The app runs entirely in the browser, calls two public APIs directly (no API keys, no proxy, no server-side code), and is served locally on http://localhost:8080 by a PowerShell script. It is built for a 20-minute live workshop demo and must work on the first run.

## Glossary

- **Weather_App**: The static web application made of `index.html` and `app.js`, running in the browser.
- **Geocoder**: The Nominatim search API at `https://nominatim.openstreetmap.org/search`, restricted to India with `countrycodes=in`.
- **Weather_Service**: The Open-Meteo forecast API at `https://api.open-meteo.com/v1/forecast`.
- **Local_Server**: The PowerShell script `start-server.ps1`, which serves the Weather_App files using `System.Net.HttpListener`.
- **Launcher**: The optional batch file `start-server.bat` that starts the Local_Server.
- **City_Input**: The single text input in which the user types a city name.
- **Submit_Button**: The button labelled "Get Weather".
- **Result_Area**: The region of the page that shows the Loading indicator, weather details, or messages.
- **Weather_Code**: The numeric `weather_code` value in the `current` object returned by the Weather_Service.
- **Weather_Description**: The text description of a Weather_Code, produced by a lookup table in `app.js`.
- **Place_Name**: The `display_name` value of the first result returned by the Geocoder.

## Requirements

### Requirement 1: Submit a city name

**User Story:** As a user, I want to type a city name and submit it, so that I can request its weather.

#### Acceptance Criteria

1. THE Weather_App SHALL display exactly one City_Input, exactly one Submit_Button labelled "Get Weather", and exactly one Result_Area on the page when it loads.
2. WHEN the user clicks the Submit_Button, THE Weather_App SHALL start exactly one weather lookup using the City_Input text with leading and trailing whitespace removed.
3. WHEN the user presses the Enter key while the City_Input has focus, THE Weather_App SHALL start exactly one weather lookup using the City_Input text with leading and trailing whitespace removed.
4. IF the City_Input is empty or contains only whitespace when a lookup is requested, THEN THE Weather_App SHALL display "Please enter a city name" in the Result_Area, send zero API requests, and leave the City_Input unchanged.
5. WHEN a lookup starts, THE Weather_App SHALL replace any previous Result_Area content with the text "Loading..." within 100 milliseconds, until the lookup succeeds or fails.
6. WHILE a lookup is in progress, THE Weather_App SHALL ignore further submissions from the Submit_Button or the Enter key, so that no more than one lookup runs at a time.
7. IF the trimmed City_Input text is longer than 100 characters when a lookup is requested, THEN THE Weather_App SHALL display a message in the Result_Area indicating the city name is too long and send zero API requests.

### Requirement 2: Look up the city location

**User Story:** As a user, I want the app to find my city in India, so that the weather shown is for the right place.

#### Acceptance Criteria

1. WHEN a lookup starts with a non-empty city name, THE Weather_App SHALL send one request to the Geocoder with the city name exactly as typed (after removing leading and trailing whitespace) URL-encoded in the `q` parameter, `countrycodes=in`, `format=json`, and `limit=1`.
2. WHEN the Geocoder returns at least one result, THE Weather_App SHALL read `lat` and `lon` (both strings) and `display_name` from the first result and SHALL pass `lat` and `lon` to the weather request.
3. IF the Geocoder returns an empty result list, THEN THE Weather_App SHALL display a message stating that the city was not found in India, SHALL NOT send a weather request, and SHALL clear any previously displayed weather.
4. IF the Geocoder request fails because of a network error, a non-successful response, or no response within 10 seconds, THEN THE Weather_App SHALL display a message stating that the location lookup failed, SHALL NOT send a weather request, and SHALL clear any previously displayed weather.
5. THE Weather_App SHALL use only the text typed by the user as the city name and SHALL contain no hardcoded or stored city names.

### Requirement 3: Fetch current weather

**User Story:** As a user, I want the current conditions for the located city, so that I know what the weather is right now.

#### Acceptance Criteria

1. WHEN the Weather_App has the `lat` and `lon` of a city, THE Weather_App SHALL send one request to the Weather_Service with `current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` and `timezone=Asia/Kolkata`, using the `lat` and `lon` values from the first Geocoder result.
2. THE Weather_App SHALL call the Geocoder and the Weather_Service directly from the browser using `fetch`, with no API key and no proxy.
3. WHEN the Weather_Service responds with a success HTTP status and a `current` object, THE Weather_App SHALL read temperature, feels-like temperature, humidity, wind speed, precipitation, and weather code from the `current` object and units from the `current_units` object, and SHALL replace the "Loading..." indicator with the result.
4. IF a request to the Geocoder or the Weather_Service fails with a network error or a non-success HTTP status, THEN THE Weather_App SHALL remove the "Loading..." indicator, display a message stating that the weather data could not be retrieved, and leave the input field text unchanged.
5. IF the Weather_Service responds with a success HTTP status but the response has no `current` object, THEN THE Weather_App SHALL display the same message as for a failed request, and SHALL NOT display partial weather values.
6. IF a request to the Geocoder or the Weather_Service receives no response within 10 seconds, THEN THE Weather_App SHALL treat the request as failed and display the message stating that the weather data could not be retrieved.

### Requirement 4: Display weather results

**User Story:** As a user, I want to see the key weather values in readable form, so that I can understand the conditions at a glance.

#### Acceptance Criteria

1. WHEN weather data is received from the Weather_Service, THE Weather_App SHALL display all seven items in the Result_Area at the same time: the Place_Name, temperature in °C, feels-like temperature in °C, relative humidity in %, wind speed in km/h, precipitation in mm, and the Weather_Description.
2. WHEN weather data is received from the Weather_Service, THE Weather_App SHALL show each numeric value with the unit label taken from the `current_units` object returned by the Weather_Service, placed directly after the value.
3. WHEN weather data is received from the Weather_Service, THE Weather_App SHALL show each numeric value exactly as returned by the Weather_Service, with no rounding or conversion.
4. IF the `weather_code` value is not covered by the Weather_Description lookup, THEN THE Weather_App SHALL show an "Unknown" description in place of the Weather_Description and still display the other six items.
5. IF a numeric value in the `current` object is null or missing, THEN THE Weather_App SHALL show "N/A" in place of that value and still display the other items.
6. WHEN a new lookup starts, THE Weather_App SHALL remove all previous contents of the Result_Area before showing the "Loading..." indicator, so that no value from the previous lookup remains visible.

### Requirement 5: Describe weather codes

**User Story:** As a user, I want a text description of the weather, so that I do not need to interpret numeric codes.

#### Acceptance Criteria

1. THE Weather_App SHALL map each Weather_Code to a Weather_Description using a lookup table in `app.js`.
2. THE Weather_App SHALL map each integer Weather_Code to exactly one Weather_Description as follows: 0 to "Clear sky"; 1, 2, and 3 to "Mainly clear, partly cloudy, or overcast"; 45 and 48 to "Fog"; 51, 52, 53, 54, 55, 56, and 57 to "Drizzle"; 61, 62, 63, 64, 65, 66, and 67 to "Rain"; 71, 72, 73, 74, 75, 76, and 77 to "Snow"; 80, 81, and 82 to "Rain showers"; 95, 96, 97, 98, and 99 to "Thunderstorm".
3. WHEN the weather result is displayed, THE Weather_App SHALL show the Weather_Description for the Weather_Code in the `current` data of the Open-Meteo response in the result area, alongside the other weather values.
4. IF a Weather_Code is missing from the Open-Meteo response, is not an integer, or is an integer not listed in criterion 2, THEN THE Weather_App SHALL display "Unknown conditions" as the Weather_Description and SHALL continue to display all other weather values.

### Requirement 6: Loading feedback

**User Story:** As a user, I want to know the app is working, so that I do not submit repeatedly.

#### Acceptance Criteria

1. WHEN the user submits a non-empty city name, THE Weather_App SHALL display the text "Loading..." in the Result_Area before the first network request is sent, and SHALL keep it displayed until the lookup completes.
2. WHEN the user submits a non-empty city name, THE Weather_App SHALL replace any previously displayed weather data or error message in the Result_Area with "Loading..." so that "Loading..." is the only content shown.
3. WHEN a lookup completes with weather data, THE Weather_App SHALL replace "Loading..." in the Result_Area with the weather data, and "Loading..." SHALL NOT remain visible.
4. IF a lookup ends with an error (city not found in India, or network or API failure), THEN THE Weather_App SHALL replace "Loading..." in the Result_Area with the corresponding error message, and "Loading..." SHALL NOT remain visible.
5. IF the user submits an empty city name, THEN THE Weather_App SHALL NOT display "Loading..." and SHALL NOT send any network request.

### Requirement 7: Attribution footer and styling

**User Story:** As a user, I want data sources credited, so that I know where the information comes from.

#### Acceptance Criteria

1. WHEN the page finishes loading, THE Weather_App SHALL display, below the result area, the footer line "Weather data: Open-Meteo. Location data: OpenStreetMap Nominatim." with exactly that text.
2. WHILE the page is displayed, THE Weather_App SHALL keep the footer line visible in every state (initial, loading, weather result shown, and error message shown).
3. THE Weather_App SHALL define all styling as inline CSS inside `index.html`, using no more than 20 lines of CSS and no external stylesheet files.

### Requirement 8: Static project structure

**User Story:** As a workshop presenter, I want a minimal static project, so that it runs on first try and can be deployed later without changes.

#### Acceptance Criteria

1. THE Weather_App SHALL consist of exactly the files `index.html`, `app.js`, and `start-server.ps1` in the project folder, with no other files created by the Weather_App.
2. IF path issues occur when starting the Local_Server with `start-server.ps1`, THEN THE Weather_App SHALL add `start-server.bat` as the only additional file.
3. THE Weather_App SHALL reference every local file by a relative path, so that opening it from any folder or static host does not require editing any path.
4. THE Weather_App SHALL run without a build step, meaning the files can be served as-is, and without server-side code, caching, or classes.
5. THE Weather_App SHALL run without API keys, accounts, or sign-in; a first request to Nominatim and Open-Meteo from the browser SHALL succeed without any credential, header, or token supplied by the user.
6. THE Weather_App SHALL send no requests to the National Weather Service API or the IMD API; a review of `app.js` SHALL find no URL for either service.
7. WHEN the user has not requested deployment, THE Weather_App SHALL contain no deployment files, including Netlify configuration files and AWS (S3 or CloudFront) configuration files.

### Requirement 9: Run locally

**User Story:** As a workshop presenter, I want to start the app with one script, so that I can demo it at http://localhost:8080.

#### Acceptance Criteria

1. WHEN the user runs `start-server.ps1`, THE Local_Server SHALL begin listening on port 8080 and print "Serving on http://localhost:8080" within 5 seconds.
2. THE Local_Server SHALL serve files from the folder that contains `start-server.ps1`, regardless of the working directory from which the script is run.
3. WHEN a request is made for the path `/`, THE Local_Server SHALL return the contents of `index.html` with HTTP status 200.
4. WHEN a request is made for an existing `.html` or `.js` file, THE Local_Server SHALL return the file contents with HTTP status 200 and content type `text/html` for `.html` files and `application/javascript` for `.js` files.
5. IF a request is made for a file that does not exist in the served folder, THEN THE Local_Server SHALL return HTTP status 404 and continue serving subsequent requests.
6. IF a request path resolves to a location outside the folder that contains `start-server.ps1`, THEN THE Local_Server SHALL return HTTP status 404 and SHALL NOT return the contents of any file outside that folder.
7. IF port 8080 is already in use or the server fails to start, THEN THE Local_Server SHALL print an error message indicating the cause and exit without printing "Serving on http://localhost:8080".
8. WHERE path issues occur when starting `start-server.ps1`, THE Launcher SHALL provide `start-server.bat`, which runs `powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"`.
9. WHEN the presenter starts the Local_Server during the demo, THE Local_Server SHALL be started as a background process so that the command returns control to the caller within 5 seconds.

### Requirement 10: Basic verification

**User Story:** As a workshop presenter, I want a quick check that the demo works, so that I can trust it before presenting.

#### Acceptance Criteria

1. WHEN `node --check app.js` is run from the project folder, THE Weather_App SHALL pass the syntax check with exit code 0 and no error output.
2. WHEN the city "Pune" is submitted at http://localhost:8080 while the local server is running and the browser has internet access, THE Weather_App SHALL display, within 10 seconds, the place name, temperature (°C), feels-like (°C), humidity (%), wind speed (km/h), precipitation (mm), and weather description in the Result_Area.
3. IF the "Pune" check does not display all seven values within 10 seconds, THEN THE Weather_App SHALL be treated as failing verification, and the presenter SHALL NOT present the demo until the check passes.
4. THE Weather_App SHALL include no test files, test frameworks, or test configuration beyond the `node --check` syntax check and the manual Pune check.
