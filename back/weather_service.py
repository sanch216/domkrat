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


async def get_wind_history(days: int = 7) -> list[dict]:
    """Запрашивает историю ветра за последние N дней (hourly) из Open-Meteo.

    Возвращает список {"speed": float, "direction": int} за каждый час.
    """
    from datetime import date, timedelta

    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude=42.87&longitude=74.59"
        f"&hourly=wind_speed_10m,wind_direction_10m"
        f"&start_date={start_date.isoformat()}"
        f"&end_date={end_date.isoformat()}"
        f"&timezone=Asia%2FBishkek"
    )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        hourly = data.get("hourly", {})
        speeds = hourly.get("wind_speed_10m", [])
        directions = hourly.get("wind_direction_10m", [])

        result = []
        for i in range(min(len(speeds), len(directions))):
            if speeds[i] is not None and directions[i] is not None:
                result.append({
                    "speed": float(speeds[i]),
                    "direction": int(directions[i]),
                })
        return result
    except Exception as e:
        logging.error("Open-Meteo wind history failed: %s", e)
        return []

