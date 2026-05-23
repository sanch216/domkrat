let controls = {
  trafficLevel: 50,
  windSpeed: 2,
  windDirection: 45,
  temperature: -5,
  weather: 'clear'
};

let onChangeCallback = null;

export function getControls() { return { ...controls }; }

export function initSidebar(onChange) {
  onChangeCallback = onChange;
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
    <div class="control-section-title">ПОГОДНЫЕ УСЛОВИЯ</div>

    <div class="control-group">
      <div class="control-label">
        <span>🌡️ Температура</span>
        <span class="control-value" id="val-temp">${controls.temperature}°C</span>
      </div>
      <input class="control-slider" type="range" min="-30" max="40" step="1" value="${controls.temperature}" id="slider-temp">
    </div>

    <div class="control-group">
      <div class="control-label">
        <span>💨 Скорость ветра</span>
        <span class="control-value" id="val-wind-speed">${controls.windSpeed} м/с</span>
      </div>
      <input class="control-slider" type="range" min="0" max="50" step="0.5" value="${controls.windSpeed}" id="slider-wind-speed">
    </div>

    <div class="control-group">
      <div class="control-label">
        <span>🧭 Направление ветра</span>
        <span class="control-value" id="val-wind-dir">${controls.windDirection}°</span>
      </div>
      <input class="control-slider" type="range" min="0" max="360" step="5" value="${controls.windDirection}" id="slider-wind-dir">
    </div>

    <div class="control-group">
      <div class="control-label">
        <span>☁️ Погода</span>
      </div>
      <select class="control-select" id="select-weather">
        <option value="clear" ${controls.weather === 'clear' ? 'selected' : ''}>☀️ Ясно</option>
        <option value="rain" ${controls.weather === 'rain' ? 'selected' : ''}>🌧️ Дождь</option>
        <option value="snow" ${controls.weather === 'snow' ? 'selected' : ''}>🌨️ Снег</option>
      </select>
    </div>

    <div class="control-section-title">ГОРОДСКАЯ СРЕДА</div>

    <div class="control-group">
      <div class="control-label">
        <span>🚗 Общий уровень трафика</span>
        <span class="control-value" id="val-traffic">${controls.trafficLevel}%</span>
      </div>
      <input class="control-slider" type="range" min="0" max="100" step="1" value="${controls.trafficLevel}" id="slider-traffic">
    </div>

    <div style="margin-top:24px;">
      <button class="btn-pill btn-green" id="btn-simulate" style="width:100%;justify-content:center;">⚡ Запустить симуляцию</button>
    </div>
  `;

  bindSlider('slider-temp', 'val-temp', v => { controls.temperature = parseFloat(v); return `${v}°C`; });
  bindSlider('slider-wind-speed', 'val-wind-speed', v => { controls.windSpeed = parseFloat(v); return `${v} м/с`; });
  bindSlider('slider-wind-dir', 'val-wind-dir', v => { controls.windDirection = parseFloat(v); return `${v}°`; });
  bindSlider('slider-traffic', 'val-traffic', v => { controls.trafficLevel = parseFloat(v); return `${v}%`; });

  const weatherSelect = document.getElementById('select-weather');
  if (weatherSelect) {
    weatherSelect.addEventListener('change', () => {
      controls.weather = weatherSelect.value;
    });
  }

  const simBtn = document.getElementById('btn-simulate');
  if (simBtn) {
    simBtn.addEventListener('click', () => {
      if (onChangeCallback) onChangeCallback();
    });
  }
}

function bindSlider(sliderId, valueId, updater) {
  const slider = document.getElementById(sliderId);
  const valueEl = document.getElementById(valueId);
  if (!slider || !valueEl) return;

  slider.addEventListener('input', () => {
    valueEl.textContent = updater(slider.value);
  });
}

export function showEditControls() {
  const container = document.getElementById('sidebarControls');
  if (container) renderControls(container);
}

export function showLiveInfo() {
  const container = document.getElementById('sidebarControls');
  if (!container) return;
  container.innerHTML = `
    <div class="control-section-title">РЕЖИМ НАБЛЮДЕНИЯ</div>
    <div style="padding:8px 0;font-size:13px;color:var(--text-secondary);line-height:1.6;">
      На карте одновременно отображаются три слоя: тепловая карта смога, дорожный трафик и анимация ветра.<br><br>
      Данные обновляются автоматически при загрузке.
    </div>
    <div style="margin-top:16px;">
      <button class="btn-pill btn-green btn-sm" id="btn-refresh-live" style="width:100%;justify-content:center;">↻ Обновить данные</button>
    </div>
  `;

  const btn = document.getElementById('btn-refresh-live');
  if (btn && onChangeCallback) {
    btn.addEventListener('click', () => onChangeCallback());
  }
}

export function showAiInfo() {
  const container = document.getElementById('sidebarControls');
  if (!container) return;
  container.innerHTML = `
    <div class="control-section-title">AI СОВЕТНИК</div>
    <div style="padding:8px 0;font-size:13px;color:var(--text-secondary);line-height:1.6;">
      Задайте вопрос ИИ-помощнику о качестве воздуха, влиянии факторов или рекомендациях.
    </div>
  `;
}
