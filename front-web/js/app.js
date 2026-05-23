import { API_URL } from './config.js';
import { initMap, updateSmogSegments, updateSegmentIntensities, updateTrafficLevel, clearSmogSegments, getMap, resetView, initPreviewMap, STREET_LATS, STREET_LNGS } from './map.js';
import { addMarkers, removeMarkers, getCityObjects, getCityState } from './markers.js';
import { WindSystem } from './wind.js';
import { initSidebar, getControls, showEditControls, showLiveInfo, showAiInfo } from './sidebar.js';

var currentMode = 'live';
var windSystem = null;
var appReady = false;

var EMISSION_FACTORS = {
  coal_full: 0.9,
  coal_reduced: 0.55,
  gas_converted: 0.15,
  off: 0,
  full_load: 0.7,
  reduced: 0.35,
  idle: 0.08,
  shutdown: 0,
  coal_heating: 0.45,
  gas_heating: 0.12,
  electric_heating: 0.03,
  no_heating: 0,
  congested: 0.4,
  moderate: 0.2,
  free_flow: 0.08,
  closed: 0,
  active: -0.08,
  inactive: 0
};

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
      switchMode('live');
      runSimulation();
      window.showNotification('Command Center активен', 'success');
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

  if (mode === 'ai') {
    mapArea.classList.add('hidden');
    aiPanel.classList.remove('hidden');
    showAiInfo();
    if (windSystem) windSystem.running = false;
    window.showNotification('AI Советник подключен', 'info');
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
    window.showNotification('Режим симуляции', 'info');
  }
}

function runSimulation() {
  var c = getControls();
  if (windSystem) windSystem.update(c.windSpeed, c.windDirection);
  updateTrafficLevel(c.trafficLevel);

  var objects = getCityObjects();
  var localData = computeLocalPollution(objects, c);
  updateSegmentIntensities(localData);

  var avgIntensity = localData.reduce(function(s, d) { return s + d.intensity; }, 0) / localData.length;
  var aqi = Math.round(avgIntensity * 500);
  updateAqi(aqi);

  var maxSeg = localData.reduce(function(a, b) { return a.intensity > b.intensity ? a : b; });
  var insight = generateInsight(objects, c, aqi, maxSeg);
  var it = document.getElementById('insightText');
  var io = document.getElementById('insightOverlay');
  if (it) it.textContent = insight;
  if (io) io.classList.remove('hidden');

  tryApiSimulation(c);
}

function tryApiSimulation(c) {
  var params = {
    tec_power: 80,
    traffic_level: c.trafficLevel,
    coal_heating: true,
    wind_direction: c.windDirection,
    wind_speed: c.windSpeed
  };

  fetch(API_URL + '/api/v1/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).then(function(resp) {
    if (!resp.ok) throw new Error(resp.status);
    return resp.json();
  }).then(function(data) {
    if (data.heatmap_data) updateSmogSegments(data.heatmap_data);
    if (data.aqi) updateAqi(data.aqi);
  }).catch(function() {});
}

function generateInsight(objects, ctrl, aqi, maxSeg) {
  var tecObj = objects.find(function(o) { return o.id === 'tec_1'; });
  var tecState = tecObj ? tecObj.state : 'coal_full';

  if (aqi > 200)
    return 'Критический уровень загрязнения. Основной фактор: ' +
      (tecState === 'coal_full' ? 'ТЭЦ на угле. Рекомендуется перевод на газ.' : 'совокупность источников. Рекомендуется снижение трафика и мощности промзон.');

  if (aqi > 100)
    return 'Повышенное загрязнение (AQI ' + aqi + '). Наиболее загрязнён сегмент [' + maxSeg.row + ',' + maxSeg.col + ']. ' +
      (ctrl.windSpeed < 3 ? 'Слабый ветер препятствует рассеиванию.' : 'Ветер частично рассеивает смог.');

  return 'Качество воздуха в пределах нормы (AQI ' + aqi + '). ' +
    (ctrl.weather === 'rain' ? 'Дождь способствует очищению атмосферы.' : 'Текущие условия стабильны.');
}

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
  if (aqi <= 50) { color = '#0ae448'; label = 'Хорошо'; }
  else if (aqi <= 100) { color = '#8dd6ff'; label = 'Умеренно'; }
  else if (aqi <= 150) { color = '#ff8709'; label = 'Нездоровое'; }
  else if (aqi <= 200) { color = '#e53935'; label = 'Плохое'; }
  else { color = '#a0142a'; label = 'Опасное'; }

  num.style.color = color;
  arc.setAttribute('stroke', color);
  st.textContent = label;
  st.style.color = color;
  ov.style.boxShadow = 'inset rgba(199,211,234,0.08) 0 1px 1px 0, 0 0 24px ' + color + '20';
}

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

    setTimeout(function() {
      dots.remove();
      appendMsg(msgs, aiReply(text), false);
    }, 700 + Math.random() * 800);
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

function aiReply(q) {
  var t = q.toLowerCase();
  if (t.indexOf('\u0442\u044d\u0446') >= 0 || t.indexOf('\u0442\u0435\u043f\u043b\u043e') >= 0)
    return 'ТЭЦ Бишкек — крупнейший источник выбросов. На угле даёт до 40% AQI. Перевод на газ снизит выбросы на 60-70%. Рекомендую поэтапную модернизацию с установкой электрофильтров.';
  if (t.indexOf('\u0442\u0440\u0430\u0444\u0438\u043a') >= 0 || t.indexOf('\u043f\u0440\u043e\u0431') >= 0 || t.indexOf('\u043c\u0430\u0448\u0438\u043d') >= 0)
    return 'Автотранспорт составляет около 35% загрязнения. 15 основных дорог отслеживаются. Развитие электротранспорта и BRT-линий снизит AQI на 30-50 пунктов.';
  if (t.indexOf('\u0432\u0435\u0442') >= 0 || t.indexOf('\u043f\u043e\u0433\u043e\u0434') >= 0)
    return 'Ветер — главный природный регулятор. При скорости более 5 м/с смог рассеивается. Бишкек расположен в котловине — зимой температурная инверсия блокирует вертикальное рассеивание.';
  if (t.indexOf('\u0443\u0433\u043e\u043b') >= 0 || t.indexOf('\u043e\u0442\u043e\u043f') >= 0)
    return 'Угольное отопление даёт до 20% AQI зимой. Перевод частного сектора на газ или электричество кардинально улучшит ситуацию в жилых районах.';
  return 'Качество воздуха зависит от ТЭЦ, трафика, отопления и метеоусловий. Задайте конкретный вопрос о любом факторе для детального анализа.';
}

document.addEventListener('DOMContentLoaded', function() {
  initNavbar();
  initScrollReveal();
  initMouseGlow();
  initCounterAnimation();
  initParallax();
  initCardGlow();
  try { initPreviewMap('preview-map'); } catch (e) {}
});
