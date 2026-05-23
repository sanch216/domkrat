import { MAPBOX_TOKEN } from './config.js';

const CENTER = [74.59, 42.87];

export const STREET_LATS = [42.828, 42.842, 42.856, 42.870, 42.880, 42.895, 42.910];
export const STREET_LNGS = [74.535, 74.558, 74.575, 74.592, 74.610, 74.632, 74.660];

let map = null;
let trafficAnimId = null;
let trafficDashStep = 0;
let trafficSpeed = 80;
let segPulseId = null;
let segPulsePhase = 0;

const DASH_SEQ = [
  [0, 4, 3],
  [1, 4, 2],
  [2, 4, 1],
  [3, 4, 0],
  [0, 1, 3, 3],
  [0, 2, 3, 2],
  [0, 3, 3, 1]
];

const TRAFFIC_ROADS = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { id: 'chui', name: 'Проспект Чуй', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.540,42.8738],[74.555,42.8738],[74.570,42.8738],[74.585,42.8738],[74.600,42.8738],[74.615,42.8738],[74.630,42.8738],[74.645,42.8738],[74.660,42.8738]] }},
    { type: 'Feature', properties: { id: 'manas', name: 'Проспект Манаса', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.5828,42.835],[74.5828,42.845],[74.5828,42.855],[74.5828,42.865],[74.5828,42.875],[74.5828,42.885],[74.5828,42.895],[74.5828,42.905]] }},
    { type: 'Feature', properties: { id: 'south', name: 'Южная магистраль', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.540,42.835],[74.555,42.835],[74.570,42.835],[74.585,42.835],[74.600,42.835],[74.615,42.835],[74.630,42.835],[74.645,42.835],[74.660,42.835]] }},
    { type: 'Feature', properties: { id: '7apr', name: 'Ул. 7 Апреля', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.605,42.835],[74.605,42.845],[74.605,42.855],[74.605,42.865],[74.605,42.875],[74.605,42.885],[74.605,42.895],[74.605,42.905]] }},
    { type: 'Feature', properties: { id: 'osh', name: 'Ошский рынок', level: 0.8 }, geometry: { type: 'LineString', coordinates: [[74.585,42.855],[74.590,42.858],[74.595,42.860],[74.600,42.862],[74.605,42.865]] }},
    { type: 'Feature', properties: { id: 'baytik', name: 'Байтик Баатыра', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.575,42.835],[74.575,42.845],[74.575,42.855],[74.575,42.865],[74.575,42.875],[74.575,42.885],[74.575,42.895],[74.575,42.905]] }},
    { type: 'Feature', properties: { id: 'jibek', name: 'Жибек Жолу', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.540,42.870],[74.555,42.870],[74.570,42.870],[74.585,42.870],[74.600,42.870],[74.615,42.870],[74.630,42.870],[74.645,42.870],[74.660,42.870]] }},
    { type: 'Feature', properties: { id: 'toktogul', name: 'Токтогула', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.540,42.876],[74.555,42.876],[74.570,42.876],[74.585,42.876],[74.600,42.876],[74.615,42.876],[74.630,42.876],[74.645,42.876],[74.660,42.876]] }},
    { type: 'Feature', properties: { id: 'ahunbaeva', name: 'Ахунбаева', level: 0.35 }, geometry: { type: 'LineString', coordinates: [[74.540,42.847],[74.555,42.847],[74.570,42.847],[74.585,42.847],[74.600,42.847],[74.615,42.847],[74.630,42.847],[74.645,42.847],[74.660,42.847]] }},
    { type: 'Feature', properties: { id: 'togolok', name: 'Тоголок Молдо', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.540,42.892],[74.555,42.892],[74.570,42.892],[74.585,42.892],[74.600,42.892],[74.615,42.892],[74.630,42.892],[74.645,42.892],[74.660,42.892]] }},
    { type: 'Feature', properties: { id: 'gorkogo', name: 'Горького', level: 0.45 }, geometry: { type: 'LineString', coordinates: [[74.540,42.860],[74.555,42.860],[74.570,42.860],[74.585,42.860],[74.600,42.860],[74.615,42.860],[74.630,42.860],[74.645,42.860],[74.660,42.860]] }},
    { type: 'Feature', properties: { id: 'moskovskaya', name: 'Московская', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.592,42.835],[74.592,42.845],[74.592,42.855],[74.592,42.865],[74.592,42.875],[74.592,42.885],[74.592,42.895],[74.592,42.905]] }},
    { type: 'Feature', properties: { id: 'abdrahmanova', name: 'Абдрахманова', level: 0.35 }, geometry: { type: 'LineString', coordinates: [[74.598,42.835],[74.598,42.845],[74.598,42.855],[74.598,42.865],[74.598,42.875],[74.598,42.885],[74.598,42.895],[74.598,42.905]] }},
    { type: 'Feature', properties: { id: 'sovetskaya', name: 'Советская', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.570,42.835],[74.570,42.845],[74.570,42.855],[74.570,42.865],[74.570,42.875],[74.570,42.885],[74.570,42.895],[74.570,42.905]] }},
    { type: 'Feature', properties: { id: 'kievskaya', name: 'Киевская', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.540,42.878],[74.555,42.878],[74.570,42.878],[74.585,42.878],[74.600,42.878],[74.615,42.878],[74.630,42.878],[74.645,42.878],[74.660,42.878]] }}
  ]
};

function generateSegments(intensities) {
  var features = [];
  for (var r = 0; r < STREET_LATS.length - 1; r++) {
    for (var c = 0; c < STREET_LNGS.length - 1; c++) {
      var lat1 = STREET_LATS[r];
      var lat2 = STREET_LATS[r + 1];
      var lng1 = STREET_LNGS[c];
      var lng2 = STREET_LNGS[c + 1];
      var intensity = 0;
      if (intensities) {
        var match = intensities.find(function(d) { return d.row === r && d.col === c; });
        if (match) intensity = match.intensity;
      }
      features.push({
        type: 'Feature',
        properties: { id: 'seg_' + r + '_' + c, row: r, col: c, intensity: intensity },
        geometry: {
          type: 'Polygon',
          coordinates: [[[lng1,lat1],[lng2,lat1],[lng2,lat2],[lng1,lat2],[lng1,lat1]]]
        }
      });
    }
  }
  return { type: 'FeatureCollection', features: features };
}

export function initMap(containerId, options) {
  options = options || {};
  mapboxgl.accessToken = MAPBOX_TOKEN;

  map = new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: options.center || CENTER,
    zoom: options.zoom || 12,
    pitch: options.pitch !== undefined ? options.pitch : 50,
    bearing: options.bearing !== undefined ? options.bearing : -15,
    antialias: true
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

  map.on('load', function() {
    add3DBuildings();
    addSmogSegments();
    addTrafficLayer();
    startTrafficAnimation();
    startSegmentPulse();
    if (options.onLoad) options.onLoad(map);
  });

  return map;
}

function add3DBuildings() {
  var layers = map.getStyle().layers;
  var labelLayerId;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
      labelLayerId = layers[i].id;
      break;
    }
  }
  map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 13,
    paint: {
      'fill-extrusion-color': '#0c0c14',
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.5, ['get', 'height']],
      'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.5, ['get', 'min_height']],
      'fill-extrusion-opacity': 0.75
    }
  }, labelLayerId);
}

function addSmogSegments() {
  map.addSource('smog-segments', {
    type: 'geojson',
    data: generateSegments()
  });

  map.addLayer({
    id: 'smog-fill',
    type: 'fill',
    source: 'smog-segments',
    paint: {
      'fill-color': [
        'interpolate', ['linear'], ['get', 'intensity'],
        0, 'rgba(8, 135, 43, 0.1)',
        0.15, 'rgba(46, 178, 76, 0.25)',
        0.3, 'rgba(141, 214, 255, 0.3)',
        0.45, 'rgba(255, 197, 51, 0.4)',
        0.6, 'rgba(255, 135, 9, 0.5)',
        0.75, 'rgba(229, 57, 53, 0.6)',
        0.9, 'rgba(200, 30, 60, 0.7)',
        1.0, 'rgba(160, 20, 50, 0.8)'
      ],
      'fill-opacity': 1
    }
  }, '3d-buildings');

  map.addLayer({
    id: 'smog-border',
    type: 'line',
    source: 'smog-segments',
    paint: {
      'line-color': 'rgba(141, 214, 255, 0.12)',
      'line-width': 1.5
    }
  }, '3d-buildings');
}

function addTrafficLayer() {
  map.addSource('traffic-roads', {
    type: 'geojson',
    data: TRAFFIC_ROADS
  });

  map.addLayer({
    id: 'traffic-glow',
    type: 'line',
    source: 'traffic-roads',
    paint: {
      'line-color': [
        'interpolate', ['linear'], ['get', 'level'],
        0, '#8dd6ff',
        0.3, '#0ae448',
        0.6, '#ff8709',
        1.0, '#e53935'
      ],
      'line-width': 10,
      'line-opacity': 0.08,
      'line-blur': 8
    }
  });

  map.addLayer({
    id: 'traffic-base',
    type: 'line',
    source: 'traffic-roads',
    paint: {
      'line-color': [
        'interpolate', ['linear'], ['get', 'level'],
        0, '#8dd6ff',
        0.3, '#0ae448',
        0.6, '#ff8709',
        1.0, '#e53935'
      ],
      'line-width': 2.5,
      'line-opacity': 0.6
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' }
  });

  map.addLayer({
    id: 'traffic-dash',
    type: 'line',
    source: 'traffic-roads',
    paint: {
      'line-color': [
        'interpolate', ['linear'], ['get', 'level'],
        0, '#8dd6ff',
        0.3, '#0ae448',
        0.6, '#ff8709',
        1.0, '#e53935'
      ],
      'line-width': 2,
      'line-opacity': 0.9,
      'line-dasharray': [0, 4, 3]
    },
    layout: { 'line-cap': 'butt', 'line-join': 'round' }
  });
}

function startTrafficAnimation() {
  function tick() {
    trafficDashStep = (trafficDashStep + 1) % DASH_SEQ.length;
    if (map.getLayer('traffic-dash')) {
      map.setPaintProperty('traffic-dash', 'line-dasharray', DASH_SEQ[trafficDashStep]);
    }
    trafficAnimId = setTimeout(function() { requestAnimationFrame(tick); }, trafficSpeed);
  }
  tick();
}

function startSegmentPulse() {
  function tick() {
    segPulsePhase += 0.02;
    var opc = 0.85 + Math.sin(segPulsePhase) * 0.1;
    if (map.getLayer('smog-fill')) {
      map.setPaintProperty('smog-fill', 'fill-opacity', opc);
    }
    segPulseId = requestAnimationFrame(tick);
  }
  tick();
}

export function updateSegmentIntensities(data) {
  if (!map) return;
  var segments = generateSegments(data);
  var src = map.getSource('smog-segments');
  if (src) src.setData(segments);
}

export function updateSmogSegments(heatmapData) {
  if (!map) return;
  var segments = generateSegments();

  segments.features.forEach(function(seg) {
    var r = seg.properties.row;
    var c = seg.properties.col;
    var lat1 = STREET_LATS[r];
    var lat2 = STREET_LATS[r + 1];
    var lng1 = STREET_LNGS[c];
    var lng2 = STREET_LNGS[c + 1];

    var pts = heatmapData.filter(function(p) {
      return p.lat >= lat1 && p.lat < lat2 && p.lng >= lng1 && p.lng < lng2;
    });
    if (pts.length > 0) {
      seg.properties.intensity = pts.reduce(function(s, p) { return s + p.intensity; }, 0) / pts.length;
    }
  });

  var src = map.getSource('smog-segments');
  if (src) src.setData(segments);
}

export function clearSmogSegments() {
  if (!map) return;
  var src = map.getSource('smog-segments');
  if (src) src.setData(generateSegments());
}

export function updateTrafficLevel(globalLevel) {
  if (!map) return;
  var updated = JSON.parse(JSON.stringify(TRAFFIC_ROADS));
  updated.features.forEach(function(f) {
    var base = f.properties.level;
    f.properties.level = Math.min(1, base * 0.3 + (globalLevel / 100) * 0.7 + (Math.random() - 0.5) * 0.08);
  });
  var src = map.getSource('traffic-roads');
  if (src) src.setData(updated);
  trafficSpeed = Math.max(20, 150 - globalLevel);
}

export function getMap() { return map; }

export function flyToObject(lng, lat) {
  if (!map) return;
  map.flyTo({
    center: [lng, lat],
    zoom: 15.5,
    pitch: 60,
    bearing: 25,
    duration: 1800,
    essential: true
  });
}

export function resetView() {
  if (!map) return;
  map.flyTo({
    center: CENTER,
    zoom: 12,
    pitch: 50,
    bearing: -15,
    duration: 1200
  });
}

export function initPreviewMap(containerId) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  return new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: CENTER,
    zoom: 11.5,
    pitch: 45,
    bearing: 10,
    interactive: false
  });
}
