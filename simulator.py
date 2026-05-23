import math
import random

# Координаты Бишкека для сетки
BISHKEK_CENTER = {"lat": 42.8746, "lon": 74.5827}
TEC_COORDS = {"lat": 42.8732, "lon": 74.6500} # ТЭЦ (Восток)
PRIVATE_SECTOR_COORDS = {"lat": 42.8400, "lon": 74.5800} # Жилмассивы (Юг/Юго-Запад)

def calculate_distance(lat1, lon1, lat2, lon2):
    # Примитивный расчет расстояния (для хакатона сойдет)
    return math.sqrt((lat1 - lat2)**2 + (lon1 - lon2)**2)

def generate_heatmap_data(tec_power, traffic, heating_ban, wind_speed, wind_dir_deg):
    """
    tec_power: 0.0 - 1.0 (отключена - на полную)
    traffic: 0.0 - 1.0 (пусто - 10 баллов)
    heating_ban: boolean (True - запрет на уголь)
    wind_speed: 0 - 20 м/с
    wind_dir_deg: 0 - 360 градусов (откуда дует)
    """
    grid = []
    # Генерируем сетку 10x10 вокруг центра Бишкека
    step = 0.01
    start_lat = BISHKEK_CENTER["lat"] - (step * 5)
    start_lon = BISHKEK_CENTER["lon"] - (step * 5)

    total_pollution = 0

    for i in range(10):
        for j in range(10):
            cell_lat = start_lat + (i * step)
            cell_lon = start_lon + (j * step)
            
            # 1. Влияние ТЭЦ (базовое + ветер)
            dist_to_tec = calculate_distance(cell_lat, cell_lon, TEC_COORDS["lat"], TEC_COORDS["lon"])
            tec_impact = (1.0 / (dist_to_tec + 0.01)) * tec_power * 0.001
            
            # 2. Влияние трафика (равномерно, но в центре гуще)
            dist_to_center = calculate_distance(cell_lat, cell_lon, BISHKEK_CENTER["lat"], BISHKEK_CENTER["lon"])
            traffic_impact = (1.0 / (dist_to_center + 0.02)) * traffic * 0.005
            
            # 3. Влияние частного сектора (уголь)
            heating_impact = 0
            if not heating_ban:
                dist_to_private = calculate_distance(cell_lat, cell_lon, PRIVATE_SECTOR_COORDS["lat"], PRIVATE_SECTOR_COORDS["lon"])
                heating_impact = (1.0 / (dist_to_private + 0.01)) * 0.002
            
            # 4. Влияние ветра (очень упрощенно: сдувает смог)
            # Чем сильнее ветер, тем меньше локальный смог, но он переносится
            wind_modifier = 1.0 - (wind_speed * 0.03)
            if wind_modifier < 0.2: wind_modifier = 0.2

            # Итоговый скор для квадрата (0 - 100)
            cell_pollution = (tec_impact + traffic_impact + heating_impact) * wind_modifier * 1000
            cell_pollution += random.uniform(-5, 5) # немного шума для реалистичности
            
            # Нормализация
            cell_pollution = max(0, min(100, cell_pollution))
            total_pollution += cell_pollution

            grid.append({
                "lat": round(cell_lat, 4),
                "lon": round(cell_lon, 4),
                "pollution_index": round(cell_pollution, 1)
            })
            
    avg_pollution = total_pollution / 100
    return grid, round(avg_pollution, 1)
