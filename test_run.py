import sys
import io

if sys.platform.startswith("win"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'back'))

from simulator import generate_heatmap_data
from ai.ai_advisor import get_mayor_advice


# Эмулируем данные от Яны (с фронтенда)
payload = {
    "tec_power": 0.8,         # ТЭЦ на 80%
    "traffic": 0.9,           # Пробки 9 баллов
    "heating_ban": False,     # Уголь разрешен
    "wind_speed": 2.0,        # Слабый ветер
    "wind_dir_deg": 45
}

import asyncio

async def main():
    print("=== ЗАПУСК СИМУЛЯЦИИ ===")
    # 1. Считаем сетку
    grid_data, avg_poll = generate_heatmap_data(**payload)
    print(f"Сгенерировано точек на карте: {len(grid_data)}")
    print(f"Средний уровень смога (AQI): {avg_poll}")
    print(f"Пример первой точки: {grid_data[0]}")

    print("\n=== ЗАПРОС К AI СОВЕТНИКУ ===")
    # 2. Генерируем умный совет
    advice = await get_mayor_advice(
        avg_pollution=avg_poll,
        tec_power=payload["tec_power"],
        traffic=payload["traffic"],
        heating_ban=payload["heating_ban"],
        wind_speed=payload["wind_speed"]
    )

    from ai.smog_predictor import predict_future_aqi
    prediction = predict_future_aqi(
        current_aqi=avg_poll,
        tec_power=payload["tec_power"],
        traffic=payload["traffic"],
        heating_ban=payload["heating_ban"],
        wind_speed=payload["wind_speed"]
    )
    if prediction is not None:
        print(f"\n🔮 Прогноз ML Модели: Через 12 часов AQI будет около {prediction:.1f}")
    else:
        print("\n🔮 Прогноз ML Модели: Недоступен (модель не загружена).")

    print(f"\nСовет мэру:\n{advice}")

if __name__ == "__main__":
    asyncio.run(main())
