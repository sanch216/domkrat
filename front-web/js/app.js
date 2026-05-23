import { API_URL, WS_URL } from './config.js';
import { initMap, updateSmogSegments, updateSegmentIntensities, updateTrafficLevel, clearSmogSegments, getMap, resetView, initPreviewMap, STREET_LATS, STREET_LNGS } from './map.js';
import { addMarkers, removeMarkers, getCityObjects, getCityState, resetCityState } from './markers.js';
import { WindSystem } from './wind.js';
import { initSidebar, getControls, showEditControls, showLiveInfo, showAiInfo } from './sidebar.js';

var currentMode = 'live';
var windSystem = null;
var appReady = false;
var ws = null;
var wsReconnectTimer = null;
var liveInterval = null;

// ---------------------------------------------------------------------------
// Emission factors for local fallback computation
// ---------------------------------------------------------------------------
var EMISSION_FACTORS = {
  coal_full: 0.9, coal_reduced: 0.55, gas_converted: 0.15, off: 0,
  full_load: 0.7, reduced: 0.35, idle: 0.08, shutdown: 0,
  coal_heating: 0.45, gas_heating: 0.12, electric_heating: 0.03, no_heating: 0,
  congested: 0.4, moderate: 0.2, free_flow: 0.08, closed: 0,
  active: -0.08, inactive: 0
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
window.showNotification = function(text, type) {
  var container = document.getElementById('notifContainer');
  if (!container) return;

  var notif = document.createElement('div');
  notif.className = 'notification';

  var dot = document.createElement('span');
  dot.className = 'notif-dot';
  if (type === 'success') dot.style.background = '#0ae448';
  else if (type === 'warning') dot.style.background = '#ff8709';
  else if (type === 'error') dot.style.background = '#e53935';
  else if (type === 'info') dot.style.background = '#8dd6ff';
  else dot.style.background = '#663af3';
  dot.style.boxShadow = '0 0 6px ' + dot.style.background;

  var span = document.createElement('span');
  span.className = 'notif-text';
  span.textContent = text;

  notif.appendChild(dot);
  notif.appendChild(span);
  container.appendChild(notif);

  setTimeout(function() {
    notif.classList.add('leaving');
    setTimeout(function() { notif.remove(); }, 300);
  }, 4000);
};

// ---------------------------------------------------------------------------
// Local pollution fallback (used when WS not connected yet)
// ---------------------------------------------------------------------------
function computeLocalPollution(objects, ctrl) {
  var results = [];
  for (var r = 0; r < STREET_LATS.length - 1; r++) {
    for (var c = 0; c < STREET_LNGS.length - 1; c++) {
      var centerLat = (STREET_LATS[r] + STREET_LATS[r + 1]) / 2;
      var centerLng = (STREET_LNGS[c] + STREET_LNGS[c + 1]) / 2;
      var intensity = 0;

      for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        var em = EMISSION_FACTORS[obj.state];
        if (em === undefined || em === 0) continue;

        var dLat = (centerLat - obj.lat) * 111;
        var dLng = (centerLng - obj.lng) * 85;
        var dist = Math.sqrt(dLat * dLat + dLng * dLng);

        var windRad = (ctrl.windDirection - 90) * Math.PI / 180;
        var toSegAngle = Math.atan2(dLat, dLng);
        var alignment = Math.cos(toSegAngle - windRad);
        var windBoost = alignment > 0 ? 1 + alignment * ctrl.windSpeed * 0.025 : 1;

        var distDecay = Math.exp(-dist / 3.5);
        intensity += em * distDecay * windBoost;
      }

      var trafficAdd = (ctrl.trafficLevel / 100) * 0.1;
      intensity += trafficAdd;

      if (ctrl.weather === 'rain') intensity *= 0.4;
      if (ctrl.weather === 'snow') intensity *= 0.6;

      var windDilution = Math.max(0.25, 1 - ctrl.windSpeed * 0.015);
      intensity *= windDilution;

      if (ctrl.temperature < -5) intensity *= 1 + Math.abs(ctrl.temperature + 5) * 0.02;

      results.push({ row: r, col: c, intensity: Math.min(1, Math.max(0, intensity)) });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// WebSocket \u2014 connection to backend
// ---------------------------------------------------------------------------
function connectWs() {
  if (ws && ws.readyState <= 1) return;

  ws = new WebSocket(WS_URL);

  ws.onopen = function() {
    console.log('[WS] Connected');
    sendCurrentParams();
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
// Navigation Landing <-> App <-> About
// ---------------------------------------------------------------------------
window.navigateTo = function(view) {
  var landing = document.getElementById('landing');
  var appView = document.getElementById('app-view');
  var aboutView = document.getElementById('about-view');
  var navbar = document.getElementById('navbar');

  landing.classList.add('hidden');
  appView.classList.add('hidden');
  if (aboutView) aboutView.classList.add('hidden');

  if (view === 'app') {
    appView.classList.remove('hidden');
    navbar.classList.add('hidden');
    if (!appReady) initApp();
  } else if (view === 'about') {
    if (aboutView) aboutView.classList.remove('hidden');
    navbar.classList.remove('hidden');
  } else {
    landing.classList.remove('hidden');
    navbar.classList.remove('hidden');
  }
};

// ---------------------------------------------------------------------------
// Landing \u2014 animations
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

function initCardGlow() {
  document.querySelectorAll('.feature-card').forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--card-mouse-x', x + '%');
      card.style.setProperty('--card-mouse-y', y + '%');
    });
  });
}

// ---------------------------------------------------------------------------
// App \u2014 init
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
      // Bind analysis button from nav
      var analysisBtn = document.getElementById('btn-analysis');
      if (analysisBtn) analysisBtn.addEventListener('click', requestAiAnalysis);
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

function switchMode(mode) {
  currentMode = mode;
  var mapEl = getMap();
  var mapArea = document.getElementById('mapArea');
  var aiPanel = document.getElementById('aiPanel');
  var aqiOv = document.getElementById('aqiOverlay');
  var insOv = document.getElementById('insightOverlay');

  // Stop live auto-refresh on mode switch
  if (liveInterval) { clearInterval(liveInterval); liveInterval = null; }

  if (mode === 'ai') {
    mapArea.classList.add('hidden');
    aiPanel.classList.remove('hidden');
    showAiInfo();
    if (windSystem) windSystem.running = false;
    window.showNotification('AI \u0421\u043e\u0432\u0435\u0442\u043d\u0438\u043a \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d', 'info');
  } else {
    mapArea.classList.remove('hidden');
    aiPanel.classList.add('hidden');
    if (windSystem) { windSystem.running = true; windSystem._loop(); windSystem.resize(); }
  }

  if (mode === 'live') {
    showLiveInfo();
    removeMarkers();
    resetCityState();
    clearSmogSegments();
    resetView();
    aqiOv.classList.remove('hidden');
    insOv.classList.remove('hidden');
    runSimulation();
    // Auto-refresh every 15 seconds
    liveInterval = setInterval(runSimulation, 15000);
  } else if (mode === 'edit') {
    showEditControls();
    if (mapEl) addMarkers(mapEl, runSimulation);
    aqiOv.classList.remove('hidden');
    insOv.classList.remove('hidden');
    window.showNotification('\u0420\u0435\u0436\u0438\u043c \u0441\u0438\u043c\u0443\u043b\u044f\u0446\u0438\u0438', 'info');
  }
}

// ---------------------------------------------------------------------------
// Simulation \u2014 collect data and send via WebSocket
// ---------------------------------------------------------------------------
function runSimulation() {
  var c = getControls();

  // Update visual elements
  if (windSystem) windSystem.update(c.windSpeed, c.windDirection);
  updateTrafficLevel(c.trafficLevel);

  // If WS is connected, just send params and let backend handle it
  if (ws && ws.readyState === 1) {
    sendCurrentParams();
    return;
  }

  // Local fallback computation (only when WS is not connected)
  var objects = getCityObjects();
  var localData = computeLocalPollution(objects, c);
  updateSegmentIntensities(localData);

  var avgIntensity = localData.reduce(function(s, d) { return s + d.intensity; }, 0) / localData.length;
  var localAqi = Math.round(avgIntensity * 500);
  updateAqi(localAqi);

  var maxSeg = localData.reduce(function(a, b) { return a.intensity > b.intensity ? a : b; });
  var insight = generateInsight(objects, c, localAqi, maxSeg);
  var it = document.getElementById('insightText');
  var io = document.getElementById('insightOverlay');
  if (it) it.textContent = insight;
  if (io) io.classList.remove('hidden');
}

function sendCurrentParams() {
  var c = getControls();
  if (windSystem) windSystem.update(c.windSpeed, c.windDirection);
  updateTrafficLevel(c.trafficLevel);

  var cityState = getCityState();
  var params = {
    active_mode: currentMode,
    city_state: cityState,
    weather: {
      wind_direction: c.windDirection,
      wind_speed: c.windSpeed,
      temperature: c.temperature,
      weather_type: c.weather
    },
    use_real_weather: c.useRealWeather || false,
    traffic_level: c.trafficLevel
  };
  sendWs(params);
}

function generateInsight(objects, ctrl, aqi, maxSeg) {
  var tecObj = objects.find(function(o) { return o.id === 'tec_1'; });
  var tecState = tecObj ? tecObj.state : 'coal_full';

  if (aqi > 200)
    return '\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u0437\u0430\u0433\u0440\u044f\u0437\u043d\u0435\u043d\u0438\u044f. \u041e\u0441\u043d\u043e\u0432\u043d\u043e\u0439 \u0444\u0430\u043a\u0442\u043e\u0440: ' +
      (tecState === 'coal_full' ? '\u0422\u042d\u0426 \u043d\u0430 \u0443\u0433\u043b\u0435. \u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u0442\u0441\u044f \u043f\u0435\u0440\u0435\u0432\u043e\u0434 \u043d\u0430 \u0433\u0430\u0437.' : '\u0441\u043e\u0432\u043e\u043a\u0443\u043f\u043d\u043e\u0441\u0442\u044c \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u043e\u0432. \u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u0442\u0441\u044f \u0441\u043d\u0438\u0436\u0435\u043d\u0438\u0435 \u0442\u0440\u0430\u0444\u0438\u043a\u0430 \u0438 \u043c\u043e\u0449\u043d\u043e\u0441\u0442\u0438 \u043f\u0440\u043e\u043c\u0437\u043e\u043d.');

  if (aqi > 100)
    return '\u041f\u043e\u0432\u044b\u0448\u0435\u043d\u043d\u043e\u0435 \u0437\u0430\u0433\u0440\u044f\u0437\u043d\u0435\u043d\u0438\u0435 (AQI ' + aqi + '). \u041d\u0430\u0438\u0431\u043e\u043b\u0435\u0435 \u0437\u0430\u0433\u0440\u044f\u0437\u043d\u0451\u043d \u0441\u0435\u0433\u043c\u0435\u043d\u0442 [' + maxSeg.row + ',' + maxSeg.col + ']. ' +
      (ctrl.windSpeed < 3 ? '\u0421\u043b\u0430\u0431\u044b\u0439 \u0432\u0435\u0442\u0435\u0440 \u043f\u0440\u0435\u043f\u044f\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0440\u0430\u0441\u0441\u0435\u0438\u0432\u0430\u043d\u0438\u044e.' : '\u0412\u0435\u0442\u0435\u0440 \u0447\u0430\u0441\u0442\u0438\u0447\u043d\u043e \u0440\u0430\u0441\u0441\u0435\u0438\u0432\u0430\u0435\u0442 \u0441\u043c\u043e\u0433.');

  return '\u041a\u0430\u0447\u0435\u0441\u0442\u0432\u043e \u0432\u043e\u0437\u0434\u0443\u0445\u0430 \u0432 \u043f\u0440\u0435\u0434\u0435\u043b\u0430\u0445 \u043d\u043e\u0440\u043c\u044b (AQI ' + aqi + '). ' +
    (ctrl.weather === 'rain' ? '\u0414\u043e\u0436\u0434\u044c \u0441\u043f\u043e\u0441\u043e\u0431\u0441\u0442\u0432\u0443\u0435\u0442 \u043e\u0447\u0438\u0449\u0435\u043d\u0438\u044e \u0430\u0442\u043c\u043e\u0441\u0444\u0435\u0440\u044b.' : '\u0422\u0435\u043a\u0443\u0449\u0438\u0435 \u0443\u0441\u043b\u043e\u0432\u0438\u044f \u0441\u0442\u0430\u0431\u0438\u043b\u044c\u043d\u044b.');
}

// ---------------------------------------------------------------------------
// AQI visualization
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
// AI Analysis — on-demand analysis button
// ---------------------------------------------------------------------------
function requestAiAnalysis() {
  var c = getControls();
  var cityState = getCityState();
  var it = document.getElementById('insightText');
  var io = document.getElementById('insightOverlay');

  // Show loading
  if (it) it.textContent = '🔮 Анализирую...';
  if (io) io.classList.remove('hidden');

  var prompt = 'Проанализируй текущую ситуацию: ' +
    'Температура ' + c.temperature + '\u00b0C, ' +
    'Ветер ' + c.windSpeed + ' м/с (' + c.windDirection + '\u00b0), ' +
    'Погода: ' + c.weather + ', ' +
    'Трафик: ' + c.trafficLevel + '%. ' +
    'Объекты: ' + JSON.stringify(cityState) + '. ' +
    'Дай 2-3 коротких совета мэру.';

  fetch(API_URL + '/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (it) it.textContent = data.reply || 'Нет ответа от AI.';
  })
  .catch(function() {
    if (it) it.textContent = 'Ошибка подключения к AI.';
  });
}

// ---------------------------------------------------------------------------
// AI Chat — real backend call via /api/v1/chat
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
// DOMContentLoaded \u2014 Landing
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
  initNavbar();
  initScrollReveal();
  initMouseGlow();
  initCounterAnimation();
  initParallax();
  initCardGlow();
  try { initPreviewMap('preview-map'); } catch (e) {}
});
