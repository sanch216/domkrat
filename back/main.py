from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import SimulationParams, SimulationResponse
from state_manager import save_state
from smog_engine import generate_mock_heatmap

app = FastAPI(
    title="Bishkek Smog Simulation",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/v1/simulate", response_model=SimulationResponse)
async def simulate(params: SimulationParams) -> SimulationResponse:
    """Принимает параметры симуляции, сохраняет состояние и возвращает результат."""
    await save_state(params)
    heatmap_data, aqi, ai_text = await generate_mock_heatmap(params)
    return SimulationResponse(
        status="ok",
        aqi=aqi,
        heatmap_data=heatmap_data,
        ai_insight=ai_text,
    )
