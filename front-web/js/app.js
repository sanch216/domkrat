import { simulateApi } from './api.js';
import { initMap, updateHeatmap, updateTrafficLevel, clearHeatmap, getMap, initPreviewMap } from './map.js';
import { addMarkers, removeMarkers, getCityState, getCityObjects } from './markers.js';
import { WindSystem } from './wind.js';
import { initSidebar, getControls, showEditControls, showLiveInfo, showAiInfo } from './sidebar.js';

let currentMode = 'live';
let windSystem = null;
let appMapInitialized = false;

window.navigateTo = function(view) {
  const landing = document.getElementById('landing');
  const appView = document.getElementById('app-view');
  const navbar = document.getElementById('navbar');

  if (view === 'app') {
    landing.classList.add('hidden');
    appView.classList.remove('hidden');
    navbar.classList.add('hidden');
    if (!appMapInitialized) initAppMap();
  } else {
    appView.classList.add('hidden');
    landing.classList.remove('hidden');
    navbar.classList.remove('hidden');
  }
};

function initNavbar() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('open');
  });

  links.querySelectorAll('[data-nav-link]').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('open');
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768) {
        toggle.classList.remove('active');
        links.classList.remove('open');
      }
    }, 100);
  });
}

function initAppMap() {
  appMapInitialized = true;

  initMap('map', {
    zoom: 12.5,
    pitch: 50,
    bearing: -15,
    onLoad: (map) => {
      windSystem = new WindSystem(document.getElementById('windCanvas'));
      windSystem.init();

      initSidebar(runSimulation);
      initModeButtons();
      initAiChat();

      switchMode('live');
      runSimulation();
    }
  });
}

function initModeButtons() {
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchMode(btn.dataset.mode);
    });
  });
}

function switchMode(mode) {
  currentMode = mode;
  const map = getMap();
  const mapArea = document.getElementById('mapArea');
  const aiPanel = document.getElementById('aiPanel');
  const aqiOverlay = document.getElementById('aqiOverlay');
  const insightOverlay = document.getElementById('insightOverlay');

  if (mode === 'ai') {
    mapArea.classList.add('hidden');
    aiPanel.classList.remove('hidden');
    showAiInfo();
    if (windSystem) windSystem.running = false;
  } else {
    mapArea.classList.remove('hidden');
    aiPanel.classList.add('hidden');
    if (windSystem) { windSystem.running = true; windSystem._loop(); windSystem.resize(); }
  }

  if (mode === 'live') {
    showLiveInfo();
    removeMarkers();
    aqiOverlay.classList.remove('hidden');
    insightOverlay.classList.remove('hidden');
    runSimulation();
  } else if (mode === 'edit') {
    showEditControls();
    if (map) addMarkers(map, runSimulation);
    aqiOverlay.classList.remove('hidden');
    insightOverlay.classList.remove('hidden');
  }
}

async function runSimulation() {
  const controls = getControls();

  if (windSystem) {
    windSystem.update(controls.windSpeed, controls.windDirection);
  }

  updateTrafficLevel(controls.trafficLevel);

  const params = {
    tec_power: 80,
    traffic_level: controls.trafficLevel,
    coal_heating: true,
    wind_direction: controls.windDirection,
    wind_speed: controls.windSpeed
  };

  try {
    const resp = await simulateApi(params);

    if (resp.heatmap_data) {
      updateHeatmap(resp.heatmap_data);
    }

    updateAqi(resp.aqi || 0);

    if (resp.ai_insight) {
      const insightEl = document.getElementById('insightText');
      const insightOverlay = document.getElementById('insightOverlay');
      if (insightEl) insightEl.textContent = resp.ai_insight;
      if (insightOverlay) insightOverlay.classList.remove('hidden');
    }
  } catch (e) {
    console.error('Simulation error:', e);
    updateAqi(0);
    const insightEl = document.getElementById('insightText');
    if (insightEl) insightEl.textContent = 'Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на localhost:8000';
    document.getElementById('insightOverlay')?.classList.remove('hidden');
  }
}

function updateAqi(aqi) {
  const overlay = document.getElementById('aqiOverlay');
  const numberEl = document.getElementById('aqiNumber');
  const statusEl = document.getElementById('aqiStatus');
  const arcEl = document.getElementById('aqiArc');
  if (!overlay || !numberEl) return;

  overlay.classList.remove('hidden');
  numberEl.textContent = aqi;

  const circumference = 2 * Math.PI * 38;
  const progress = Math.min(aqi / 500, 1);
  arcEl.setAttribute('stroke-dasharray', `${circumference * progress} ${circumference}`);

  let color, label;
  if (aqi <= 50) { color = '#0ae448'; label = 'Хорошо'; }
  else if (aqi <= 100) { color = '#ffc533'; label = 'Умеренно'; }
  else if (aqi <= 150) { color = '#ff8709'; label = 'Нездоровое'; }
  else if (aqi <= 200) { color = '#ff3333'; label = 'Плохое'; }
  else { color = '#880e4f'; label = 'Опасное'; }

  numberEl.style.color = color;
  arcEl.setAttribute('stroke', color);
  statusEl.textContent = label;
  statusEl.style.color = color;
  overlay.style.boxShadow = `0 0 20px ${color}30`;
}

function initAiChat() {
  const input = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSendBtn');
  const messages = document.getElementById('aiMessages');
  if (!input || !sendBtn || !messages) return;

  const send = () => {
    const text = input.value.trim();
    if (!text) return;

    appendMsg(messages, text, true);
    input.value = '';

    const typing = document.createElement('div');
    typing.className = 'typing-dots';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const reply = generateAiReply(text);
      appendMsg(messages, reply, false);
    }, 800 + Math.random() * 700);
  };

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
}

function appendMsg(container, text, isUser) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const div = document.createElement('div');
  div.className = `ai-msg ${isUser ? 'user' : 'bot'}`;
  div.innerHTML = `${text}<div class="ai-msg-time">${time}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function generateAiReply(q) {
  const t = q.toLowerCase();
  if (t.includes('тэц') || t.includes('теплоэлектро'))
    return 'ТЭЦ Бишкек — один из главных источников загрязнения. При работе на угле она вносит до 40% в общий AQI. Перевод на газ может снизить выбросы на 60-70%. Рекомендуется поэтапная модернизация с установкой фильтров.';
  if (t.includes('трафик') || t.includes('пробки') || t.includes('машин'))
    return 'Автотранспорт вносит ~35% в загрязнение. Основные проблемы: устаревший автопарк и перегруженность центральных улиц. Развитие общественного транспорта может снизить AQI на 30-50 пунктов.';
  if (t.includes('ветер') || t.includes('погод'))
    return 'Ветер — ключевой природный фактор. При скорости >5 м/с смог активно рассеивается. Бишкек расположен в котловине, что затрудняет естественную вентиляцию, особенно зимой при температурной инверсии.';
  if (t.includes('уголь') || t.includes('отопл'))
    return 'Угольное отопление в частном секторе — третий по значимости источник (~20% AQI). Переход на газовое или электрическое отопление может значительно улучшить качество воздуха зимой.';
  return 'Качество воздуха в Бишкеке зависит от множества факторов: ТЭЦ, трафика, типов отопления и погоды. Попробуйте задать конкретный вопрос о любом из этих факторов.';
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();

  try {
    initPreviewMap('preview-map');
  } catch (e) {}
});
