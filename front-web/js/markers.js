import { flyToObject } from './map.js';

const CITY_OBJECTS = [
  { id: 'tec_1', name: '\u0422\u042d\u0426 \u0411\u0438\u0448\u043a\u0435\u043a', lat: 42.8465, lng: 74.6182, type: 'tec', color: '#e53935', states: ['coal_full','coal_reduced','gas_converted','off'], state: 'coal_full' },
  { id: 'panfilov_park', name: '\u041f\u0430\u0440\u043a \u041f\u0430\u043d\u0444\u0438\u043b\u043e\u0432\u0430', lat: 42.8746, lng: 74.6122, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'ataturk_park', name: '\u041f\u0430\u0440\u043a \u0410\u0442\u0430-\u0422\u044e\u0440\u043a', lat: 42.8820, lng: 74.5885, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'botanical_garden', name: '\u0411\u043e\u0442\u0430\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0441\u0430\u0434', lat: 42.8571, lng: 74.5743, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'private_sector_north', name: '\u0427\u0430\u0441\u0442\u043d\u044b\u0439 \u0441\u0435\u043a\u0442\u043e\u0440 (\u0441\u0435\u0432\u0435\u0440)', lat: 42.8960, lng: 74.5950, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_south', name: '\u0427\u0430\u0441\u0442\u043d\u044b\u0439 \u0441\u0435\u043a\u0442\u043e\u0440 (\u044e\u0433)', lat: 42.8380, lng: 74.5900, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_west', name: '\u0427\u0430\u0441\u0442\u043d\u044b\u0439 \u0441\u0435\u043a\u0442\u043e\u0440 (\u0437\u0430\u043f\u0430\u0434)', lat: 42.8700, lng: 74.5500, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_east', name: '\u0427\u0430\u0441\u0442\u043d\u044b\u0439 \u0441\u0435\u043a\u0442\u043e\u0440 (\u0432\u043e\u0441\u0442\u043e\u043a)', lat: 42.8700, lng: 74.6400, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'gas_heating' },
  { id: 'asanbai', name: '\u041c\u043a\u0440. \u0410\u0441\u0430\u043d\u0431\u0430\u0439', lat: 42.8440, lng: 74.6300, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'gas_heating' },
  { id: 'traffic_osh_bazaar', name: '\u041e\u0448\u0441\u043a\u0438\u0439 \u0431\u0430\u0437\u0430\u0440', lat: 42.8620, lng: 74.5980, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'congested' },
  { id: 'traffic_south_highway', name: '\u042e\u0436\u043d\u0430\u044f \u043c\u0430\u0433\u0438\u0441\u0442\u0440\u0430\u043b\u044c', lat: 42.8350, lng: 74.5850, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'traffic_chui', name: '\u041f\u0440\u043e\u0441\u043f\u0435\u043a\u0442 \u0427\u0443\u0439', lat: 42.8738, lng: 74.5932, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'traffic_manas', name: '\u041f\u0440\u043e\u0441\u043f\u0435\u043a\u0442 \u041c\u0430\u043d\u0430\u0441\u0430', lat: 42.8680, lng: 74.5828, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'free_flow' },
  { id: 'traffic_east_terminal', name: '\u0412\u043e\u0441\u0442\u043e\u0447\u043d\u044b\u0439 \u0430\u0432\u0442\u043e\u0432\u043e\u043a\u0437\u0430\u043b', lat: 42.8680, lng: 74.6050, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'factory_north', name: '\u0421\u0435\u0432\u0435\u0440\u043d\u0430\u044f \u043f\u0440\u043e\u043c\u0437\u043e\u043d\u0430', lat: 42.9000, lng: 74.5700, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'full_load' },
  { id: 'factory_east', name: '\u0412\u043e\u0441\u0442\u043e\u0447\u043d\u0430\u044f \u043f\u0440\u043e\u043c\u0437\u043e\u043d\u0430', lat: 42.8650, lng: 74.6500, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'reduced' },
  { id: 'airport', name: '\u0410\u044d\u0440\u043e\u043f\u043e\u0440\u0442 \u041c\u0430\u043d\u0430\u0441', lat: 42.8533, lng: 74.5374, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'reduced' }
];

const STATE_LABELS = {
  coal_full: '\u0423\u0433\u043e\u043b\u044c (100%)', coal_reduced: '\u0423\u0433\u043e\u043b\u044c (50%)', gas_converted: '\u0413\u0430\u0437', off: '\u041e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0430',
  active: '\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0439', reduced: '\u0421\u043d\u0438\u0436\u0435\u043d\u043d\u044b\u0439', inactive: '\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0439',
  coal_heating: '\u0423\u0433\u043e\u043b\u044c', gas_heating: '\u0413\u0430\u0437', electric_heating: '\u042d\u043b\u0435\u043a\u0442\u0440\u043e', no_heating: '\u041d\u0435\u0442 \u043e\u0442\u043e\u043f\u043b\u0435\u043d\u0438\u044f',
  congested: '\u041f\u0440\u043e\u0431\u043a\u0430', moderate: '\u0423\u043c\u0435\u0440\u0435\u043d\u043d\u043e', free_flow: '\u0421\u0432\u043e\u0431\u043e\u0434\u043d\u043e', closed: '\u0417\u0430\u043a\u0440\u044b\u0442\u043e',
  full_load: '\u041f\u043e\u043b\u043d\u0430\u044f \u043d\u0430\u0433\u0440\u0443\u0437\u043a\u0430', idle: '\u041f\u0440\u043e\u0441\u0442\u043e\u0439', shutdown: '\u041e\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0430'
};

const TYPE_LABELS = {
  tec: '\u0422\u042d\u0426',
  park: '\u041f\u0430\u0440\u043a',
  district: '\u0420\u0430\u0439\u043e\u043d',
  road: '\u0414\u043e\u0440\u043e\u0433\u0430',
  factory: '\u041f\u0440\u043e\u043c\u044b\u0448\u043b\u0435\u043d\u043d\u043e\u0441\u0442\u044c'
};

let markers = [];
let currentPopup = null;
let onStateChangeCb = null;

export function getCityObjects() { return CITY_OBJECTS; }

var DEFAULT_STATES = {};
CITY_OBJECTS.forEach(function(o) { DEFAULT_STATES[o.id] = o.state; });

export function getCityState() {
  var s = {};
  CITY_OBJECTS.forEach(function(o) { s[o.id] = o.state; });
  return s;
}

export function resetCityState() {
  CITY_OBJECTS.forEach(function(o) { o.state = DEFAULT_STATES[o.id]; });
}

export function addMarkers(map, onStateChange) {
  onStateChangeCb = onStateChange;
  removeMarkers();

  CITY_OBJECTS.forEach(function(obj) {
    var el = document.createElement('div');
    el.style.cssText =
      'width:18px;height:18px;border-radius:50%;' +
      'background:' + obj.color + ';' +
      'border:2px solid rgba(255,255,255,0.25);' +
      'cursor:pointer;' +
      'transition:all 0.25s cubic-bezier(0.16,1,0.3,1);' +
      'box-shadow:0 0 12px ' + obj.color + '60, 0 0 4px ' + obj.color + '90;';
    el.title = obj.name;

    el.addEventListener('mouseenter', function() {
      el.style.transform = 'scale(1.5)';
      el.style.boxShadow = '0 0 24px ' + obj.color + ', 0 0 8px ' + obj.color;
    });
    el.addEventListener('mouseleave', function() {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 0 12px ' + obj.color + '60, 0 0 4px ' + obj.color + '90';
    });

    var marker = new mapboxgl.Marker(el)
      .setLngLat([obj.lng, obj.lat])
      .addTo(map);

    el.addEventListener('click', function(e) {
      e.stopPropagation();
      flyToObject(obj.lng, obj.lat);
      setTimeout(function() { showCard(map, obj); }, 1400);
    });

    markers.push(marker);
  });
}

function showCard(map, obj) {
  if (currentPopup) currentPopup.remove();

  var optionsHtml = obj.states.map(function(s) {
    return '<option value="' + s + '" ' + (s === obj.state ? 'selected' : '') + '>' + (STATE_LABELS[s] || s) + '</option>';
  }).join('');

  var html =
    '<div class="marker-card">' +
      '<div class="marker-card-header">' +
        '<div class="marker-dot" style="background:' + obj.color + ';box-shadow:0 0 10px ' + obj.color + ';"></div>' +
        '<div>' +
          '<div class="marker-card-name">' + obj.name + '</div>' +
          '<div class="marker-card-type">' + (TYPE_LABELS[obj.type] || obj.type) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="marker-card-status" style="background:' + obj.color + '15;color:' + obj.color + ';border:1px solid ' + obj.color + '30;">' +
        (STATE_LABELS[obj.state] || obj.state) +
      '</div>' +
      '<button class="btn-pill btn-sm" id="popup-edit-toggle" style="width:100%;justify-content:center;margin-top:4px;">\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c</button>' +
      '<div class="marker-card-edit hidden" id="popup-edit-panel">' +
        '<label>\u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435:</label>' +
        '<select id="popup-state-select">' + optionsHtml + '</select>' +
        '<button class="btn-pill btn-green btn-sm" id="popup-apply-btn" style="width:100%;justify-content:center;">\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c</button>' +
      '</div>' +
    '</div>';

  currentPopup = new mapboxgl.Popup({ offset: 30, maxWidth: '280px' })
    .setLngLat([obj.lng, obj.lat])
    .setHTML(html)
    .addTo(map);

  setTimeout(function() {
    var editBtn = document.getElementById('popup-edit-toggle');
    var editPanel = document.getElementById('popup-edit-panel');
    var applyBtn = document.getElementById('popup-apply-btn');
    var select = document.getElementById('popup-state-select');

    if (editBtn && editPanel) {
      editBtn.addEventListener('click', function() {
        editPanel.classList.toggle('hidden');
        editBtn.textContent = editPanel.classList.contains('hidden') ? '\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c' : '\u0417\u0430\u043a\u0440\u044b\u0442\u044c';
      });
    }

    if (applyBtn && select) {
      applyBtn.addEventListener('click', function() {
        obj.state = select.value;
        if (window.showNotification) window.showNotification(obj.name + ': ' + (STATE_LABELS[select.value] || select.value), 'info');
        currentPopup.remove();
        if (onStateChangeCb) onStateChangeCb();
      });
    }
  }, 0);
}

export function removeMarkers() {
  markers.forEach(function(m) { m.remove(); });
  markers = [];
  if (currentPopup) { currentPopup.remove(); currentPopup = null; }
}
