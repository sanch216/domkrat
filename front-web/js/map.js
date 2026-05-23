const TOKEN = 'pk.eyJ1IjoiczB5YSIsImEiOiJjbXBpbXQxOWIwZzluMnBzYjZnZHRsaXZ1In0.q7UZNIGWlkwVn9jdaCpV7A';
const CENTER = [74.59, 42.87];

let map = null;

const TRAFFIC_ROADS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'traffic_chui_avenue', name: 'Проспект Чуй', level: 'moderate' },
      geometry: {
        type: 'LineString',
        coordinates: [[74.555, 42.8738],[74.565, 42.8738],[74.575, 42.8738],[74.585, 42.8738],[74.595, 42.8738],[74.605, 42.8738],[74.615, 42.8738],[74.625, 42.8738],[74.635, 42.8738]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'traffic_manas_avenue', name: 'Проспект Манаса', level: 'free_flow' },
      geometry: {
        type: 'LineString',
        coordinates: [[74.5828, 42.845],[74.5828, 42.855],[74.5828, 42.865],[74.5828, 42.875],[74.5828, 42.885],[74.5828, 42.895]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'traffic_south_highway', name: 'Южная магистраль', level: 'moderate' },
      geometry: {
        type: 'LineString',
        coordinates: [[74.555, 42.835],[74.570, 42.835],[74.585, 42.835],[74.600, 42.835],[74.615, 42.835],[74.630, 42.835]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'traffic_7_april', name: 'Ул. 7 Апреля', level: 'moderate' },
      geometry: {
        type: 'LineString',
        coordinates: [[74.605, 42.855],[74.605, 42.865],[74.605, 42.875],[74.605, 42.885]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'traffic_osh_bazaar', name: 'Ошский базар', level: 'congested' },
      geometry: {
        type: 'LineString',
        coordinates: [[74.590, 42.856],[74.593, 42.858],[74.596, 42.860],[74.600, 42.862],[74.604, 42.864]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'traffic_baytyik', name: 'Ул. Байтик Баатыра', level: 'free_flow' },
      geometry: {
        type: 'LineString',
        coordinates: [[74.575, 42.845],[74.575, 42.855],[74.575, 42.865],[74.575, 42.875],[74.575, 42.885]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'traffic_jibek_jolu', name: 'Ул. Жибек Жолу', level: 'moderate' },
      geometry: {
        type: 'LineString',
        coordinates: [[74.555, 42.870],[74.570, 42.870],[74.585, 42.870],[74.600, 42.870],[74.615, 42.870],[74.630, 42.870]]
      }
    }
  ]
};

export function initMap(containerId, options = {}) {
  mapboxgl.accessToken = TOKEN;

  map = new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: options.center || CENTER,
    zoom: options.zoom || 12,
    pitch: options.pitch ?? 45,
    bearing: options.bearing ?? -15,
    antialias: true
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

  map.on('load', () => {
    add3DBuildings();
    addHeatmapLayer();
    addTrafficLayer();

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
      'fill-extrusion-color': '#1a1c1b',
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.5, ['get', 'height']],
      'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.5, ['get', 'min_height']],
      'fill-extrusion-opacity': 0.7
    }
  }, labelLayerId);
}

function addHeatmapLayer() {
  map.addSource('smog-heatmap', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  map.addLayer({
    id: 'smog-heat',
    type: 'heatmap',
    source: 'smog-heatmap',
    paint: {
      'heatmap-weight': ['get', 'intensity'],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 2],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,0,0)',
        0.1, 'rgba(10, 228, 72, 0.35)',
        0.25, 'rgba(171, 255, 132, 0.5)',
        0.4, 'rgba(255, 197, 51, 0.6)',
        0.55, 'rgba(255, 135, 9, 0.7)',
        0.7, 'rgba(255, 51, 51, 0.8)',
        0.85, 'rgba(200, 30, 60, 0.85)',
        1.0, 'rgba(136, 14, 79, 0.95)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 30, 15, 50],
      'heatmap-opacity': 0.8
    }
  });
}

function addTrafficLayer() {
  map.addSource('traffic-roads', {
    type: 'geojson',
    data: TRAFFIC_ROADS
  });

  map.addLayer({
    id: 'traffic-lines-glow',
    type: 'line',
    source: 'traffic-roads',
    paint: {
      'line-color': [
        'match', ['get', 'level'],
        'free_flow', '#0ae448',
        'moderate', '#ff8709',
        'congested', '#ff3333',
        'closed', '#7c7c6f',
        '#ff8709'
      ],
      'line-width': 8,
      'line-opacity': 0.15,
      'line-blur': 6
    }
  });

  map.addLayer({
    id: 'traffic-lines',
    type: 'line',
    source: 'traffic-roads',
    paint: {
      'line-color': [
        'match', ['get', 'level'],
        'free_flow', '#0ae448',
        'moderate', '#ff8709',
        'congested', '#ff3333',
        'closed', '#7c7c6f',
        '#ff8709'
      ],
      'line-width': 3,
      'line-opacity': 0.8
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  });
}

export function updateHeatmap(points) {
  if (!map) return;
  const features = points.map(p => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    properties: { intensity: p.intensity }
  }));
  const source = map.getSource('smog-heatmap');
  if (source) source.setData({ type: 'FeatureCollection', features });
}

export function clearHeatmap() {
  if (!map) return;
  const source = map.getSource('smog-heatmap');
  if (source) source.setData({ type: 'FeatureCollection', features: [] });
}

export function updateTrafficLevel(globalLevel) {
  if (!map) return;
  const updated = JSON.parse(JSON.stringify(TRAFFIC_ROADS));
  const levels = ['free_flow', 'moderate', 'congested'];
  updated.features.forEach(f => {
    const base = Math.random();
    const idx = Math.min(Math.floor((globalLevel / 100 + base * 0.3) * 3), 2);
    f.properties.level = levels[idx];
  });
  const source = map.getSource('traffic-roads');
  if (source) source.setData(updated);
}

export function getMap() { return map; }

export function initPreviewMap(containerId) {
  mapboxgl.accessToken = TOKEN;
  return new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: CENTER,
    zoom: 11.5,
    pitch: 40,
    bearing: 10,
    interactive: false
  });
}
