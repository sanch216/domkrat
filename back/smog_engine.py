import logging
import math
import os
import random
import sys

from schemas import SimulationParams, HeatmapPoint
from weather_service import get_current_bishkek_weather

# Добавляем корень проекта в sys.path для импорта ai/
_root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root_dir not in sys.path:
    sys.path.append(_root_dir)

# ---------------------------------------------------------------------------
# Координаты Бишкека
# ---------------------------------------------------------------------------
CENTER_LAT = 42.87
CENTER_LNG = 74.59
GRID_SPREAD = 0.06          # ±0.06° ≈ 6-7 km от центра
GRID_STEPS_LAT = 18         # кол-во шагов по широте
GRID_STEPS_LNG = 20         # кол-во шагов по долготе  (18×20 = 360 точек)

# Один градус ≈ 111 km; используем для перевода Δlat/Δlng → «условные km»
DEG_TO_KM = 111.0

# ---------------------------------------------------------------------------
# Реестр объектов Бишкека: координаты + веса по статусам
#   Положительный вес = загрязнение, отрицательный = поглощение (зелёная зона)
# ---------------------------------------------------------------------------
OBJECT_REGISTRY: dict[str, dict] = {
    # --- ТЭЦ и промзона ---
    "tec_1": {
        "lat": 42.876, "lng": 74.652,
        "statuses": {
            "coal_full": 1.0,
            "coal_reduced": 0.55,
            "filters_installed": 0.5,
            "gas_converted": 0.15,
            "off": 0.0,
            "disabled": 0.0,
        },
    },
    "tec_2_west": {
        "lat": 42.870, "lng": 74.540,
        "statuses": {
            "coal_full": 0.7,
            "coal_reduced": 0.4,
            "filters_installed": 0.35,
            "gas_converted": 0.08,
            "off": 0.0,
            "disabled": 0.0,
        },
    },
    # --- Угольный частный сектор ---
    "private_sector_north": {
        "lat": 42.896, "lng": 74.595,
        "statuses": {
            "coal_heating": 0.7,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "no_heating": 0.0,
            "disabled": 0.0,
        },
    },
    "private_sector_south": {
        "lat": 42.838, "lng": 74.590,
        "statuses": {
            "coal_heating": 0.8,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "no_heating": 0.0,
            "disabled": 0.0,
        },
    },
    "private_sector_east": {
        "lat": 42.870, "lng": 74.640,
        "statuses": {
            "coal_heating": 0.6,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "no_heating": 0.0,
            "disabled": 0.0,
        },
    },
    "private_sector_west": {
        "lat": 42.870, "lng": 74.550,
        "statuses": {
            "coal_heating": 0.65,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "no_heating": 0.0,
            "disabled": 0.0,
        },
    },
    # --- Новостройки ---
    "novostroyka_ak_orgo": {
        "lat": 42.900, "lng": 74.560,
        "statuses": {
            "coal_heating": 0.65,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "no_heating": 0.0,
            "disabled": 0.0,
        },
    },
    "novostroyka_kelechek": {
        "lat": 42.840, "lng": 74.640,
        "statuses": {
            "coal_heating": 0.55,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "no_heating": 0.0,
            "disabled": 0.0,
        },
    },
    "asanbai": {
        "lat": 42.844, "lng": 74.630,
        "statuses": {
            "coal_heating": 0.5,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "no_heating": 0.0,
            "disabled": 0.0,
        },
    },
    # --- Трафик-хабы ---
    "traffic_osh_bazaar": {
        "lat": 42.862, "lng": 74.598,
        "statuses": {
            "congested": 0.9,
            "moderate": 0.4,
            "normal": 0.4,
            "free_flow": 0.15,
            "low": 0.15,
            "pedestrian_zone": 0.0,
            "closed": 0.0,
        },
    },
    "traffic_east_terminal": {
        "lat": 42.868, "lng": 74.605,
        "statuses": {
            "congested": 0.8,
            "moderate": 0.35,
            "normal": 0.35,
            "free_flow": 0.1,
            "low": 0.1,
            "pedestrian_zone": 0.0,
            "closed": 0.0,
        },
    },
    "traffic_south_highway": {
        "lat": 42.835, "lng": 74.585,
        "statuses": {
            "congested": 0.7,
            "moderate": 0.3,
            "normal": 0.3,
            "free_flow": 0.1,
            "low": 0.1,
            "closed": 0.0,
        },
    },
    "traffic_chui": {
        "lat": 42.874, "lng": 74.593,
        "statuses": {
            "congested": 0.85,
            "moderate": 0.35,
            "normal": 0.35,
            "free_flow": 0.12,
            "low": 0.12,
            "closed": 0.0,
        },
    },
    "traffic_manas": {
        "lat": 42.868, "lng": 74.583,
        "statuses": {
            "congested": 0.7,
            "moderate": 0.3,
            "normal": 0.3,
            "free_flow": 0.1,
            "low": 0.1,
            "closed": 0.0,
        },
    },
    # --- Промышленные зоны ---
    "factory_north": {
        "lat": 42.900, "lng": 74.570,
        "statuses": {
            "full_load": 0.7,
            "reduced": 0.35,
            "idle": 0.08,
            "shutdown": 0.0,
            "disabled": 0.0,
        },
    },
    "factory_east": {
        "lat": 42.865, "lng": 74.650,
        "statuses": {
            "full_load": 0.6,
            "reduced": 0.3,
            "idle": 0.06,
            "shutdown": 0.0,
            "disabled": 0.0,
        },
    },
    "airport": {
        "lat": 42.853, "lng": 74.537,
        "statuses": {
            "full_load": 0.5,
            "reduced": 0.25,
            "idle": 0.05,
            "shutdown": 0.0,
            "disabled": 0.0,
        },
    },
    # --- Зелёные зоны (поглощение) ---
    "botanical_garden": {
        "lat": 42.857, "lng": 74.574,
        "statuses": {
            "active": -0.3,
            "reduced": -0.15,
            "inactive": 0.0,
            "destroyed": 0.1,
        },
    },
    "oak_park": {
        "lat": 42.874, "lng": 74.604,
        "statuses": {
            "active": -0.15,
            "reduced": -0.08,
            "inactive": 0.0,
            "destroyed": 0.05,
        },
    },
    "panfilov_park": {
        "lat": 42.875, "lng": 74.612,
        "statuses": {
            "active": -0.2,
            "reduced": -0.1,
            "inactive": 0.0,
            "destroyed": 0.0,
        },
    },
    "ataturk_park": {
        "lat": 42.882, "lng": 74.589,
        "statuses": {
            "active": -0.2,
            "reduced": -0.1,
            "inactive": 0.0,
            "destroyed": 0.0,
        },
    },
    "karagachevaya_grove": {
        "lat": 42.898, "lng": 74.615,
        "statuses": {
            "active": -0.5,
            "reduced": -0.25,
            "inactive": 0.0,
            "destroyed": 0.1,
        },
    },
    "korea_friendship_park": {
        "lat": 42.844, "lng": 74.586,
        "statuses": {
            "active": -0.1,
            "reduced": -0.05,
            "inactive": 0.0,
            "destroyed": 0.05,
        },
    },
    "togolok_moldo_square": {
        "lat": 42.872, "lng": 74.594,
        "statuses": {
            "active": -0.05,
            "reduced": -0.02,
            "inactive": 0.0,
            "destroyed": 0.02,
        },
    },
}


# ---------------------------------------------------------------------------
# Основная функция
# ---------------------------------------------------------------------------
async def generate_mock_heatmap(
    params: SimulationParams,
) -> tuple[list[HeatmapPoint], int, str, int | None]:
    """Gaussian-plume симуляция смога Бишкека на основе city_state."""

    # --- Погода ------------------------------------------------------------
    temperature = params.weather.temperature
    wind_speed = params.weather.wind_speed
    wind_direction = params.weather.wind_direction

    if params.use_real_weather:
        weather = await get_current_bishkek_weather()
        wind_speed = weather["wind_speed"]
        wind_direction = weather["wind_direction"]
        temperature = weather["temperature"]

    # Метеорологический wind_direction = откуда дует.
    # Направление шлейфа = куда несёт смог.
    plume_dir_deg = (wind_direction + 180) % 360
    plume_dir_rad = math.radians(plume_dir_deg)

    # Инверсия при отрицательной температуре
    inversion_mult = 1.5 if temperature < 0 else 1.0

    # --- Динамические источники из city_state ------------------------------
    sources: list[dict] = []
    for obj_key, status in params.city_state.items():
        registry_entry = OBJECT_REGISTRY.get(obj_key)
        if registry_entry is None:
            logging.warning("Unknown object key in city_state: %s. Skipping.", obj_key)
            continue
        base_emission = registry_entry["statuses"].get(status, None)
        if base_emission is None:
            logging.warning("Unknown status '%s' for object '%s'. Using 0.0 emission.", status, obj_key)
            base_emission = 0.0
        sources.append({
            "lat": registry_entry["lat"],
            "lng": registry_entry["lng"],
            "emission": base_emission,
        })

    # --- Сетка точек -------------------------------------------------------
    lat_step = (2 * GRID_SPREAD) / GRID_STEPS_LAT
    lng_step = (2 * GRID_SPREAD) / GRID_STEPS_LNG

    points: list[HeatmapPoint] = []
    intensity_sum = 0.0

    for i in range(GRID_STEPS_LAT):
        for j in range(GRID_STEPS_LNG):
            p_lat = (CENTER_LAT - GRID_SPREAD) + lat_step * i + random.uniform(0, lat_step * 0.3)
            p_lng = (CENTER_LNG - GRID_SPREAD) + lng_step * j + random.uniform(0, lng_step * 0.3)

            total_intensity = 0.0

            for src in sources:
                em = src["emission"]
                is_absorber = em < 0
                em_abs = abs(em)
                if em_abs < 0.01:
                    continue

                # Вектор от источника к точке
                dlat = (p_lat - src["lat"]) * DEG_TO_KM
                dlng = (p_lng - src["lng"]) * DEG_TO_KM * math.cos(math.radians(src["lat"]))
                d = math.hypot(dlat, dlng)  # расстояние в «условных km»

                # Затухание с расстоянием
                distance_decay = 1.0 / (1.0 + d * 8.0)

                # Направленный множитель (plume) — только для загрязнителей
                if not is_absorber and d > 0.01 and wind_speed > 0.3:
                    angle_to_point = math.atan2(dlng, dlat)  # радианы
                    angle_diff = angle_to_point - plume_dir_rad
                    # Нормализуем в [-π, π]
                    angle_diff = (angle_diff + math.pi) % (2 * math.pi) - math.pi

                    # cos-фактор: 1.0 по ветру, ~0.15 против ветра
                    directional = 0.15 + 0.85 * max(0.0, math.cos(angle_diff))
                    # Чем сильнее ветер, тем сильнее анизотропия
                    wind_power = min(wind_speed / 10.0, 1.0)
                    directional = 1.0 * (1.0 - wind_power) + directional * wind_power
                else:
                    directional = 1.0  # штиль или зелёная зона — равномерно

                contribution = em_abs * distance_decay * directional
                if is_absorber:
                    total_intensity -= contribution
                else:
                    total_intensity += contribution

            # Инверсия + осадки + трафик + шум
            total_intensity *= inversion_mult

            # Осадки: дождь вымывает, снег частично
            weather_type = params.weather.weather_type
            if weather_type == "rain":
                total_intensity *= 0.4
            elif weather_type == "snow":
                total_intensity *= 0.6

            # Глобальный фон трафика
            traffic_add = (params.traffic_level / 100.0) * 0.1
            total_intensity += traffic_add

            total_intensity += random.uniform(-0.03, 0.03)
            total_intensity = min(max(total_intensity, 0.0), 1.0)

            points.append(HeatmapPoint(
                lat=round(p_lat, 6),
                lng=round(p_lng, 6),
                intensity=round(total_intensity, 4),
            ))
            intensity_sum += total_intensity

    # --- AQI (0-500) -------------------------------------------------------
    avg_intensity = intensity_sum / len(points) if points else 0
    aqi = int(avg_intensity * 500)
    aqi = min(max(aqi, 0), 500)


    # --- Агрегация параметров для AI Advisor / ML Predictor -----------------
    tec_statuses = [
        params.city_state.get("tec_1", "coal_full"),
        params.city_state.get("tec_2_west", "disabled"),
    ]
    tec_map = {
        "coal_full": 100, "coal_reduced": 55, "filters_installed": 50,
        "gas_converted": 15, "off": 0, "disabled": 0,
    }
    tec_power_pct = sum(tec_map.get(s, 100) for s in tec_statuses) / len(tec_statuses)

    traffic_statuses = [
        params.city_state.get("traffic_osh_bazaar", "moderate"),
        params.city_state.get("traffic_east_terminal", "moderate"),
        params.city_state.get("traffic_south_highway", "moderate"),
        params.city_state.get("traffic_chui", "moderate"),
        params.city_state.get("traffic_manas", "moderate"),
    ]
    traffic_map = {
        "congested": 90, "moderate": 50, "normal": 50,
        "free_flow": 20, "low": 20, "closed": 0,
    }
    traffic_level_pct = sum(traffic_map.get(s, 50) for s in traffic_statuses) / len(traffic_statuses)

    heating_objects = [
        "private_sector_north", "private_sector_south", "private_sector_east",
        "private_sector_west", "novostroyka_ak_orgo", "novostroyka_kelechek", "asanbai",
    ]
    coal_active = any(params.city_state.get(obj) == "coal_heating" for obj in heating_objects)
    heating_ban = not coal_active

    # --- AQI уровень (для fallback текста) ---------------------------------
    if aqi <= 50:
        level = "Хорошее"
    elif aqi <= 100:
        level = "Умеренное"
    elif aqi <= 150:
        level = "Нездоровое для чувствительных групп"
    elif aqi <= 200:
        level = "Нездоровое"
    elif aqi <= 300:
        level = "Очень нездоровое"
    else:
        level = "Опасное"

    # --- Текстовый совет от AI (OpenRouter) --------------------------------
    try:
        import sys
        import os
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if root_dir not in sys.path:
            sys.path.append(root_dir)
        from ai.ai_advisor import get_mayor_advice
        ai_text = await get_mayor_advice(
            avg_pollution=aqi,
            tec_power=tec_power_pct,
            traffic=traffic_level_pct,
            heating_ban=heating_ban,
            wind_speed=wind_speed,
        )
    except Exception as e:
        logging.warning("AI Advisor unavailable, using fallback: %s", e)
        # Fallback — статический отчёт
        polluters = [s for s in sources if s["emission"] > 0.01]
        absorbers = [s for s in sources if s["emission"] < -0.01]
        weather_type = params.weather.weather_type
        weather_note = f"Температура {temperature}°C. " if params.use_real_weather else ""
        inversion_note = "⚠️ Температурная инверсия усиливает загрязнение! " if temperature < 0 else ""
        precip_note = ""
        if weather_type == "rain":
            precip_note = "🌧 Дождь вымывает загрязнения. "
        elif weather_type == "snow":
            precip_note = "❄️ Снег частично очищает воздух. "

        ai_text = (
            f"AQI: {aqi} — качество воздуха: {level}. "
            f"Активных источников: {len(polluters)}, зелёных зон: {len(absorbers)}. "
            f"{weather_note}"
            f"{inversion_note}"
            f"{precip_note}"
            f"Ветер {wind_speed} м/с, направление {wind_direction}° "
            f"(шлейф → {plume_dir_deg:.0f}°)."
        ).strip()

    # --- Предикт от ML Модели (AQI через 12ч) ------------------------------
    prediction: int | None = None
    try:
        from ai.smog_predictor import predict_future_aqi
        raw = predict_future_aqi(
            current_aqi=aqi,
            tec_power=tec_power_pct / 100.0,
            traffic=traffic_level_pct / 100.0,
            heating_ban=heating_ban,
            wind_speed=wind_speed,
        )
        if raw is not None:
            prediction = int(round(raw))
    except Exception as e:
        logging.warning("ML Predictor unavailable: %s", e)

    return points, aqi, ai_text, prediction
