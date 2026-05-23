import { flyToObject } from './map.js';

const CITY_OBJECTS = [
  { id: 'tec_1', name: 'ТЭЦ Бишкек', lat: 42.8465, lng: 74.6182, type: 'tec', color: '#e53935', states: ['coal_full','coal_reduced','gas_converted','off'], state: 'coal_full' },
  { id: 'panfilov_park', name: 'Парк Панфилова', lat: 42.8746, lng: 74.6122, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'ata_turk_park', name: 'Парк Ата-Тюрк', lat: 42.8820, lng: 74.5885, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'botanical_garden', name: 'Ботанический сад', lat: 42.8571, lng: 74.5743, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'private_north', name: 'Частный сектор (север)', lat: 42.8960, lng: 74.5950, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_south', name: 'Частный сектор (юг)', lat: 42.8380, lng: 74.5900, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_west', name: 'Частный сектор (запад)', lat: 42.8700, lng: 74.5500, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_east', name: 'Частный сектор (восток)', lat: 42.8700, lng: 74.6400, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'gas_heating' },
  { id: 'asanbai', name: 'Мкр. Асанбай', lat: 42.8440, lng: 74.6300, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'gas_heating' },
  { id: 'traffic_osh', name: 'Ошский базар', lat: 42.8620, lng: 74.5980, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'congested' },
  { id: 'traffic_south', name: 'Южная магистраль', lat: 42.8350, lng: 74.5850, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'traffic_chui', name: 'Проспект Чуй', lat: 42.8738, lng: 74.5932, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'traffic_manas', name: 'Проспект Манаса', lat: 42.8680, lng: 74.5828, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'free_flow' },
  { id: 'traffic_7apr', name: 'Ул. 7 Апреля', lat: 42.8770, lng: 74.6050, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'factory_north', name: 'Северная промзона', lat: 42.9000, lng: 74.5700, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'full_load' },
  { id: 'factory_east', name: 'Восточная промзона', lat: 42.8650, lng: 74.6500, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'reduced' },
  { id: 'airport', name: 'Аэропорт Манас', lat: 42.8533, lng: 74.5374, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'reduced' }
];

const STATE_LABELS = {
  coal_full: 'Уголь (100%)', coal_reduced: 'Уголь (50%)', gas_converted: 'Газ', off: 'Остановлена',
  active: 'Активный', reduced: 'Сниженный', inactive: 'Неактивный',
  coal_heating: 'Уголь', gas_heating: 'Газ', electric_heating: 'Электро', no_heating: 'Нет отопления',
  congested: 'Пробка', moderate: 'Умеренно', free_flow: 'Свободно', closed: 'Закрыто',
  full_load: 'Полная нагрузка', idle: 'Простой', shutdown: 'Остановка'
};

const TYPE_LABELS = {
  tec: 'ТЭЦ',
  park: 'Парк',
  district: 'Район',
  road: 'Дорога',
  factory: 'Промышленность'
};

let markers = [];
let currentPopup = null;
let onStateChangeCb = null;

export function getCityObjects() { return CITY_OBJECTS; }

export function getCityState() {
  var s = {};
  CITY_OBJECTS.forEach(function(o) { s[o.id] = o.state; });
  return s;
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
      '<button class="btn-pill btn-sm" id="popup-edit-toggle" style="width:100%;justify-content:center;margin-top:4px;">Изменить</button>' +
      '<div class="marker-card-edit hidden" id="popup-edit-panel">' +
        '<label>Состояние:</label>' +
        '<select id="popup-state-select">' + optionsHtml + '</select>' +
        '<button class="btn-pill btn-green btn-sm" id="popup-apply-btn" style="width:100%;justify-content:center;">Применить</button>' +
      '</div>' +
    '</div>';

  currentPopup = new mapboxgl.Popup({ offset: 30, maxWidth: '280px' })
    .setLngLat([obj.lng, obj.lat])
    .setHTML(html)
    .addTo(map);

  currentPopup.on('open', function() {
    var editBtn = document.getElementById('popup-edit-toggle');
    var editPanel = document.getElementById('popup-edit-panel');
    var applyBtn = document.getElementById('popup-apply-btn');
    var select = document.getElementById('popup-state-select');

    if (editBtn && editPanel) {
      editBtn.addEventListener('click', function() {
        editPanel.classList.toggle('hidden');
        editBtn.textContent = editPanel.classList.contains('hidden') ? 'Изменить' : 'Закрыть';
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
  });
}

export function removeMarkers() {
  markers.forEach(function(m) { m.remove(); });
  markers = [];
  if (currentPopup) { currentPopup.remove(); currentPopup = null; }
}
