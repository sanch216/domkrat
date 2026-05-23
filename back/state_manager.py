import json
from pathlib import Path

import aiofiles

from schemas import SimulationParams

STATE_FILE = Path(__file__).parent / "current_state.json"


async def save_state(params: SimulationParams) -> None:
    """Сохраняет текущие параметры симуляции в current_state.json."""
    async with aiofiles.open(STATE_FILE, mode="w", encoding="utf-8") as f:
        await f.write(params.model_dump_json(indent=2))


async def load_state() -> SimulationParams | None:
    """Читает текущие параметры из current_state.json. Возвращает None, если файл не найден."""
    if not STATE_FILE.exists():
        return None
    async with aiofiles.open(STATE_FILE, mode="r", encoding="utf-8") as f:
        raw = await f.read()
    data = json.loads(raw)
    return SimulationParams(**data)
