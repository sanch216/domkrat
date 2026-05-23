import { API_URL, WS_URL } from './config.js';
import { initMap, updateSmogSegments, updateSegmentIntensities, updateTrafficLevel, clearSmogSegments, getMap, resetView, initPreviewMap, STREET_LATS, STREET_LNGS } from './map.js';
import { addMarkers, removeMarkers, getCityObjects, getCityState } from './markers.js';
import { WindSystem } from './wind.js';
import { initSidebar, getControls, showEditControls, showLiveInfo, showAiInfo } from './sidebar.js';

var currentMode = 'live';
var windSystem = null;
var appReady = false;
var ws = null;
var wsReconnectTimer = null;

// ---------------------------------------------------------------------------
// WebSocket — подключение к бэкенду
// ---------------------------------------------------------------------------
function connectWs() {
  if (ws && ws.readyState <= 1) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = function() {
    console.log('[WS] Connected');
    runSimulation();
  };

  ws.onmessage = function(event) {
    try {
      var data = JSON.parse(event.data);
      if (data.heatmap_data) updateSmogSegments(data.heatmap_data);
      if (data.aqi !== undefined) updateAqi(data.aqi);
      if (data.ai_insight || data.predicted_aqi !== null) {
        var it = document.getElementById('insightText');
        var io = document.getElementById('insightOverlay');
        var text = data.ai_insight || '';
        if (data.predicted_aqi !== undefined && data.predicted_aqi !== null) {
          text += ' \ud83d\udcca \u041f\u0440\u043e\u0433\u043d\u043e\u0437 AQI \u0447\u0435\u0440\u0435\u0437 12\u0447: ' + data.predicted_aqi;
        }
        if (it) it.textContent = text;
        if (io) io.classList.remove('hidden');
      }
    } catch (e) {
      console.warn('[WS] Parse error:', e);
    }
  };

  ws.onclose = function() {
    console.log('[WS] Disconnected, reconnecting in 2s...');
    wsReconnectTimer = setTimeout(connectWs, 2000);
  };

  ws.onerror = function() {
    ws.close();
  };
}

function sendWs(data) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

// ---------------------------------------------------------------------------
// Навигация Landing <-> App
// ---------------------------------------------------------------------------
window.navigateTo = function(view) {
  var landing = document.getElementById('landing');
  var appView = document.getElementById('app-view');
  var navbar = document.getElementById('navbar');

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

// ---------------------------------------------------------------------------
// Landing — анимации
// ---------------------------------------------------------------------------
function initNavbar() {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function() {
    toggle.classList.toggle('active');
    links.classList.toggle('open');
  });

  links.querySelectorAll('[data-nav-link]').forEach(function(a) {
    a.addEventListener('click', function() {
      toggle.classList.remove('active');
      links.classList.remove('open');
    });
  });

  var rt;
  window.addEventListener('resize', function() {
    clearTimeout(rt);
    rt = setTimeout(function() {
      if (window.innerWidth > 768) {
        toggle.classList.remove('active');
        links.classList.remove('open');
      }
    }, 100);
  });
}

function initScrollReveal() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(function(el) {
    observer.observe(el);
  });
}

function initMouseGlow() {
  var glow = document.getElementById('mouseGlow');
  var landing = document.getElementById('landing');
  if (!glow || !landing) return;

  landing.addEventListener('mousemove', function(e) {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

function initCounterAnimation() {
  var statsBar = document.getElementById('statsBar');
  if (!statsBar) return;

  var counted = false;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !counted) {
        counted = true;
        statsBar.querySelectorAll('.stat-value[data-count]').forEach(function(el) {
          var target = parseInt(el.getAttribute('data-count'));
          var current = 0;
          var step = Math.ceil(target / 35);
          var timer = setInterval(function() {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = current;
          }, 40);
        });
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statsBar);
}

function initParallax() {
  var heroGlow = document.querySelector('.hero-glow');
  if (!heroGlow) return;

  window.addEventListener('scroll', function() {
    var y = window.scrollY;
    heroGlow.style.transform = 'translateX(-50%) translateY(' + (y * 0.25) + 'px)';
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// App — инициализация
// ---------------------------------------------------------------------------
function initApp() {
  appReady = true;

  initMap('map', {
    zoom: 12.5,
    pitch: 50,
    bearing: -15,
    onLoad: function() {
      windSystem = new WindSystem(document.getElementById('windCanvas'));
      windSystem.init();
      initSidebar(runSimulation);
      initModeButtons();
      initAiChat();
      connectWs();
      switchMode('live');
    }
  });
}

function initModeButtons() {
  document.querySelectorAll('.sidebar-nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.sidebar-nav-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      switchMode(btn.dataset.mode);
    });
  });
}

var liveInterval = null;

function switchMode(mode) {
  currentMode = mode;
  var mapEl = getMap();
  var mapArea = document.getElementById('mapArea');
  var aiPanel = document.getElementById('aiPanel');
  var aqiOv = document.getElementById('aqiOverlay');
  var insOv = document.getElementById('insightOverlay');

  // Останавливаем авто-обновление при смене режима
  if (liveInterval) { clearInterval(liveInterval); liveInterval = null; }

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
    // Авто-обновление каждые 15 секунд
    liveInterval = setInterval(runSimulation, 15000);
  } else if (mode === 'edit') {
    showEditControls();
    if (mapEl) addMarkers(mapEl, runSimulation);
    aqiOv.classList.remove('hidden');
    insOv.classList.remove('hidden');
  }
}

// ---------------------------------------------------------------------------
// Симуляция — собираем данные и отправляем по WebSocket
// ---------------------------------------------------------------------------
function runSimulation() {
  var c = getControls();

  // Обновляем визуальные элементы клиента
  if (windSystem) windSystem.update(c.windSpeed, c.windDirection);
  updateTrafficLevel(c.trafficLevel);

  // Собираем city_state из маркеров
  var cityState = getCityState();

  // Формируем запрос для бэкенда (SimulationParams)
  var params = {
    active_mode: currentMode,
    city_state: cityState,
    weather: {
      wind_direction: c.windDirection,
      wind_speed: c.windSpeed,
      temperature: c.temperature,
      weather_type: c.weather
    },
    use_real_weather: c.useRealWeather,
    traffic_level: c.trafficLevel
  };

  // Отправляем по WebSocket
  sendWs(params);
}

// ---------------------------------------------------------------------------
// AQI — визуализация
// ---------------------------------------------------------------------------
function updateAqi(aqi) {
  var ov = document.getElementById('aqiOverlay');
  var num = document.getElementById('aqiNumber');
  var st = document.getElementById('aqiStatus');
  var arc = document.getElementById('aqiArc');
  if (!ov || !num) return;

  ov.classList.remove('hidden');
  num.textContent = aqi;

  var circ = 2 * Math.PI * 36;
  var prog = Math.min(aqi / 500, 1);
  arc.setAttribute('stroke-dasharray', (circ * prog) + ' ' + circ);

  var color, label;
  if (aqi <= 50) { color = '#0ae448'; label = '\u0425\u043e\u0440\u043e\u0448\u043e'; }
  else if (aqi <= 100) { color = '#8dd6ff'; label = '\u0423\u043c\u0435\u0440\u0435\u043d\u043d\u043e'; }
  else if (aqi <= 150) { color = '#ff8709'; label = '\u041d\u0435\u0437\u0434\u043e\u0440\u043e\u0432\u043e\u0435'; }
  else if (aqi <= 200) { color = '#e53935'; label = '\u041f\u043b\u043e\u0445\u043e\u0435'; }
  else { color = '#a0142a'; label = '\u041e\u043f\u0430\u0441\u043d\u043e\u0435'; }

  num.style.color = color;
  arc.setAttribute('stroke', color);
  st.textContent = label;
  st.style.color = color;
  ov.style.boxShadow = 'inset rgba(199,211,234,0.08) 0 1px 1px 0, 0 0 24px ' + color + '20';
}

// ---------------------------------------------------------------------------
// AI Chat — реальный вызов бэкенда через /api/v1/chat
// ---------------------------------------------------------------------------
function initAiChat() {
  var inp = document.getElementById('aiInput');
  var btn = document.getElementById('aiSendBtn');
  var msgs = document.getElementById('aiMessages');
  if (!inp || !btn || !msgs) return;

  var send = function() {
    var text = inp.value.trim();
    if (!text) return;
    appendMsg(msgs, text, true);
    inp.value = '';

    var dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(dots);
    msgs.scrollTop = msgs.scrollHeight;

    fetch(API_URL + '/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      dots.remove();
      appendMsg(msgs, data.reply || '\u041d\u0435\u0442 \u043e\u0442\u0432\u0435\u0442\u0430 \u043e\u0442 AI.', false);
    })
    .catch(function() {
      dots.remove();
      appendMsg(msgs, '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f \u043a AI.', false);
    });
  };

  btn.addEventListener('click', send);
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') send(); });
}

function appendMsg(c, text, isUser) {
  var t = new Date();
  var ts = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
  var d = document.createElement('div');
  d.className = 'ai-msg ' + (isUser ? 'user' : 'bot');
  d.innerHTML = text + '<div class="ai-msg-time">' + ts + '</div>';
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

// ---------------------------------------------------------------------------
// DOMContentLoaded — Landing
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
  initNavbar();
  initScrollReveal();
  initMouseGlow();
  initCounterAnimation();
  initParallax();
  try { initPreviewMap('preview-map'); } catch (e) {}
});
