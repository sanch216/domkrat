var controls = {
  trafficLevel: 50,
  windSpeed: 2,
  windDirection: 45,
  temperature: -5,
  weather: 'clear',
  useRealWeather: false
};

var onChangeCb = null;

export function getControls() { return Object.assign({}, controls); }

export function initSidebar(onChange) {
  onChangeCb = onChange;
  var container = document.getElementById('sidebarControls');
  if (!container) return;
  renderControls(container);

  var toggle = document.getElementById('sidebarToggle');
  var sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      toggle.innerHTML = sidebar.classList.contains('collapsed') ? '&#9656;' : '&#9666;';
      var layout = sidebar.closest('.app-layout');
      if (layout) layout.style.setProperty('--sidebar-w', sidebar.classList.contains('collapsed') ? '68px' : '280px');
    });
  }
}

function renderControls(container) {
  var disabledSlider = controls.useRealWeather ? ' disabled' : '';
  container.innerHTML =
    '<div class="control-section-title">\u0410\u0442\u043c\u043e\u0441\u0444\u0435\u0440\u0430</div>' +
    '<div class="control-group">' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text-ash);">' +
        '<input type="checkbox" id="chk-real-weather"' + (controls.useRealWeather ? ' checked' : '') + ' style="accent-color:#663af3;">' +
        '\u0420\u0435\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u043e\u0433\u043e\u0434\u0430 (Open-Meteo)' +
      '</label>' +
    '</div>' +
    '<div id="weather-controls" style="' + (controls.useRealWeather ? 'opacity:0.35;pointer-events:none;' : '') + '">' +
    '<div class="control-group">' +
      '<div class="control-label"><span>\u0422\u0435\u043c\u043f\u0435\u0440\u0430\u0442\u0443\u0440\u0430</span><span class="control-value" id="val-temp">' + controls.temperature + '&#176;C</span></div>' +
      '<input class="control-slider" type="range" min="-30" max="40" step="1" value="' + controls.temperature + '" id="slider-temp"' + disabledSlider + '>' +
    '</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c \u0432\u0435\u0442\u0440\u0430</span><span class="control-value" id="val-ws">' + controls.windSpeed + ' \u043c/\u0441</span></div>' +
      '<input class="control-slider" type="range" min="0" max="50" step="0.5" value="' + controls.windSpeed + '" id="slider-ws"' + disabledSlider + '>' +
    '</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>\u041d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u0432\u0435\u0442\u0440\u0430</span><span class="control-value" id="val-wd">' + controls.windDirection + '&#176;</span></div>' +
      '<input class="control-slider" type="range" min="0" max="360" step="5" value="' + controls.windDirection + '" id="slider-wd"' + disabledSlider + '>' +
    '</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>\u041f\u043e\u0433\u043e\u0434\u0430</span></div>' +
      '<select class="control-select" id="sel-weather"' + disabledSlider + '>' +
        '<option value="clear"' + (controls.weather === 'clear' ? ' selected' : '') + '>\u042f\u0441\u043d\u043e</option>' +
        '<option value="rain"' + (controls.weather === 'rain' ? ' selected' : '') + '>\u0414\u043e\u0436\u0434\u044c</option>' +
        '<option value="snow"' + (controls.weather === 'snow' ? ' selected' : '') + '>\u0421\u043d\u0435\u0433</option>' +
      '</select>' +
    '</div>' +
    '</div>' +
    '<div class="control-section-title">\u0413\u043e\u0440\u043e\u0434</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>\u0423\u0440\u043e\u0432\u0435\u043d\u044c \u0442\u0440\u0430\u0444\u0438\u043a\u0430</span><span class="control-value" id="val-tr">' + controls.trafficLevel + '%</span></div>' +
      '<input class="control-slider" type="range" min="0" max="100" step="1" value="' + controls.trafficLevel + '" id="slider-tr">' +
    '</div>' +
    '<div style="margin-top:20px;">' +
      '<button class="btn-pill btn-filled btn-sm" id="btn-sim" style="width:100%;justify-content:center;">\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c</button>' +
    '</div>';

  bind('slider-temp', 'val-temp', function(v) { controls.temperature = +v; return v + '\u00B0C'; });
  bind('slider-ws', 'val-ws', function(v) { controls.windSpeed = +v; return v + ' \u043c/\u0441'; });
  bind('slider-wd', 'val-wd', function(v) { controls.windDirection = +v; return v + '\u00B0'; });
  bind('slider-tr', 'val-tr', function(v) { controls.trafficLevel = +v; return v + '%'; });

  var ws = document.getElementById('sel-weather');
  if (ws) ws.addEventListener('change', function() { controls.weather = ws.value; debouncedChange(); });

  var chk = document.getElementById('chk-real-weather');
  if (chk) chk.addEventListener('change', function() {
    controls.useRealWeather = chk.checked;
    var wc = document.getElementById('weather-controls');
    if (wc) {
      wc.style.opacity = chk.checked ? '0.35' : '1';
      wc.style.pointerEvents = chk.checked ? 'none' : 'auto';
    }
    if (onChangeCb) onChangeCb();
  });

  var btn = document.getElementById('btn-sim');
  if (btn) btn.addEventListener('click', function() { if (onChangeCb) onChangeCb(); });
}

var _debounceTimer = null;
function debouncedChange() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(function() { if (onChangeCb) onChangeCb(); }, 300);
}

function bind(sid, vid, fn) {
  var s = document.getElementById(sid);
  var v = document.getElementById(vid);
  if (s && v) s.addEventListener('input', function() { v.textContent = fn(s.value); debouncedChange(); });
}

export function showEditControls() {
  var c = document.getElementById('sidebarControls');
  if (c) renderControls(c);
}

export function showLiveInfo() {
  var c = document.getElementById('sidebarControls');
  if (!c) return;
  c.innerHTML =
    '<div class="control-section-title">\u041d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435</div>' +
    '<div style="padding:4px 0;font-size:12px;color:var(--text-ash);line-height:1.7;font-weight:300;">' +
      '\u041a\u0430\u0440\u0442\u0430 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442 \u0442\u0440\u0438 \u0441\u043b\u043e\u044f \u043e\u0434\u043d\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e: \u0441\u0435\u0433\u043c\u0435\u043d\u0442\u044b \u0441\u043c\u043e\u0433\u0430 \u043f\u043e \u0441\u0435\u0442\u043a\u0435 \u0443\u043b\u0438\u0446, \u0430\u043d\u0438\u043c\u0430\u0446\u0438\u044e \u0442\u0440\u0430\u0444\u0438\u043a\u0430 \u0438 \u043f\u043e\u0442\u043e\u043a\u0438 \u0432\u0435\u0442\u0440\u0430. \u0410\u0432\u0442\u043e-\u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043a\u0430\u0436\u0434\u044b\u0435 15\u0441.' +
    '</div>' +
    '<div style="margin-top:16px;">' +
      '<button class="btn-pill btn-sm" id="btn-refresh" style="width:100%;justify-content:center;">\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c</button>' +
    '</div>';
  var btn = document.getElementById('btn-refresh');
  if (btn && onChangeCb) btn.addEventListener('click', function() { onChangeCb(); });
}

export function showAiInfo() {
  var c = document.getElementById('sidebarControls');
  if (!c) return;
  c.innerHTML =
    '<div class="control-section-title">AI \u0421\u043e\u0432\u0435\u0442\u043d\u0438\u043a</div>' +
    '<div style="padding:4px 0;font-size:12px;color:var(--text-ash);line-height:1.7;font-weight:300;">' +
      '\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u0432\u043e\u043f\u0440\u043e\u0441 \u043e \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u0435 \u0432\u043e\u0437\u0434\u0443\u0445\u0430, \u0432\u043b\u0438\u044f\u043d\u0438\u0438 \u0444\u0430\u043a\u0442\u043e\u0440\u043e\u0432 \u0438\u043b\u0438 \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u0435 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u0438.' +
    '</div>';
}
