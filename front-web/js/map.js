import { MAPBOX_TOKEN } from './config.js';

const CENTER = [74.59, 42.87];
const ROWS = 5;
const COLS = 6;
const LAT_MIN = 42.825;
const LAT_MAX = 42.910;
const LNG_MIN = 74.530;
const LNG_MAX = 74.660;

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
    { type: 'Feature', properties: { id: 'chui', name: 'Проспект Чуй', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.545,42.8738],[74.555,42.8738],[74.565,42.8738],[74.575,42.8738],[74.585,42.8738],[74.595,42.8738],[74.605,42.8738],[74.615,42.8738],[74.625,42.8738],[74.635,42.8738]] }},
    { type: 'Feature', properties: { id: 'manas', name: 'Проспект Манаса', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.5828,42.840],[74.5828,42.850],[74.5828,42.860],[74.5828,42.870],[74.5828,42.880],[74.5828,42.895]] }},
    { type: 'Feature', properties: { id: 'south', name: 'Южная магистраль', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.545,42.835],[74.560,42.835],[74.575,42.835],[74.590,42.835],[74.605,42.835],[74.620,42.835],[74.635,42.835]] }},
    { type: 'Feature', properties: { id: '7apr', name: 'Ул. 7 Апреля', level: 0.4 }, geometry: { type: 'LineString', coordinates: [[74.605,42.850],[74.605,42.860],[74.605,42.870],[74.605,42.880],[74.605,42.890]] }},
    { type: 'Feature', properties: { id: 'osh', name: 'Ошский базар', level: 0.8 }, geometry: { type: 'LineString', coordinates: [[74.588,42.855],[74.592,42.858],[74.596,42.860],[74.600,42.862],[74.604,42.865]] }},
    { type: 'Feature', properties: { id: 'baytik', name: 'Байтик Баатыра', level: 0.3 }, geometry: { type: 'LineString', coordinates: [[74.575,42.840],[74.575,42.850],[74.575,42.860],[74.575,42.870],[74.575,42.880],[74.575,42.890]] }},
    { type: 'Feature', properties: { id: 'jibek', name: 'Жибек Жолу', level: 0.5 }, geometry: { type: 'LineString', coordinates: [[74.545,42.870],[74.560,42.870],[74.575,42.870],[74.590,42.870],[74.605,42.870],[74.620,42.870],[74.635,42.870]] }}
  ]
};

function generateSegments() {
  const latStep = (LAT_MAX - LAT_MIN) / ROWS;
  const lngStep = (LNG_MAX - LNG_MIN) / COLS;
  const features = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const lat1 = LAT_MIN + r * latStep;
      const lat2 = lat1 + latStep;
      const lng1 = LNG_MIN + c * lngStep;
      const lng2 = lng1 + lngStep;
      features.push({
        type: 'Feature',
        properties: { id: `seg_${r}_${c}`, row: r, col: c, intensity: 0 },
        geometry: {
          type: 'Polygon',
          coordinates: [[[lng1,lat1],[lng2,lat1],[lng2,lat2],[lng1,lat2],[lng1,lat1]]]
        }
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

export function initMap(containerId, options = {}) {
  mapboxgl.accessToken = MAPBOX_TOKEN;

  map = new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: options.center || CENTER,
    zoom: options.zoom || 12,
    pitch: options.pitch ?? 50,
    bearing: options.bearing ?? -15,
    antialias: true
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

  map.on('load', () => {
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
  const layers = map.getStyle().layers;
  let labelLayerId;
  for (const layer of layers) {
    if (layer.type === 'symbol' && layer.layout['text-field']) {
      labelLayerId = layer.id;
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
        0, 'rgba(8, 135, 43, 0.03)',
        0.15, 'rgba(8, 135, 43, 0.12)',
        0.3, 'rgba(141, 214, 255, 0.15)',
        0.45, 'rgba(255, 193, 7, 0.2)',
        0.6, 'rgba(255, 135, 9, 0.3)',
        0.75, 'rgba(229, 57, 53, 0.4)',
        0.9, 'rgba(200, 30, 60, 0.55)',
        1.0, 'rgba(160, 20, 50, 0.65)'
      ],
      'fill-opacity': 0.7
    }
  }, '3d-buildings');

  map.addLayer({
    id: 'smog-border',
    type: 'line',
    source: 'smog-segments',
    paint: {
      'line-color': [
        'interpolate', ['linear'], ['get', 'intensity'],
        0, 'rgba(141, 214, 255, 0.04)',
        0.3, 'rgba(141, 214, 255, 0.08)',
        0.6, 'rgba(255, 135, 9, 0.12)',
        1.0, 'rgba(229, 57, 53, 0.2)'
      ],
      'line-width': 1
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
    trafficAnimId = setTimeout(() => requestAnimationFrame(tick), trafficSpeed);
  }
  tick();
}

function startSegmentPulse() {
  function tick() {
    segPulsePhase += 0.02;
    const opc = 0.55 + Math.sin(segPulsePhase) * 0.15;
    if (map.getLayer('smog-fill')) {
      map.setPaintProperty('smog-fill', 'fill-opacity', opc);
    }
    segPulseId = requestAnimationFrame(tick);
  }
  tick();
}

export function updateSmogSegments(heatmapData) {
  if (!map) return;
  const segments = generateSegments();
  const latStep = (LAT_MAX - LAT_MIN) / ROWS;
  const lngStep = (LNG_MAX - LNG_MIN) / COLS;

  segments.features.forEach(seg => {
    const r = seg.properties.row;
    const c = seg.properties.col;
    const lat1 = LAT_MIN + r * latStep;
    const lat2 = lat1 + latStep;
    const lng1 = LNG_MIN + c * lngStep;
    const lng2 = lng1 + lngStep;

    const pts = heatmapData.filter(p => p.lat >= lat1 && p.lat < lat2 && p.lng >= lng1 && p.lng < lng2);
    if (pts.length > 0) {
      seg.properties.intensity = pts.reduce((s, p) => s + p.intensity, 0) / pts.length;
    }
  });

  const src = map.getSource('smog-segments');
  if (src) src.setData(segments);
}

export function clearSmogSegments() {
  if (!map) return;
  const src = map.getSource('smog-segments');
  if (src) src.setData(generateSegments());
}

export function updateTrafficLevel(globalLevel) {
  if (!map) return;
  const updated = JSON.parse(JSON.stringify(TRAFFIC_ROADS));
  updated.features.forEach(f => {
    const base = f.properties.level;
    f.properties.level = Math.min(1, base * 0.4 + (globalLevel / 100) * 0.6 + (Math.random() - 0.5) * 0.1);
  });
  const src = map.getSource('traffic-roads');
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
  const pm = new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: CENTER,
    zoom: 11.5,
    pitch: 45,
    bearing: 10,
    interactive: false
  });
  return pm;
}
