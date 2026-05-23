from pydantic import BaseModel, Field
from typing import Dict, Optional


class WeatherConditions(BaseModel):
    wind_direction: int = Field(default=0, description="Направление ветра (градусы)")
    wind_speed: float = Field(default=2.0, description="Скорость ветра (м/с)")
    temperature: float = Field(default=5.0, description="Температура (°C)")


class SimulationParams(BaseModel):
    active_mode: Optional[str] = "edit"
    modified_object: Optional[Dict[str, str]] = None
    city_state: Dict[str, str] = Field(
        default_factory=lambda: {
            "tec_1": "coal_full",
            "private_sector_north": "coal_heating",
            "private_sector_south": "coal_heating",
            "traffic_osh_bazaar": "congested",
            "botanical_garden": "active",
        },
        description='Состояния объектов, напр. {"tec_1": "gas_converted"}',
    )
    weather: WeatherConditions = Field(default_factory=WeatherConditions)
    use_real_weather: bool = False


class HeatmapPoint(BaseModel):
    lat: float = Field(description="Широта")
    lng: float = Field(description="Долгота")
    intensity: float = Field(ge=0, le=1, description="Интенсивность (0-1)")


class SimulationResponse(BaseModel):
    status: str = Field(default="ok", description="Статус симуляции")
    aqi: int = Field(default=0, ge=0, description="Air Quality Index")
    heatmap_data: list[HeatmapPoint] = Field(default_factory=list, description="Точки тепловой карты")
    ai_insight: str = Field(default="", description="Рекомендация от AI")
