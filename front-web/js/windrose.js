import { API_URL } from './config.js';

var DIRECTIONS = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
var SPEED_BINS = [
  { max: 2,  color: 'rgba(100, 200, 255, 0.85)', label: '0-2' },
  { max: 5,  color: 'rgba(80, 230, 130, 0.85)',  label: '2-5' },
  { max: 10, color: 'rgba(255, 200, 50, 0.85)',  label: '5-10' },
  { max: 20, color: 'rgba(255, 120, 30, 0.85)',  label: '10-20' },
  { max: 999, color: 'rgba(230, 50, 50, 0.85)',  label: '20+' }
];

var _canvas = null;
var _ctx = null;
var _data = null;
var _visible = false;

export function initWindRose() {
  // Create the wind rose container
  var container = document.createElement('div');
  container.id = 'windrose-container';
  container.style.cssText =
    'position:fixed;bottom:24px;right:24px;width:260px;height:310px;' +
    'background:rgba(10,12,20,0.92);border:1px solid rgba(141,214,255,0.15);' +
    'border-radius:14px;backdrop-filter:blur(18px);z-index:800;' +
    'display:none;flex-direction:column;padding:12px;' +
    'box-shadow:0 8px 32px rgba(0,0,0,0.5);';

  var header = document.createElement('div');
  header.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';
  header.innerHTML =
    '<span style="font-size:12px;font-weight:600;color:#8dd6ff;letter-spacing:0.5px;">🧭 РОЗА ВЕТРОВ (7 дней)</span>' +
    '<button id="windrose-close" style="background:none;border:none;color:#8dd6ff;font-size:16px;cursor:pointer;padding:2px 6px;opacity:0.6;">✕</button>';
  container.appendChild(header);

  var canvas = document.createElement('canvas');
  canvas.id = 'windrose-canvas';
  canvas.width = 236;
  canvas.height = 236;
  canvas.style.cssText = 'display:block;margin:0 auto;';
  container.appendChild(canvas);

  // Legend
  var legend = document.createElement('div');
  legend.style.cssText =
    'display:flex;justify-content:center;gap:6px;margin-top:8px;flex-wrap:wrap;';
  for (var i = 0; i < SPEED_BINS.length; i++) {
    legend.innerHTML +=
      '<span style="font-size:9px;color:var(--text-ash);display:flex;align-items:center;gap:2px;">' +
      '<span style="width:8px;height:8px;border-radius:2px;background:' + SPEED_BINS[i].color + ';display:inline-block;"></span>' +
      SPEED_BINS[i].label + ' м/с</span>';
  }
  container.appendChild(legend);

  document.body.appendChild(container);

  _canvas = canvas;
  _ctx = canvas.getContext('2d');

  document.getElementById('windrose-close').addEventListener('click', function() {
    hideWindRose();
  });
}

export function showWindRose() {
  var c = document.getElementById('windrose-container');
  if (c) {
    c.style.display = 'flex';
    _visible = true;
    if (!_data) fetchAndDraw();
    else draw();
  }
}

export function hideWindRose() {
  var c = document.getElementById('windrose-container');
  if (c) { c.style.display = 'none'; _visible = false; }
}

export function toggleWindRose() {
  if (_visible) hideWindRose(); else showWindRose();
}

function fetchAndDraw() {
  fetch(API_URL + '/api/v1/wind-history')
    .then(function(r) { return r.json(); })
    .then(function(json) {
      _data = processData(json.data || []);
      draw();
    })
    .catch(function(e) {
      console.error('Wind rose fetch failed:', e);
    });
}

function processData(raw) {
  // Build 16-direction × 5-speed-bin histogram
  var bins = [];
  for (var d = 0; d < 16; d++) {
    bins[d] = [];
    for (var s = 0; s < SPEED_BINS.length; s++) bins[d][s] = 0;
  }

  var total = raw.length || 1;

  for (var i = 0; i < raw.length; i++) {
    var dir = raw[i].direction;
    var spd = raw[i].speed;

    // Map direction (0-360) to one of 16 sectors
    var sector = Math.round(dir / 22.5) % 16;

    // Map speed to bin
    for (var b = 0; b < SPEED_BINS.length; b++) {
      if (spd <= SPEED_BINS[b].max) {
        bins[sector][b]++;
        break;
      }
    }
  }

  // Convert to percentages
  var maxPct = 0;
  for (var d = 0; d < 16; d++) {
    for (var s = 0; s < SPEED_BINS.length; s++) {
      bins[d][s] = (bins[d][s] / total) * 100;
    }
    var sectorTotal = 0;
    for (var s = 0; s < SPEED_BINS.length; s++) sectorTotal += bins[d][s];
    if (sectorTotal > maxPct) maxPct = sectorTotal;
  }

  return { bins: bins, maxPct: maxPct, total: raw.length };
}

function draw() {
  if (!_ctx || !_data) return;
  var w = _canvas.width;
  var h = _canvas.height;
  var cx = w / 2;
  var cy = h / 2;
  var maxR = Math.min(cx, cy) - 28;
  
  _ctx.clearRect(0, 0, w, h);

  // Draw concentric circles (grid)
  var gridSteps = 4;
  _ctx.strokeStyle = 'rgba(141, 214, 255, 0.1)';
  _ctx.lineWidth = 0.5;
  for (var g = 1; g <= gridSteps; g++) {
    var r = maxR * (g / gridSteps);
    _ctx.beginPath();
    _ctx.arc(cx, cy, r, 0, Math.PI * 2);
    _ctx.stroke();

    // Label
    var pct = (_data.maxPct * g / gridSteps).toFixed(0);
    _ctx.fillStyle = 'rgba(141, 214, 255, 0.3)';
    _ctx.font = '8px Inter, sans-serif';
    _ctx.fillText(pct + '%', cx + 3, cy - r + 10);
  }

  // Draw direction lines & labels
  _ctx.strokeStyle = 'rgba(141, 214, 255, 0.06)';
  _ctx.lineWidth = 0.5;
  for (var d = 0; d < 16; d++) {
    var angle = (d * 22.5 - 90) * Math.PI / 180;
    _ctx.beginPath();
    _ctx.moveTo(cx, cy);
    _ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
    _ctx.stroke();

    // Label for cardinal & intercardinal directions only
    if (d % 2 === 0) {
      var labelR = maxR + 14;
      var lx = cx + Math.cos(angle) * labelR;
      var ly = cy + Math.sin(angle) * labelR;
      _ctx.fillStyle = 'rgba(141, 214, 255, 0.6)';
      _ctx.font = '600 10px Inter, sans-serif';
      _ctx.textAlign = 'center';
      _ctx.textBaseline = 'middle';
      _ctx.fillText(DIRECTIONS[d], lx, ly);
    }
  }

  // Draw petals (stacked bars in polar coords)
  var sectorAngle = 22.5 * Math.PI / 180;
  var petalWidth = sectorAngle * 0.75; // Leave a small gap between petals

  for (var d = 0; d < 16; d++) {
    var angle = (d * 22.5 - 90) * Math.PI / 180;
    var cumulative = 0;

    for (var s = 0; s < SPEED_BINS.length; s++) {
      var val = _data.bins[d][s];
      if (val <= 0) { cumulative += val; continue; }

      var innerR = (cumulative / _data.maxPct) * maxR;
      cumulative += val;
      var outerR = (cumulative / _data.maxPct) * maxR;

      if (outerR < 1) continue;

      _ctx.beginPath();
      _ctx.arc(cx, cy, innerR, angle - petalWidth / 2, angle + petalWidth / 2);
      _ctx.arc(cx, cy, outerR, angle + petalWidth / 2, angle - petalWidth / 2, true);
      _ctx.closePath();
      _ctx.fillStyle = SPEED_BINS[s].color;
      _ctx.fill();

      // Subtle border
      _ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      _ctx.lineWidth = 0.5;
      _ctx.stroke();
    }
  }

  // Center dot
  _ctx.beginPath();
  _ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  _ctx.fillStyle = '#8dd6ff';
  _ctx.fill();

  // Total count label
  _ctx.fillStyle = 'rgba(141, 214, 255, 0.35)';
  _ctx.font = '9px Inter, sans-serif';
  _ctx.textAlign = 'center';
  _ctx.fillText(_data.total + ' ч.', cx, cy + maxR + 24);
}
