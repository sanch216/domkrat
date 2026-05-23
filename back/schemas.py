from pydantic import BaseModel, Field


class SimulationParams(BaseModel):
    tec_power: float = Field(default=50.0, ge=0, le=100, description="Мощность ТЭЦ (%)")
    traffic_level: float = Field(default=50.0, ge=0, le=100, description="Уровень трафика (%)")
    coal_heating: bool = Field(default=True, description="Угольное отопление вкл/выкл")
    wind_direction: float = Field(default=0.0, ge=0, lt=360, description="Направление ветра (градусы)")
    wind_speed: float = Field(default=2.0, ge=0, le=50, description="Скорость ветра (м/с)")


class HeatmapPoint(BaseModel):
    lat: float = Field(description="Широта")
    lng: float = Field(description="Долгота")
    intensity: float = Field(ge=0, le=1, description="Интенсивность (0-1)")


class SimulationResponse(BaseModel):
    status: str = Field(default="ok", description="Статус симуляции")
    aqi: int = Field(default=0, ge=0, description="Air Quality Index")
    heatmap_data: list[HeatmapPoint] = Field(default_factory=list, description="Точки тепловой карты")
    ai_insight: str = Field(default="", description="Рекомендация от AI")
