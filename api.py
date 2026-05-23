from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from simulator import generate_heatmap_data
from ai_advisor import get_mayor_advice

app = FastAPI()

# Модель того, что мы ждем от Санжара/Яны
class SimulationRequest(BaseModel):
    tec_power: float
    traffic: float
    heating_ban: bool
    wind_speed: float
    wind_dir_deg: int

@app.post("/api/simulate")
def simulate(req: SimulationRequest):
    # 1. Генерируем точки карты
    grid_data, avg_poll = generate_heatmap_data(
        tec_power=req.tec_power,
        traffic=req.traffic,
        heating_ban=req.heating_ban,
        wind_speed=req.wind_speed,
        wind_dir_deg=req.wind_dir_deg
    )
    
    # 2. Генерируем совет мэру от LLM
    advice = get_mayor_advice(
        avg_pollution=avg_poll,
        tec_power=req.tec_power,
        traffic=req.traffic,
        heating_ban=req.heating_ban,
        wind_speed=req.wind_speed
    )
    
    # 3. Отдаем красивый JSON
    return {
        "average_aqi": avg_poll,
        "ai_advice": advice,
        "heatmap": grid_data
    }

if __name__ == "__main__":
    print("🚀 AI Микросервис запущен на http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
