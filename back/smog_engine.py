import random

from schemas import SimulationParams, HeatmapPoint

# Центр Бишкека
CENTER_LAT = 42.87
CENTER_LNG = 74.59
SPREAD = 0.05
NUM_POINTS = 150


async def generate_mock_heatmap(
    params: SimulationParams,
) -> tuple[list[HeatmapPoint], int, str]:
    """Генерирует тепловую карту смога, AQI и текстовый отчёт."""

    # --- base_intensity (0.0 – 1.0) ---
    base_intensity = (params.tec_power / 100) * 0.4 + (params.traffic_level / 100) * 0.35
    if params.coal_heating:
        base_intensity += 0.2

    # Ветер сдувает — чем сильнее, тем чище
    wind_factor = max(0.0, 1.0 - params.wind_speed / 50)
    base_intensity *= wind_factor

    base_intensity = min(max(base_intensity, 0.0), 1.0)

    # --- Генерация точек ---
    points: list[HeatmapPoint] = []
    for _ in range(NUM_POINTS):
        lat = CENTER_LAT + random.uniform(-SPREAD, SPREAD)
        lng = CENTER_LNG + random.uniform(-SPREAD, SPREAD)
        noise = random.uniform(-0.15, 0.15)
        intensity = min(max(base_intensity + noise, 0.0), 1.0)
        points.append(HeatmapPoint(lat=round(lat, 6), lng=round(lng, 6), intensity=round(intensity, 4)))

    # --- AQI (0 – 500) ---
    aqi = int(base_intensity * 500)
    aqi = min(max(aqi, 0), 500)

    # --- Текстовый отчёт-заглушка ---
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

    coal_note = "Угольное отопление активно — значительный вклад в загрязнение." if params.coal_heating else ""
    ai_text = (
        f"AQI: {aqi} — качество воздуха: {level}. "
        f"ТЭЦ работает на {params.tec_power:.0f}%, трафик {params.traffic_level:.0f}%. "
        f"{coal_note} "
        f"Ветер {params.wind_speed} м/с, направление {params.wind_direction}°."
    ).strip()

    return points, aqi, ai_text
