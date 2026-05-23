var controls = {
  trafficLevel: 50,
  windSpeed: 2,
  windDirection: 45,
  temperature: -5,
  weather: 'clear'
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
  container.innerHTML =
    '<div class="control-section-title">Атмосфера</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>Температура</span><span class="control-value" id="val-temp">' + controls.temperature + '&#176;C</span></div>' +
      '<input class="control-slider" type="range" min="-30" max="40" step="1" value="' + controls.temperature + '" id="slider-temp">' +
    '</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>Скорость ветра</span><span class="control-value" id="val-ws">' + controls.windSpeed + ' м/с</span></div>' +
      '<input class="control-slider" type="range" min="0" max="50" step="0.5" value="' + controls.windSpeed + '" id="slider-ws">' +
    '</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>Направление ветра</span><span class="control-value" id="val-wd">' + controls.windDirection + '&#176;</span></div>' +
      '<input class="control-slider" type="range" min="0" max="360" step="5" value="' + controls.windDirection + '" id="slider-wd">' +
    '</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>Погода</span></div>' +
      '<select class="control-select" id="sel-weather">' +
        '<option value="clear"' + (controls.weather === 'clear' ? ' selected' : '') + '>Ясно</option>' +
        '<option value="rain"' + (controls.weather === 'rain' ? ' selected' : '') + '>Дождь</option>' +
        '<option value="snow"' + (controls.weather === 'snow' ? ' selected' : '') + '>Снег</option>' +
      '</select>' +
    '</div>' +
    '<div class="control-section-title">Город</div>' +
    '<div class="control-group">' +
      '<div class="control-label"><span>Уровень трафика</span><span class="control-value" id="val-tr">' + controls.trafficLevel + '%</span></div>' +
      '<input class="control-slider" type="range" min="0" max="100" step="1" value="' + controls.trafficLevel + '" id="slider-tr">' +
    '</div>' +
    '<div style="margin-top:20px;">' +
      '<button class="btn-pill btn-filled btn-sm" id="btn-sim" style="width:100%;justify-content:center;">Запустить</button>' +
    '</div>';

  bind('slider-temp', 'val-temp', function(v) { controls.temperature = +v; return v + '\u00B0C'; });
  bind('slider-ws', 'val-ws', function(v) { controls.windSpeed = +v; return v + ' м/с'; });
  bind('slider-wd', 'val-wd', function(v) { controls.windDirection = +v; return v + '\u00B0'; });
  bind('slider-tr', 'val-tr', function(v) { controls.trafficLevel = +v; return v + '%'; });

  var ws = document.getElementById('sel-weather');
  if (ws) ws.addEventListener('change', function() { controls.weather = ws.value; });

  var btn = document.getElementById('btn-sim');
  if (btn) btn.addEventListener('click', function() { if (onChangeCb) onChangeCb(); });
}

function bind(sid, vid, fn) {
  var s = document.getElementById(sid);
  var v = document.getElementById(vid);
  if (s && v) s.addEventListener('input', function() { v.textContent = fn(s.value); });
}

export function showEditControls() {
  var c = document.getElementById('sidebarControls');
  if (c) renderControls(c);
}

export function showLiveInfo() {
  var c = document.getElementById('sidebarControls');
  if (!c) return;
  c.innerHTML =
    '<div class="control-section-title">Наблюдение</div>' +
    '<div style="padding:4px 0;font-size:12px;color:var(--text-ash);line-height:1.7;font-weight:300;">' +
      'Карта показывает три слоя одновременно: сегменты смога по сетке улиц, анимацию трафика и потоки ветра.' +
    '</div>' +
    '<div style="margin-top:16px;">' +
      '<button class="btn-pill btn-sm" id="btn-refresh" style="width:100%;justify-content:center;">Обновить</button>' +
    '</div>';
  var btn = document.getElementById('btn-refresh');
  if (btn && onChangeCb) btn.addEventListener('click', function() { onChangeCb(); });
}

export function showAiInfo() {
  var c = document.getElementById('sidebarControls');
  if (!c) return;
  c.innerHTML =
    '<div class="control-section-title">AI Советник</div>' +
    '<div style="padding:4px 0;font-size:12px;color:var(--text-ash);line-height:1.7;font-weight:300;">' +
      'Задайте вопрос о качестве воздуха, влиянии факторов или получите рекомендации.' +
    '</div>';
}
