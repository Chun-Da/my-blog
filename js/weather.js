// ===== Weather Widget =====
(function () {
  var widget = document.getElementById("weather-widget");
  if (!widget) return;

  var CACHE_KEY = "blog_weather";
  var CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  var WMO_ICONS = {
    0: "☀️", 1: "🌤️", 2: "🌤️", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌦️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    66: "🌧️", 67: "🌧️",
    71: "🌨️", 73: "🌨️", 75: "🌨️",
    77: "🌨️",
    80: "🌧️", 81: "🌧️", 82: "🌧️",
    85: "🌨️", 86: "🌨️",
    95: "⛈️", 96: "⛈️", 99: "⛈️"
  };

  function showLoading() {
    widget.innerHTML = '<span class="weather-pulse"></span> Loading weather...';
  }

  function hideWidget() {
    widget.innerHTML = "";
  }

  function render(geo, weather) {
    var location = (geo.city || geo.region || "Unknown") + ", " + (geo.country_name || "");
    var temp = Math.round(weather.current_weather.temperature) + "°C";
    var code = weather.current_weather.weathercode;
    var icon = WMO_ICONS[code] || "☁️";
    var desc = getWeatherDesc(code);
    var wind = weather.current_weather.windspeed;
    var windStr = wind ? " · " + wind + "km/h" : "";

    widget.innerHTML = icon + " " + location + " — " + temp + ", " + desc + windStr;
  }

  var WMO_DESC = {
    0: "天晴",
    1: "大致天晴",
    2: "间多云",
    3: "天阴",
    45: "有雾",
    48: "有冻雾",
    51: "间中有毛毛雨",
    53: "有毛毛雨",
    55: "持续有毛毛雨",
    61: "间中有雨",
    63: "有雨",
    65: "局部地区有大雨",
    66: "有冻雨",
    67: "局部地区有大冻雨",
    71: "间中有雪",
    73: "有雪",
    75: "大雪",
    77: "有雪粒",
    80: "间中有阵雨",
    81: "有阵雨",
    82: "局部地区有狂风大雨",
    85: "间中有阵雪",
    86: "有大阵雪",
    95: "局部地区有雷暴",
    96: "局部地区有雷暴及冰雹",
    99: "局部地区有强烈雷暴及大冰雹"
  };

  function getWeatherDesc(code) {
    return WMO_DESC[code] || "天色不明";
  }

  function fetchWeather(geo) {
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + geo.latitude +
      "&longitude=" + geo.longitude + "&current_weather=true&timezone=auto";
    return fetch(url).then(function (r) { return r.json(); });
  }

  function cacheResult(geo, weather) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ geo: geo, weather: weather, ts: Date.now() }));
    } catch (e) { /* quota exceeded, ignore */ }
  }

  function tryCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (Date.now() - data.ts < CACHE_TTL) return data;
    } catch (e) { /* ignore */ }
    return null;
  }

  function fetchGeo() {
    return fetch("https://ipapi.co/json/").then(function (r) {
      if (!r.ok) throw new Error("ipapi fail");
      return r.json();
    });
  }

  function fetchGeoFallback() {
    return fetch("https://ipinfo.io/json?token=").then(function (r) {
      if (!r.ok) throw new Error("ipinfo fail");
      return r.json().then(function (d) {
        var loc = (d.loc || "0,0").split(",");
        return { city: d.city, region: d.region, country_name: d.country, latitude: parseFloat(loc[0]), longitude: parseFloat(loc[1]) };
      });
    });
  }

  // Main
  var cached = tryCache();
  if (cached) {
    render(cached.geo, cached.weather);
    return;
  }

  showLoading();

  fetchGeo()
    ["catch"](function () { return fetchGeoFallback(); })
    .then(function (geo) {
      return fetchWeather(geo).then(function (weather) {
        cacheResult(geo, weather);
        render(geo, weather);
      });
    })
    ["catch"](function () {
      hideWidget();
    });
})();
