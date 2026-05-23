const CITY_OBJECTS = [
  { id: 'tec_1', name: 'ТЭЦ Бишкек', lat: 42.8465, lng: 74.6182, type: 'tec', color: '#ff3333', states: ['coal_full','coal_reduced','gas_converted','off'], state: 'coal_full' },
  { id: 'panfilov_park', name: 'Парк Панфилова', lat: 42.8746, lng: 74.6122, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'ata_turk_park', name: 'Парк Ата-Тюрк', lat: 42.8820, lng: 74.5885, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'botanical_garden', name: 'Ботанический сад', lat: 42.8571, lng: 74.5743, type: 'park', color: '#0ae448', states: ['active','reduced','inactive'], state: 'active' },
  { id: 'private_sector_north', name: 'Частный сектор (север)', lat: 42.8960, lng: 74.5950, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_south', name: 'Частный сектор (юг)', lat: 42.8380, lng: 74.5900, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_west', name: 'Частный сектор (запад)', lat: 42.8700, lng: 74.5500, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'coal_heating' },
  { id: 'private_sector_east', name: 'Частный сектор (восток)', lat: 42.8700, lng: 74.6400, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'gas_heating' },
  { id: 'microdistrict_asanbai', name: 'Мкр. Асанбай', lat: 42.8440, lng: 74.6300, type: 'district', color: '#ffc533', states: ['coal_heating','gas_heating','electric_heating','no_heating'], state: 'gas_heating' },
  { id: 'traffic_osh_bazaar', name: 'Ошский базар', lat: 42.8620, lng: 74.5980, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'congested' },
  { id: 'traffic_south_highway', name: 'Южная магистраль', lat: 42.8350, lng: 74.5850, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'traffic_chui_avenue', name: 'Проспект Чуй', lat: 42.8738, lng: 74.5932, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'traffic_manas_avenue', name: 'Проспект Манаса', lat: 42.8680, lng: 74.5828, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'free_flow' },
  { id: 'traffic_7_april', name: 'Ул. 7 Апреля', lat: 42.8770, lng: 74.6050, type: 'road', color: '#ff8709', states: ['congested','moderate','free_flow','closed'], state: 'moderate' },
  { id: 'factory_north_industrial', name: 'Северная промзона', lat: 42.9000, lng: 74.5700, type: 'factory', color: '#9c27b0', states: ['full_load','reduced','idle','shutdown'], state: 'full_load' },
  { id: 'factory_east_industrial', name: 'Восточная промзона', lat: 42.8650, lng: 74.6500, type: 'factory', color: '#9c27b0', states: ['full_load','reduced','idle','shutdown'], state: 'reduced' },
  { id: 'airport_manas', name: 'Аэропорт Манас', lat: 42.8533, lng: 74.5374, type: 'factory', color: '#9c27b0', states: ['full_load','reduced','idle','shutdown'], state: 'reduced' }
];

const STATE_LABELS = {
  coal_full: 'Уголь (100%)', coal_reduced: 'Уголь (50%)', gas_converted: 'Газ', off: 'Выкл',
  active: 'Активный', reduced: 'Сниженный', inactive: 'Неактивный',
  coal_heating: 'Уголь', gas_heating: 'Газ', electric_heating: 'Электро', no_heating: 'Нет отопления',
  congested: 'Пробка', moderate: 'Умеренно', free_flow: 'Свободно', closed: 'Закрыто',
  full_load: 'Полная нагрузка', idle: 'Простой', shutdown: 'Остановка'
};

const TYPE_LABELS = { tec: '🏭 ТЭЦ', park: '🌳 Парк', district: '🏘️ Район', road: '🛣️ Дорога', factory: '⚙️ Промышленность' };

let markers = [];
let currentPopup = null;
let onStateChangeCallback = null;

export function getCityObjects() { return CITY_OBJECTS; }

export function getCityState() {
  const state = {};
  CITY_OBJECTS.forEach(o => state[o.id] = o.state);
  return state;
}

export function addMarkers(map, onStateChange) {
  onStateChangeCallback = onStateChange;
  removeMarkers();

  CITY_OBJECTS.forEach(obj => {
    const el = document.createElement('div');
    el.style.cssText = `width:20px;height:20px;border-radius:50%;background:${obj.color};border:2px solid #fffce1;cursor:pointer;transition:all 0.2s;box-shadow:0 0 10px ${obj.color}80;`;
    el.title = obj.name;

    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.4)';
      el.style.boxShadow = `0 0 20px ${obj.color}`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = `0 0 10px ${obj.color}80`;
    });

    const marker = new mapboxgl.Marker(el)
      .setLngLat([obj.lng, obj.lat])
      .addTo(map);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      showPopup(map, obj);
    });

    markers.push(marker);
  });
}

function showPopup(map, obj) {
  if (currentPopup) currentPopup.remove();

  const optionsHtml = obj.states.map(s =>
    `<option value="${s}" ${s === obj.state ? 'selected' : ''}>${STATE_LABELS[s] || s}</option>`
  ).join('');

  const html = `
    <div class="marker-popup">
      <div class="marker-popup-header">
        <div class="marker-popup-dot" style="background:${obj.color};box-shadow:0 0 8px ${obj.color};"></div>
        <div class="marker-popup-name">${obj.name}</div>
      </div>
      <div class="marker-popup-type">${TYPE_LABELS[obj.type] || obj.type}</div>
      <div class="marker-popup-state" style="background:${obj.color}20;color:${obj.color};border:1px solid ${obj.color}40;">
        ${STATE_LABELS[obj.state] || obj.state}
      </div>
      <div class="marker-popup-controls">
        <label>Изменить состояние:</label>
        <select id="popup-state-select">${optionsHtml}</select>
        <button class="btn-pill btn-green btn-sm" id="popup-apply-btn" style="width:100%;justify-content:center;">Применить</button>
      </div>
    </div>
  `;

  currentPopup = new mapboxgl.Popup({ offset: 25, maxWidth: '280px' })
    .setLngLat([obj.lng, obj.lat])
    .setHTML(html)
    .addTo(map);

  currentPopup.on('open', () => {
    const select = document.getElementById('popup-state-select');
    const btn = document.getElementById('popup-apply-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        obj.state = select.value;
        currentPopup.remove();
        if (onStateChangeCallback) onStateChangeCallback();
      });
    }
  });
}

export function removeMarkers() {
  markers.forEach(m => m.remove());
  markers = [];
  if (currentPopup) { currentPopup.remove(); currentPopup = null; }
}
