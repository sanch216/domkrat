import { MAPBOX_TOKEN } from './config.js';
import { TRAFFIC_ROADS } from './new_roads.js';

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

// TRAFFIC_ROADS imported from new_roads.js

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
