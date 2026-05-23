# 🌫 Bishkek Smog Simulation — API для фронтенда

> **Base URL:** `http://localhost:8000`

---

## 1. Эндпоинты

### `POST /api/v1/simulate`

Одиночный запрос → ответ. Подходит для первой загрузки карты или дебага.

### `WS /api/v1/ws/simulate`

WebSocket для real-time. Фронт шлёт JSON → бэк мгновенно отвечает JSON.  
**Рекомендуется использовать для интерактивной карты** — каждый клик по объекту отправляет новый `city_state`.

```js
const ws = new WebSocket("ws://localhost:8000/api/v1/ws/simulate");

ws.onopen = () => {
  ws.send(JSON.stringify(requestBody)); // см. формат ниже
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data); // SimulationResponse
  renderHeatmap(data.heatmap_data);
};
```

---

## 2. Формат запроса — `SimulationParams`

```jsonc
{
  "active_mode": "edit",            // опционально, по умолчанию "edit"
  "city_state": {                   // ОБЯЗАТЕЛЬНО — состояние каждого объекта
    "tec_1": "coal_full",
    "private_sector_north": "coal_heating",
    "private_sector_south": "coal_heating",
    "traffic_osh_bazaar": "congested",
    "botanical_garden": "active"
  },
  "weather": {                      // опционально — вручную задать погоду
    "wind_direction": 180,          // градусы, откуда дует (0 = север, 180 = юг)
    "wind_speed": 3.5,              // м/с
    "temperature": -5.0             // °C (при < 0 включается инверсия ×1.5)
  },
  "use_real_weather": false         // true → бэк сам запросит погоду из Open-Meteo
}
```

> Если `use_real_weather: true`, поля из `weather` **игнорируются** — бэк берёт реальные данные.

---

## 3. Формат ответа — `SimulationResponse`

```jsonc
{
  "status": "ok",
  "aqi": 187,                       // Air Quality Index (0–500)
  "heatmap_data": [                  // ~360 точек
    { "lat": 42.812345, "lng": 74.531234, "intensity": 0.42 },
    { "lat": 42.815678, "lng": 74.535678, "intensity": 0.18 },
    // ...
  ],
  "ai_insight": "AQI: 187 — качество воздуха: Нездоровое. Активных источников: 4, зелёных зон: 2. Ветер 3.5 м/с, направление 180° (шлейф → 0°)."
}
```

| Поле | Тип | Описание |
|---|---|---|
| `status` | `string` | Всегда `"ok"` |
| `aqi` | `int` | 0–500. Чем выше — тем хуже воздух |
| `heatmap_data` | `array` | Массив точек `{lat, lng, intensity}`. `intensity` от 0.0 (чисто) до 1.0 (максимум смога) |
| `ai_insight` | `string` | Текстовая сводка для UI-панели |

### Шкала AQI

| AQI | Уровень | Цвет (рекомендация) |
|---|---|---|
| 0–50 | Хорошее | 🟢 зелёный |
| 51–100 | Умеренное | 🟡 жёлтый |
| 101–150 | Нездоровое для чувствительных | 🟠 оранжевый |
| 151–200 | Нездоровое | 🔴 красный |
| 201–300 | Очень нездоровое | 🟣 фиолетовый |
| 301–500 | Опасное | 🟤 бордовый |

---

## 4. Реестр объектов — `city_state`

Каждый ключ в `city_state` — это ID объекта. Значение — его текущий статус.  
**Фронт должен знать эти ID и допустимые статусы:**

### 🏭 ТЭЦ / Промзона

| ID | Название | Координаты | Допустимые статусы |
|---|---|---|---|
| `tec_1` | ТЭЦ Бишкека | 42.876, 74.652 | `coal_full`, `filters_installed`, `gas_converted`, `disabled` |
| `tec_2_west` | ТЭЦ-2 (запад) | 42.870, 74.540 | `coal_full`, `filters_installed`, `gas_converted`, `disabled` |

### 🏠 Частный сектор

| ID | Название | Координаты | Допустимые статусы |
|---|---|---|---|
| `private_sector_north` | Север | 42.890, 74.580 | `coal_heating`, `gas_heating`, `electric_heating`, `disabled` |
| `private_sector_south` | Юг | 42.820, 74.580 | `coal_heating`, `gas_heating`, `electric_heating`, `disabled` |
| `private_sector_east` | Восток | 42.850, 74.650 | `coal_heating`, `gas_heating`, `disabled` |

### 🚗 Трафик

| ID | Название | Координаты | Допустимые статусы |
|---|---|---|---|
| `traffic_osh_bazaar` | Ош-базар | 42.875, 74.588 | `congested`, `normal`, `low`, `pedestrian_zone` |
| `traffic_east_terminal` | Восточный автовокзал | 42.868, 74.605 | `congested`, `normal`, `low`, `pedestrian_zone` |
| `traffic_south_highway` | Южная магистраль | 42.830, 74.610 | `congested`, `normal`, `low`, `closed` |

### 🏗 Новостройки

| ID | Название | Координаты | Допустимые статусы |
|---|---|---|---|
| `novostroyka_ak_orgo` | Ак-Орго | 42.900, 74.560 | `coal_heating`, `gas_heating`, `disabled` |
| `novostroyka_kelechek` | Келечек | 42.840, 74.640 | `coal_heating`, `gas_heating`, `disabled` |

### 🌳 Зелёные зоны

| ID | Название | Координаты | Допустимые статусы |
|---|---|---|---|
| `botanical_garden` | Ботанический сад | 42.840, 74.600 | `active`, `destroyed` |
| `oak_park` | Дубовый парк | 42.874, 74.604 | `active`, `destroyed` |
| `panfilov_park` | Парк Панфилова | 42.877, 74.598 | `active`, `destroyed` |
| `ataturk_park` | Парк Ататюрка | 42.842, 74.588 | `active`, `destroyed` |
| `karagachevaya_grove` | Карагачёвая роща | 42.898, 74.615 | `active`, `destroyed` |
| `korea_friendship_park` | Парк дружбы Кореи | 42.844, 74.586 | `active`, `destroyed` |
| `togolok_moldo_square` | Сквер Тоголок Молдо | 42.872, 74.594 | `active`, `destroyed` |

> **Правило:** зелёные зоны со статусом `active` **уменьшают** смог вокруг себя. `destroyed` — нейтральны или слегка загрязняют.

---

## 5. Типичный сценарий работы фронта

```
1. Пользователь открывает карту
   → Фронт подключается к WS /api/v1/ws/simulate
   → Отправляет дефолтный city_state
   ← Получает heatmap_data, рисует тепловую карту (Leaflet / Mapbox)

2. Пользователь кликает на ТЭЦ → меняет статус на "gas_converted"
   → Фронт обновляет city_state["tec_1"] = "gas_converted"
   → Отправляет весь city_state по WS
   ← Получает новый heatmap_data + aqi
   → Перерисовывает карту + обновляет AQI-панель

3. Пользователь двигает слайдер ветра
   → Фронт обновляет weather.wind_direction / wind_speed
   → Отправляет по WS
   ← Получает пересчитанные данные
```

---

## 6. Подключение к Leaflet.js (пример)

```js
// Heatmap-слой через leaflet-heat
const heat = L.heatLayer([], { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);

ws.onmessage = (event) => {
  const { heatmap_data, aqi, ai_insight } = JSON.parse(event.data);

  // Обновить тепловую карту
  const latlngs = heatmap_data.map(p => [p.lat, p.lng, p.intensity]);
  heat.setLatLngs(latlngs);

  // Обновить UI
  document.getElementById("aqi-value").textContent = aqi;
  document.getElementById("ai-text").textContent = ai_insight;
};
```

---

## 7. Дефолтные значения

Если отправить пустой запрос `{}`, бэк использует:

```json
{
  "active_mode": "edit",
  "city_state": {
    "tec_1": "coal_full",
    "private_sector_north": "coal_heating",
    "private_sector_south": "coal_heating",
    "traffic_osh_bazaar": "congested",
    "botanical_garden": "active"
  },
  "weather": { "wind_direction": 0, "wind_speed": 2.0, "temperature": 5.0 },
  "use_real_weather": false
}
```

> ⚠️ В дефолте только 5 объектов из 17. Остальные **не участвуют** в расчёте, пока фронт не добавит их в `city_state`.
