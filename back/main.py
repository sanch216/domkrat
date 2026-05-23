import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from schemas import SimulationParams, SimulationResponse
from state_manager import save_state
from smog_engine import generate_mock_heatmap

app = FastAPI(
    title="Bishkek Smog Simulation",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# WebSocket Connection Manager (Broadcast)
# ---------------------------------------------------------------------------
class ConnectionManager:
    """Управляет активными WebSocket-соединениями и рассылает обновления всем."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        """Отправляет JSON всем подключённым клиентам."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass  # мёртвое соединение — уберётся при disconnect


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# HTTP endpoint (одиночный запрос)
# ---------------------------------------------------------------------------
@app.post("/api/v1/simulate", response_model=SimulationResponse)
async def simulate(params: SimulationParams) -> SimulationResponse:
    """Принимает параметры симуляции, сохраняет состояние и возвращает результат."""
    await save_state(params)
    heatmap_data, aqi, ai_text, prediction = await generate_mock_heatmap(params)
    return SimulationResponse(
        status="ok",
        aqi=aqi,
        heatmap_data=heatmap_data,
        ai_insight=ai_text,
        predicted_aqi=prediction,
    )

# ---------------------------------------------------------------------------
# Chat endpoint (AI Advisor)
# ---------------------------------------------------------------------------
@app.post("/api/v1/chat")
async def chat(body: dict) -> dict:
    """Свободный чат с AI-советником по экологии Бишкека."""
    user_message = body.get("message", "")
    if not user_message.strip():
        return {"reply": "Задайте вопрос о качестве воздуха в Бишкеке."}
    try:
        import sys, os
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if root_dir not in sys.path:
            sys.path.append(root_dir)
        from ai.ai_advisor import chat_with_advisor
        reply = await chat_with_advisor(user_message)
    except Exception as e:
        reply = f"Ошибка AI: {e}"
    return {"reply": reply}


# ---------------------------------------------------------------------------
@app.websocket("/api/v1/ws/simulate")
async def ws_simulate(websocket: WebSocket) -> None:
    """WebSocket для интерактивной симуляции в реальном времени.

    - Broadcast: результат рассылается ВСЕМ подключённым клиентам.
    - Throttling: не чаще 1 расчёта в 100 мс от одного клиента (10 FPS).
    """
    await manager.connect(websocket)
    last_calc_time = 0.0

    try:
        while True:
            data = await websocket.receive_text()

            # --- Throttling: макс. 10 расчётов/сек от одного клиента ---
            current_time = time.time()
            if current_time - last_calc_time < 0.1:
                continue
            last_calc_time = current_time

            # --- Расчёт ---
            params = SimulationParams.model_validate_json(data)
            await save_state(params)
            points, aqi, ai_text, prediction = await generate_mock_heatmap(params)
            response = SimulationResponse(
                status="ok",
                aqi=aqi,
                heatmap_data=points,
                ai_insight=ai_text,
                predicted_aqi=prediction,
            )

            # --- Broadcast всем подключённым клиентам ---
            await manager.broadcast(response.model_dump())

    except WebSocketDisconnect:
        manager.disconnect(websocket)
