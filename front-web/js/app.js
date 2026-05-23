import { API_URL } from './config.js';
import { initMap, updateSmogSegments, updateTrafficLevel, clearSmogSegments, getMap, resetView, initPreviewMap } from './map.js';
import { addMarkers, removeMarkers, getCityState } from './markers.js';
import { WindSystem } from './wind.js';
import { initSidebar, getControls, showEditControls, showLiveInfo, showAiInfo } from './sidebar.js';

let currentMode = 'live';
let windSystem = null;
let appReady = false;

window.navigateTo = function(view) {
  const landing = document.getElementById('landing');
  const appView = document.getElementById('app-view');
  const navbar = document.getElementById('navbar');

  if (view === 'app') {
    landing.classList.add('hidden');
    appView.classList.remove('hidden');
    navbar.classList.add('hidden');
    if (!appReady) initApp();
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

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (window.innerWidth > 768) {
        toggle.classList.remove('active');
        links.classList.remove('open');
      }
    }, 100);
  });
}

function initApp() {
  appReady = true;

  initMap('map', {
    zoom: 12.5,
    pitch: 50,
    bearing: -15,
    onLoad: () => {
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
  const mapEl = getMap();
  const mapArea = document.getElementById('mapArea');
  const aiPanel = document.getElementById('aiPanel');
  const aqiOv = document.getElementById('aqiOverlay');
  const insOv = document.getElementById('insightOverlay');

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
    resetView();
    aqiOv.classList.remove('hidden');
    insOv.classList.remove('hidden');
    runSimulation();
  } else if (mode === 'edit') {
    showEditControls();
    if (mapEl) addMarkers(mapEl, runSimulation);
    aqiOv.classList.remove('hidden');
    insOv.classList.remove('hidden');
  }
}

async function runSimulation() {
  const c = getControls();
  if (windSystem) windSystem.update(c.windSpeed, c.windDirection);
  updateTrafficLevel(c.trafficLevel);

  const params = {
    tec_power: 80,
    traffic_level: c.trafficLevel,
    coal_heating: true,
    wind_direction: c.windDirection,
    wind_speed: c.windSpeed
  };

  try {
    const resp = await fetch(`${API_URL}/api/v1/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!resp.ok) throw new Error(resp.status);
    const data = await resp.json();

    if (data.heatmap_data) updateSmogSegments(data.heatmap_data);
    updateAqi(data.aqi || 0);

    if (data.ai_insight) {
      const it = document.getElementById('insightText');
      const io = document.getElementById('insightOverlay');
      if (it) it.textContent = data.ai_insight;
      if (io) io.classList.remove('hidden');
    }
  } catch (e) {
    console.error('API:', e);
    updateAqi(0);
    const it = document.getElementById('insightText');
    if (it) it.textContent = 'Нет подключения к серверу. Запустите бэкенд на localhost:8000';
    document.getElementById('insightOverlay')?.classList.remove('hidden');
  }
}

function updateAqi(aqi) {
  const ov = document.getElementById('aqiOverlay');
  const num = document.getElementById('aqiNumber');
  const st = document.getElementById('aqiStatus');
  const arc = document.getElementById('aqiArc');
  if (!ov || !num) return;

  ov.classList.remove('hidden');
  num.textContent = aqi;

  const circ = 2 * Math.PI * 36;
  const prog = Math.min(aqi / 500, 1);
  arc.setAttribute('stroke-dasharray', `${circ * prog} ${circ}`);

  let color, label;
  if (aqi <= 50) { color = '#0ae448'; label = 'Хорошо'; }
  else if (aqi <= 100) { color = '#8dd6ff'; label = 'Умеренно'; }
  else if (aqi <= 150) { color = '#ff8709'; label = 'Нездоровое'; }
  else if (aqi <= 200) { color = '#e53935'; label = 'Плохое'; }
  else { color = '#a0142a'; label = 'Опасное'; }

  num.style.color = color;
  arc.setAttribute('stroke', color);
  st.textContent = label;
  st.style.color = color;
  ov.style.boxShadow = `inset rgba(199,211,234,0.08) 0 1px 1px 0, 0 0 24px ${color}20`;
}

function initAiChat() {
  const inp = document.getElementById('aiInput');
  const btn = document.getElementById('aiSendBtn');
  const msgs = document.getElementById('aiMessages');
  if (!inp || !btn || !msgs) return;

  const send = () => {
    const text = inp.value.trim();
    if (!text) return;
    appendMsg(msgs, text, true);
    inp.value = '';

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(dots);
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(() => {
      dots.remove();
      appendMsg(msgs, aiReply(text), false);
    }, 700 + Math.random() * 800);
  };

  btn.addEventListener('click', send);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
}

function appendMsg(c, text, isUser) {
  const t = new Date();
  const ts = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
  const d = document.createElement('div');
  d.className = `ai-msg ${isUser ? 'user' : 'bot'}`;
  d.innerHTML = `${text}<div class="ai-msg-time">${ts}</div>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function aiReply(q) {
  const t = q.toLowerCase();
  if (t.includes('тэц') || t.includes('теплоэлектро'))
    return 'ТЭЦ Бишкек — крупнейший источник выбросов. На угле даёт до 40% AQI. Перевод на газ снизит выбросы на 60-70%. Рекомендую поэтапную модернизацию с установкой электрофильтров.';
  if (t.includes('трафик') || t.includes('пробки') || t.includes('машин'))
    return 'Автотранспорт — ~35% загрязнения. Основные узлы: Ошский базар, Проспект Чуй. Развитие электротранспорта и BRT-линий снизит AQI на 30-50 пунктов.';
  if (t.includes('ветер') || t.includes('погод'))
    return 'Ветер — главный природный регулятор. При >5 м/с смог рассеивается. Бишкек в котловине — зимой температурная инверсия блокирует вертикальное рассеивание.';
  if (t.includes('уголь') || t.includes('отопл'))
    return 'Угольное отопление — ~20% AQI зимой. Перевод частного сектора на газ/электро кардинально улучшит ситуацию в жилых районах.';
  return 'Качество воздуха зависит от ТЭЦ, трафика, отопления и метеоусловий. Задайте конкретный вопрос о любом факторе для детального анализа.';
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  try { initPreviewMap('preview-map'); } catch (e) {}
});
