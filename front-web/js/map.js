import { MAPBOX_TOKEN } from './config.js';

const CENTER = [74.59, 42.87];

export const STREET_LATS = [42.800, 42.812, 42.824, 42.836, 42.848, 42.858, 42.868, 42.878, 42.888, 42.900, 42.915, 42.930];
export const STREET_LNGS = [74.480, 74.500, 74.520, 74.540, 74.558, 74.575, 74.592, 74.610, 74.630, 74.650, 74.670, 74.695, 74.720];

let map = null;
let trafficAnimId = null;
let trafficDashStep = 0;
let trafficSpeed = 100;
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
    // === \u0428\u0438\u0440\u043e\u0442\u043d\u044b\u0435 (\u0437\u0430\u043f\u0430\u0434-\u0432\u043e\u0441\u0442\u043e\u043a) ===
    { type: 'Feature', properties: { id: 'chui', name: '\u041f\u0440\u043e\u0441\u043f\u0435\u043a\u0442 \u0427\u0443\u0439', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.48,42.874],[74.52,42.874],[74.56,42.874],[74.59,42.874],[74.62,42.874],[74.66,42.874],[74.70,42.874],[74.72,42.874]] }},
    { type: 'Feature', properties: { id: 'jibek', name: '\u0416\u0438\u0431\u0435\u043a \u0416\u043e\u043b\u0443', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.48,42.871],[74.52,42.871],[74.56,42.871],[74.59,42.871],[74.62,42.871],[74.66,42.871],[74.70,42.871],[74.72,42.871]] }},
    { type: 'Feature', properties: { id: 'kievskaya', name: '\u041a\u0438\u0435\u0432\u0441\u043a\u0430\u044f', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.48,42.878],[74.52,42.878],[74.56,42.878],[74.59,42.878],[74.62,42.878],[74.66,42.878],[74.70,42.878],[74.72,42.878]] }},
    { type: 'Feature', properties: { id: 'toktogul', name: '\u0422\u043e\u043a\u0442\u043e\u0433\u0443\u043b\u0430', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.48,42.876],[74.52,42.876],[74.56,42.876],[74.59,42.876],[74.62,42.876],[74.66,42.876],[74.70,42.876],[74.72,42.876]] }},
    { type: 'Feature', properties: { id: 'gorkogo', name: '\u0413\u043e\u0440\u044c\u043a\u043e\u0433\u043e', level: 0.45 }, geometry: { type: 'LineString', coordinates: [[74.48,42.861],[74.52,42.861],[74.56,42.861],[74.59,42.861],[74.62,42.861],[74.66,42.861],[74.70,42.861],[74.72,42.861]] }},
    { type: 'Feature', properties: { id: 'south', name: '\u042e\u0436\u043d\u0430\u044f \u043c\u0430\u0433\u0438\u0441\u0442\u0440\u0430\u043b\u044c', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.48,42.836],[74.52,42.836],[74.56,42.836],[74.59,42.836],[74.62,42.836],[74.66,42.836],[74.70,42.836],[74.72,42.836]] }},
    { type: 'Feature', properties: { id: 'ahunbaeva', name: '\u0410\u0445\u0443\u043d\u0431\u0430\u0435\u0432\u0430', level: 0.35 }, geometry: { type: 'LineString', coordinates: [[74.48,42.847],[74.52,42.847],[74.56,42.847],[74.59,42.847],[74.62,42.847],[74.66,42.847],[74.70,42.847],[74.72,42.847]] }},
    { type: 'Feature', properties: { id: 'togolok', name: '\u0422\u043e\u0433\u043e\u043b\u043e\u043a \u041c\u043e\u043b\u0434\u043e', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.48,42.892],[74.52,42.892],[74.56,42.892],[74.59,42.892],[74.62,42.892],[74.66,42.892],[74.70,42.892],[74.72,42.892]] }},
    { type: 'Feature', properties: { id: 'mederova', name: '\u041c\u0435\u0434\u0435\u0440\u043e\u0432\u0430', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.48,42.882],[74.52,42.882],[74.56,42.882],[74.59,42.882],[74.62,42.882],[74.66,42.882],[74.70,42.882],[74.72,42.882]] }},
    { type: 'Feature', properties: { id: 'isanova', name: '\u0418\u0441\u0430\u043d\u043e\u0432\u0430', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.48,42.855],[74.52,42.855],[74.56,42.855],[74.59,42.855],[74.62,42.855],[74.66,42.855],[74.70,42.855],[74.72,42.855]] }},
    // === \u0414\u043e\u043b\u0433\u043e\u0442\u043d\u044b\u0435 (\u0441\u0435\u0432\u0435\u0440-\u044e\u0433) ===
    { type: 'Feature', properties: { id: 'manas', name: '\u041f\u0440\u043e\u0441\u043f\u0435\u043a\u0442 \u041c\u0430\u043d\u0430\u0441\u0430', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.583,42.80],[74.583,42.82],[74.583,42.84],[74.583,42.86],[74.583,42.88],[74.583,42.90],[74.583,42.93]] }},
    { type: 'Feature', properties: { id: 'moskovskaya', name: '\u041c\u043e\u0441\u043a\u043e\u0432\u0441\u043a\u0430\u044f', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.592,42.80],[74.592,42.82],[74.592,42.84],[74.592,42.86],[74.592,42.88],[74.592,42.90],[74.592,42.93]] }},
    { type: 'Feature', properties: { id: 'abdrahmanova', name: '\u0410\u0431\u0434\u0440\u0430\u0445\u043c\u0430\u043d\u043e\u0432\u0430', level: 0.35 }, geometry: { type: 'LineString', coordinates: [[74.598,42.80],[74.598,42.82],[74.598,42.84],[74.598,42.86],[74.598,42.88],[74.598,42.90],[74.598,42.93]] }},
    { type: 'Feature', properties: { id: 'baytik', name: '\u0411\u0430\u0439\u0442\u0438\u043a \u0411\u0430\u0430\u0442\u044b\u0440\u0430', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.575,42.80],[74.575,42.82],[74.575,42.84],[74.575,42.86],[74.575,42.88],[74.575,42.90],[74.575,42.93]] }},
    { type: 'Feature', properties: { id: 'sovetskaya', name: '\u0421\u043e\u0432\u0435\u0442\u0441\u043a\u0430\u044f', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.570,42.80],[74.570,42.82],[74.570,42.84],[74.570,42.86],[74.570,42.88],[74.570,42.90],[74.570,42.93]] }},
    { type: 'Feature', properties: { id: '7apr', name: '\u0423\u043b. 7 \u0410\u043f\u0440\u0435\u043b\u044f', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.607,42.80],[74.607,42.82],[74.607,42.84],[74.607,42.86],[74.607,42.88],[74.607,42.90],[74.607,42.93]] }},
    // === \u041e\u0448\u0441\u043a\u0438\u0439 \u0440\u044b\u043d\u043e\u043a ===
    { type: 'Feature', properties: { id: 'osh', name: '\u041e\u0448\u0441\u043a\u0438\u0439 \u0440\u044b\u043d\u043e\u043a', level: 0.8 }, geometry: { type: 'LineString', coordinates: [[74.585,42.855],[74.590,42.858],[74.595,42.860],[74.600,42.862],[74.605,42.865]] }}
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
      'line-width': 6,
      'line-opacity': 0.04,
      'line-blur': 6
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
      'line-width': 1.2,
      'line-opacity': 0.3
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
      'line-width': 1,
      'line-opacity': 0.5,
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
