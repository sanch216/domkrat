import os
import json
from openai import AsyncOpenAI

try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except ImportError:
    pass

api_key = os.getenv("OPENROUTER_API_KEY")

if api_key:
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )
else:
    client = None
    print("ВНИМАНИЕ: Нет OPENROUTER_API_KEY для TG бота.")

MODEL_NAME = "deepseek/deepseek-v4-flash"

SYSTEM_PROMPT = """
Ты — AI-ассистент техподдержки интерактивного симулятора смога города Бишкек ("Домкрат").
Твоя задача — помогать пользователям разобраться в функционале симулятора.

Функционал симулятора:
- На дашборде есть карта Бишкека (тепловая карта), показывающая уровень смога (AQI).
- Пользователь может переключать слои карты.
- Пользователь может кликать по объектам (например, ТЭЦ, жилмассивы, трафик) и изменять их статус (например, перевести ТЭЦ с угля на газ, ограничить трафик или запретить угольное отопление в жилмассивах).
- Симулятор учитывает погоду: температуру, скорость и направление ветра.
- Справа находится панель аналитики, где выводится общий уровень AQI, прогноз AQI от ML-модели на 12 часов вперед, а также текстовые советы мэру от AI.
- Приложение нужно для проверки гипотез по снижению уровня смога.

Правила:
1. Отвечай вежливо, кратко и по существу на вопросы о том, как пользоваться симулятором.
2. Если вопрос выходит за рамки функционала симулятора, не относится к теме, или пользователь явно просит позвать менеджера, человека, оператора или говорит о том, что у него "что-то не работает/зависло" — ты ДОЛЖЕН ответить только одной точной фразой: CALL_MANAGER. Ничего больше не добавляй.
3. Отвечай на русском языке.
"""

async def get_ai_support_reply(user_message: str) -> str:
    if not client:
        return "В данный момент AI-анализ недоступен (не настроен ключ API)."

    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            extra_body={"reasoning": {"enabled": True}}
        )
        text = response.choices[0].message.content
        return text.strip() if text else "Не удалось получить ответ от ИИ."
    except Exception as e:
        print(f"Ошибка AI: {e}")
        return "Произошла ошибка при обращении к ИИ."
