import logging

import httpx

OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=42.87&longitude=74.59&current_weather=true"
)

DEFAULTS = {
    "temperature": 0.0,
    "wind_speed": 0.0,
    "wind_direction": 0,
}


async def get_current_bishkek_weather() -> dict:
    """Запрашивает текущую погоду в Бишкеке через Open-Meteo (без ключей).

    Возвращает:
        {"temperature": float, "wind_speed": float, "wind_direction": int}
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(OPEN_METEO_URL)
            resp.raise_for_status()
            data = resp.json()

        cw = data["current_weather"]
        return {
            "temperature": float(cw["temperature"]),
            "wind_speed": float(cw["windspeed"]),
            "wind_direction": int(cw["winddirection"]),
        }
    except Exception as e:
        logging.error("Open-Meteo API failed: %s. Falling back to default weather (calm).", e)
        return DEFAULTS.copy()
