import math
import random

from schemas import SimulationParams, HeatmapPoint
from weather_service import get_current_bishkek_weather

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
            "filters_installed": 0.5,
            "gas_converted": 0.1,
            "disabled": 0.0,
        },
    },
    "tec_2_west": {
        "lat": 42.870, "lng": 74.540,
        "statuses": {
            "coal_full": 0.7,
            "filters_installed": 0.35,
            "gas_converted": 0.08,
            "disabled": 0.0,
        },
    },
    # --- Угольный частный сектор ---
    "private_sector_north": {
        "lat": 42.890, "lng": 74.580,
        "statuses": {
            "coal_heating": 0.7,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "disabled": 0.0,
        },
    },
    "private_sector_south": {
        "lat": 42.820, "lng": 74.580,
        "statuses": {
            "coal_heating": 0.8,
            "gas_heating": 0.1,
            "electric_heating": 0.02,
            "disabled": 0.0,
        },
    },
    "private_sector_east": {
        "lat": 42.850, "lng": 74.650,
        "statuses": {
            "coal_heating": 0.6,
            "gas_heating": 0.1,
            "disabled": 0.0,
        },
    },
    # --- Трафик-хабы ---
    "traffic_osh_bazaar": {
        "lat": 42.875, "lng": 74.588,
        "statuses": {
            "congested": 0.9,
            "normal": 0.4,
            "low": 0.15,
            "pedestrian_zone": 0.0,
        },
    },
    "traffic_east_terminal": {
        "lat": 42.868, "lng": 74.605,
        "statuses": {
            "congested": 0.8,
            "normal": 0.35,
            "low": 0.1,
            "pedestrian_zone": 0.0,
        },
    },
    "traffic_south_highway": {
        "lat": 42.830, "lng": 74.610,
        "statuses": {
            "congested": 0.7,
            "normal": 0.3,
            "low": 0.1,
            "closed": 0.0,
        },
    },
    # --- Новостройки ---
    "novostroyka_ak_orgo": {
        "lat": 42.900, "lng": 74.560,
        "statuses": {
            "coal_heating": 0.65,
            "gas_heating": 0.1,
            "disabled": 0.0,
        },
    },
    "novostroyka_kelechek": {
        "lat": 42.840, "lng": 74.640,
        "statuses": {
            "coal_heating": 0.55,
            "gas_heating": 0.1,
            "disabled": 0.0,
        },
    },
    # --- Зелёные зоны (поглощение) ---
    "botanical_garden": {
        "lat": 42.840, "lng": 74.600,
        "statuses": {
            "active": -0.3,
            "destroyed": 0.1,
        },
    },
    "oak_park": {
        "lat": 42.874, "lng": 74.604,
        "statuses": {
            "active": -0.15,
            "destroyed": 0.05,
        },
    },
    "panfilov_park": {
        "lat": 42.877, "lng": 74.598,
        "statuses": {"active": -0.2, "destroyed": 0.0}
    },
    "ataturk_park": {
        "lat": 42.842, "lng": 74.588,
        "statuses": {"active": -0.2, "destroyed": 0.0}
    },
    "karagachevaya_grove": {
        "lat": 42.898, "lng": 74.615,
        "statuses": {"active": -0.5, "destroyed": 0.1} # Самый мощный "очиститель" на севере
    },
    "korea_friendship_park": {
        "lat": 42.844, "lng": 74.586,  # Примерные координаты на Ахунбаева
        "statuses": {
            "active": -0.1, 
            "destroyed": 0.05
        }
    },
    "togolok_moldo_square": {
        "lat": 42.872, "lng": 74.594,  # Центр
        "statuses": {
            "active": -0.05,  # Очень слабое поглощение, так как он маленький
            "destroyed": 0.02
        }
    }
}


# ---------------------------------------------------------------------------
# Основная функция
# ---------------------------------------------------------------------------
async def generate_mock_heatmap(
    params: SimulationParams,
) -> tuple[list[HeatmapPoint], int, str]:
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
            continue
        base_emission = registry_entry["statuses"].get(status, 0.0)
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

            # Инверсия + шум
            total_intensity *= inversion_mult
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

    # Рассчитываем агрегированные параметры для AI Advisor из city_state
    tec_statuses = [params.city_state.get("tec_1", "coal_full"), params.city_state.get("tec_2_west", "disabled")]
    tec_map = {"coal_full": 100, "filters_installed": 50, "gas_converted": 10, "disabled": 0}
    tec_power_pct = sum(tec_map.get(s, 100) for s in tec_statuses) / len(tec_statuses)

    traffic_statuses = [
        params.city_state.get("traffic_osh_bazaar", "normal"),
        params.city_state.get("traffic_east_terminal", "normal"),
        params.city_state.get("traffic_south_highway", "normal")
    ]
    traffic_map = {"congested": 90, "normal": 50, "low": 20, "closed": 0, "pedestrian_zone": 0}
    traffic_level_pct = sum(traffic_map.get(s, 50) for s in traffic_statuses) / len(traffic_statuses)

    heating_objects = ["private_sector_north", "private_sector_south", "private_sector_east", "novostroyka_ak_orgo", "novostroyka_kelechek"]
    coal_active = any(params.city_state.get(obj) == "coal_heating" for obj in heating_objects)
    heating_ban = not coal_active

    # --- Текстовый совет от AI (OpenRouter) ---
    try:
        from ai.ai_advisor import get_mayor_advice
        ai_text = await get_mayor_advice(
            avg_pollution=aqi,
            tec_power=tec_power_pct,
            traffic=traffic_level_pct,
            heating_ban=heating_ban,
            wind_speed=wind_speed
        )
    except Exception as e:
        print(f"Ошибка вызова AI Advisor, используется заглушка: {e}")
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

        # Подсчёт активных загрязнителей / поглотителей
        polluters = [s for s in sources if s["emission"] > 0.01]
        absorbers = [s for s in sources if s["emission"] < -0.01]
        weather_note = f"Температура {temperature}°C. " if params.use_real_weather else ""
        inversion_note = "⚠️ Температурная инверсия усиливает загрязнение! " if temperature < 0 else ""

        ai_text = (
            f"AQI: {aqi} — качество воздуха: {level}. "
            f"Активных источников: {len(polluters)}, зелёных зон: {len(absorbers)}. "
            f"{weather_note}"
            f"{inversion_note}"
            f"Ветер {wind_speed} м/с, направление {wind_direction}° "
            f"(шлейф → {plume_dir_deg:.0f}°)."
        ).strip()

    # --- Предикт от ML Модели ---
    try:
        from ai.smog_predictor import predict_future_aqi
        prediction = predict_future_aqi(
            current_aqi=aqi,
            tec_power=tec_power_pct / 100.0 if tec_power_pct > 1 else tec_power_pct,
            traffic=traffic_level_pct / 100.0 if traffic_level_pct > 1 else traffic_level_pct,
            heating_ban=heating_ban,
            wind_speed=wind_speed
        )
    except Exception as e:
        print(f"Ошибка вызова ML Predictor: {e}")
        prediction = None

    return points, aqi, ai_text, prediction
