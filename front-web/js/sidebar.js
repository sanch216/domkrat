let controls = {
  trafficLevel: 50,
  windSpeed: 2,
  windDirection: 45,
  temperature: -5,
  weather: 'clear'
};

let onChangeCb = null;

export function getControls() { return { ...controls }; }

export function initSidebar(onChange) {
  onChangeCb = onChange;
  const container = document.getElementById('sidebarControls');
  if (!container) return;
  renderControls(container);

  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      toggle.textContent = sidebar.classList.contains('collapsed') ? '▸' : '◂';
    });
  }
}

function renderControls(container) {
  container.innerHTML = `
    <div class="control-section-title">Атмосфера</div>
    <div class="control-group">
      <div class="control-label"><span>🌡️ Температура</span><span class="control-value" id="val-temp">${controls.temperature}°C</span></div>
      <input class="control-slider" type="range" min="-30" max="40" step="1" value="${controls.temperature}" id="slider-temp">
    </div>
    <div class="control-group">
      <div class="control-label"><span>💨 Скорость ветра</span><span class="control-value" id="val-ws">${controls.windSpeed} м/с</span></div>
      <input class="control-slider" type="range" min="0" max="50" step="0.5" value="${controls.windSpeed}" id="slider-ws">
    </div>
    <div class="control-group">
      <div class="control-label"><span>🧭 Направление ветра</span><span class="control-value" id="val-wd">${controls.windDirection}°</span></div>
      <input class="control-slider" type="range" min="0" max="360" step="5" value="${controls.windDirection}" id="slider-wd">
    </div>
    <div class="control-group">
      <div class="control-label"><span>☁️ Погода</span></div>
      <select class="control-select" id="sel-weather">
        <option value="clear" ${controls.weather === 'clear' ? 'selected' : ''}>☀️ Ясно</option>
        <option value="rain" ${controls.weather === 'rain' ? 'selected' : ''}>🌧️ Дождь</option>
        <option value="snow" ${controls.weather === 'snow' ? 'selected' : ''}>🌨️ Снег</option>
      </select>
    </div>
    <div class="control-section-title">Город</div>
    <div class="control-group">
      <div class="control-label"><span>🚗 Трафик</span><span class="control-value" id="val-tr">${controls.trafficLevel}%</span></div>
      <input class="control-slider" type="range" min="0" max="100" step="1" value="${controls.trafficLevel}" id="slider-tr">
    </div>
    <div style="margin-top:20px;">
      <button class="btn-pill btn-filled btn-sm" id="btn-sim" style="width:100%;justify-content:center;">⚡ Запустить</button>
    </div>
  `;

  bind('slider-temp', 'val-temp', v => { controls.temperature = +v; return `${v}°C`; });
  bind('slider-ws', 'val-ws', v => { controls.windSpeed = +v; return `${v} м/с`; });
  bind('slider-wd', 'val-wd', v => { controls.windDirection = +v; return `${v}°`; });
  bind('slider-tr', 'val-tr', v => { controls.trafficLevel = +v; return `${v}%`; });

  const ws = document.getElementById('sel-weather');
  if (ws) ws.addEventListener('change', () => { controls.weather = ws.value; });

  const btn = document.getElementById('btn-sim');
  if (btn) btn.addEventListener('click', () => { if (onChangeCb) onChangeCb(); });
}

function bind(sid, vid, fn) {
  const s = document.getElementById(sid);
  const v = document.getElementById(vid);
  if (s && v) s.addEventListener('input', () => { v.textContent = fn(s.value); });
}

export function showEditControls() {
  const c = document.getElementById('sidebarControls');
  if (c) renderControls(c);
}

export function showLiveInfo() {
  const c = document.getElementById('sidebarControls');
  if (!c) return;
  c.innerHTML = `
    <div class="control-section-title">Наблюдение</div>
    <div style="padding:4px 0;font-size:12px;color:var(--text-ash);line-height:1.7;font-weight:300;">
      Карта показывает три слоя одновременно: сегменты смога, анимацию трафика и потоки ветра.
    </div>
    <div style="margin-top:16px;">
      <button class="btn-pill btn-sm" id="btn-refresh" style="width:100%;justify-content:center;">↻ Обновить</button>
    </div>
  `;
  const btn = document.getElementById('btn-refresh');
  if (btn && onChangeCb) btn.addEventListener('click', () => onChangeCb());
}

export function showAiInfo() {
  const c = document.getElementById('sidebarControls');
  if (!c) return;
  c.innerHTML = `
    <div class="control-section-title">AI Советник</div>
    <div style="padding:4px 0;font-size:12px;color:var(--text-ash);line-height:1.7;font-weight:300;">
      Задайте вопрос о качестве воздуха, влиянии факторов или получите рекомендации.
    </div>
  `;
}
