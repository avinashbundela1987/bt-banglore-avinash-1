// India Weather App: helpers and weather code table.

var WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear, partly cloudy, or overcast",
  2: "Mainly clear, partly cloudy, or overcast",
  3: "Mainly clear, partly cloudy, or overcast",
  45: "Fog",
  48: "Fog",
  51: "Drizzle", 52: "Drizzle", 53: "Drizzle", 54: "Drizzle", 55: "Drizzle", 56: "Drizzle", 57: "Drizzle",
  61: "Rain", 62: "Rain", 63: "Rain", 64: "Rain", 65: "Rain", 66: "Rain", 67: "Rain",
  71: "Snow", 72: "Snow", 73: "Snow", 74: "Snow", 75: "Snow", 76: "Snow", 77: "Snow",
  80: "Rain showers", 81: "Rain showers", 82: "Rain showers",
  95: "Thunderstorm", 96: "Thunderstorm", 97: "Thunderstorm", 98: "Thunderstorm", 99: "Thunderstorm"
};

function describeCode(code) {
  if (typeof code !== "number" || !Number.isInteger(code)) {
    return "Unknown conditions";
  }
  if (Object.prototype.hasOwnProperty.call(WEATHER_CODES, code)) {
    return WEATHER_CODES[code];
  }
  return "Unknown conditions";
}

function formatValue(value, unit) {
  if (value === null || value === undefined) {
    return "N/A";
  }
  return String(value) + (unit || "");
}

function showText(message) {
  var result = document.getElementById("result");
  result.textContent = "";
  result.textContent = message;
}

function showWeather(place, current, units, description) {
  var result = document.getElementById("result");
  result.textContent = "";
  current = current || {};
  units = units || {};
  var lines = [
    ["Place", place],
    ["Conditions", description],
    ["Temperature", formatValue(current.temperature_2m, units.temperature_2m)],
    ["Feels like", formatValue(current.apparent_temperature, units.apparent_temperature)],
    ["Humidity", formatValue(current.relative_humidity_2m, units.relative_humidity_2m)],
    ["Wind speed", formatValue(current.wind_speed_10m, units.wind_speed_10m)],
    ["Precipitation", formatValue(current.precipitation, units.precipitation)]
  ];
  for (var i = 0; i < lines.length; i++) {
    var p = document.createElement("p");
    p.textContent = lines[i][0] + ": " + lines[i][1];
    result.appendChild(p);
  }
}

async function fetchJson(url) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, 10000);
  try {
    var response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

var busy = false;

async function getWeather() {
  if (busy) {
    return;
  }
  var city = document.getElementById("city").value.trim();
  if (city === "") {
    showText("Please enter a city name");
    return;
  }
  if (city.length > 100) {
    showText("City name is too long. Please use 100 characters or fewer.");
    return;
  }

  busy = true;
  try {
    showText("Loading...");

    var places;
    try {
      places = await fetchJson(
        "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(city) +
        "&countrycodes=in&format=json&limit=1"
      );
    } catch (e) {
      showText("Location lookup failed. Please try again.");
      return;
    }
    if (!Array.isArray(places) || places.length === 0) {
      showText("City not found in India");
      return;
    }
    var place = places[0];
    if (!place || place.lat === undefined || place.lon === undefined) {
      showText("Location lookup failed. Please try again.");
      return;
    }

    var data;
    try {
      data = await fetchJson(
        "https://api.open-meteo.com/v1/forecast?latitude=" + encodeURIComponent(place.lat) +
        "&longitude=" + encodeURIComponent(place.lon) +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
        "&timezone=Asia%2FKolkata"
      );
    } catch (e) {
      showText("Weather data could not be retrieved. Please try again.");
      return;
    }
    if (!data || typeof data.current !== "object" || data.current === null) {
      showText("Weather data could not be retrieved. Please try again.");
      return;
    }

    showWeather(place.display_name, data.current, data.current_units, describeCode(data.current.weather_code));
  } finally {
    busy = false;
  }
}

document.getElementById("go").addEventListener("click", getWeather);
document.getElementById("city").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    getWeather();
  }
});
