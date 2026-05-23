import { flyToObject } from './map.js';

// ---------------------------------------------------------------------------
// Реестр объектов — ID и статусы совпадают с бэкендовым OBJECT_REGISTRY
// ---------------------------------------------------------------------------
const CITY_OBJECTS = [
  // --- ТЭЦ ---
  { id: 'tec_1', name: 'ТЭЦ Бишкек', lat: 42.876, lng: 74.652, type: 'tec', color: '#e53935', states: ['coal_full','coal_reduced','filters_installed','gas_converted','off'], state: 'coal_full' },
  { id: 'tec_2_west', name: 'ТЭЦ-2 (запад)', lat: 42.870, lng: 74.540, type: 'tec', color: '#e53935', states: ['coal_full','coal_reduced','filters_installed','gas_converted','off'], state: 'coal_full' },
  // --- Парки ---
  { id: 'panfilov_park', name: 'Парк Панфилова', lat: 42.875, lng: 74.612, type: 'park', color: '#0ae448', states: ['active','reduced','inactive','destroyed'], state: 'active' },
  { id: 'ataturk_park', name: 'Парк Ата-Тюрк', lat: 42.882, lng: 74.589, type: 'park', color: '#0ae448', states: ['active','reduced','inactive','destroyed'], state: 'active' },
  { id: 'botanical_garden', name: 'Ботанический сад', lat: 42.857, lng: 74.574, type: 'park', color: '#0ae448', states: ['active','reduced','inactive','destroyed'], state: 'active' },
  { id: 'oak_park', name: 'Дубовый парк', lat: 42.874, lng: 74.604, type: 'park', color: '#0ae448', states: ['active','reduced','inactive','destroyed'], state: 'active' },
  { id: 'karagachevaya_grove', name: 'Карагачёвая роща', lat: 42.898, lng: 74.615, type: 'park', color: '#0ae448', states: ['active','reduced','inactive','destroyed'], state: 'active' },
  { id: 'korea_friendship_park', name: 'Парк дружбы Кореи', lat: 42.844, lng: 74.586, type: 'park', color: '#0ae448', states: ['active','reduced','inactive','destroyed'], state: 'active' },
  { id: 'togolok_moldo_square', name: 'Сквер Тоголок Молдо', lat: 42.872, lng: 74.594, type: 'park', color: '#0ae448', states: ['active','reduced','inactive','destroyed'], state: 'active' },
  // --- Частный сектор ---
  { id: 'private_sector_north', name: 'Частный сектор (север)', lat: 42.896, lng: 74.595, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_south', name: 'Частный сектор (юг)', lat: 42.838, lng: 74.590, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_west', name: 'Частный сектор (запад)', lat: 42.870, lng: 74.550, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_east', name: 'Частный сектор (восток)', lat: 42.870, lng: 74.640, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'gas_heating' },
  { id: 'asanbai', name: 'Мкр. Асанбай', lat: 42.844, lng: 74.630, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'gas_heating' },
  { id: 'novostroyka_ak_orgo', name: 'Ак-Орго', lat: 42.900, lng: 74.560, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'novostroyka_kelechek', name: 'Келечек', lat: 42.840, lng: 74.640, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  // --- Трафик ---
  { id: 'traffic_osh_bazaar', name: 'Ошский базар', lat: 42.862, lng: 74.598, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'congested' },
  { id: 'traffic_south_highway', name: 'Южная магистраль', lat: 42.835, lng: 74.585, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'traffic_chui', name: 'Проспект Чуй', lat: 42.874, lng: 74.593, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'traffic_manas', name: 'Проспект Манаса', lat: 42.868, lng: 74.583, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'free_flow' },
  { id: 'traffic_east_terminal', name: 'Восточный автовокзал', lat: 42.868, lng: 74.605, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  // --- Промышленность ---
  { id: 'factory_north', name: 'Северная промзона', lat: 42.900, lng: 74.570, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'full_load' },
  { id: 'factory_east', name: 'Восточная промзона', lat: 42.865, lng: 74.650, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'reduced' },
  { id: 'airport', name: 'Аэропорт Манас', lat: 42.853, lng: 74.537, type: 'factory', color: '#663af3', states: ['full_load','reduced','idle','shutdown'], state: 'reduced' }
];

const STATE_LABELS = {
  // ТЭЦ
  coal_full: 'Уголь (100%)', coal_reduced: 'Уголь (50%)', filters_installed: 'Фильтры', gas_converted: 'Газ', off: 'Остановлена',
  // Парки
  active: 'Активный', reduced: 'Сниженный', inactive: 'Неактивный', destroyed: 'Уничтожен',
  // Отопление
  coal_heating: 'Уголь', gas_heating: 'Газ', electric_heating: 'Электро', no_heating: 'Нет отопления',
  // Трафик
  congested: 'Пробка', moderate: 'Умеренно', free_flow: 'Свободно', closed: 'Закрыто',
  // Промышленность
  full_load: 'Полная нагрузка', idle: 'Простой', shutdown: 'Остановка',
  // Алиасы
  disabled: 'Отключено', normal: 'Нормально', low: 'Низкая', pedestrian_zone: 'Пешеходная зона'
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
