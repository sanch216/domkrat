import os
from openai import AsyncOpenAI

try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Инициализация клиента OpenRouter
# ---------------------------------------------------------------------------

api_key = os.getenv("OPENROUTER_API_KEY")

client = None
if api_key:
    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )
    print("AI Advisor: OK — OpenRouter клиент инициализирован.")
else:
    print("AI Advisor: ВНИМАНИЕ! Нет OPENROUTER_API_KEY в .env")

MODEL_NAME = "baidu/cobuddy:free"


async def get_mayor_advice(avg_pollution, tec_power, traffic, heating_ban, wind_speed):
    tec_pct = tec_power if tec_power > 1.0 else tec_power * 100
    traffic_pct = traffic if traffic > 1.0 else traffic * 100

    prompt = f"""
Ситуация в Бишкеке:
- AQI: {avg_pollution} из 500
- Мощность ТЭЦ: {tec_pct:.0f}%
- Трафик: {traffic_pct:.0f}%
- Уголь в жилмассивах: {'запрещён' if heating_ban else 'разрешён'}
- Ветер: {wind_speed} м/с

Ты — AI-советник мэра Бишкека по экологии. Дай 2-3 коротких практических совета на русском языке.
Если AQI < 100 — похвали за хорошую стратегию. Пиши лаконично, под UI-карточку на дашборде.
"""

    if not client:
        return _fallback(avg_pollution, tec_pct, traffic_pct)

    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.choices[0].message.content
        return text.strip() if text else _fallback(avg_pollution, tec_pct, traffic_pct)
    except Exception as e:
        print(f"AI Advisor: Ошибка API: {e}")
        return _fallback(avg_pollution, tec_pct, traffic_pct)


def _fallback(avg_pollution, tec_pct, traffic_pct):
    if avg_pollution > 150:
        return (
            "⚠️ Критическое загрязнение!\n"
            "1. Снизить мощность ТЭЦ на 20%.\n"
            "2. Ограничить грузовой транспорт в центре.\n"
            "3. Усилить контроль угольного отопления."
        )
    elif avg_pollution > 50:
        return (
            "🔔 Умеренное загрязнение. Рекомендации:\n"
            f"1. При трафике {traffic_pct:.0f}% — временные пешеходные зоны.\n"
            "2. Газификация новостроек вместо угля.\n"
            "3. Озеленение буферных зон вокруг ТЭЦ."
        )
    else:
        return (
            "✅ Воздух чистый! Стратегия эффективна.\n"
            "Продолжайте мониторинг и развивайте велоинфраструктуру."
        )


SYSTEM_PROMPT = (
    "Ты — AI-советник по качеству воздуха в Бишкеке. "
    "Отвечай на русском языке, коротко и по существу. "
    "Ты знаешь про ТЭЦ Бишкека (крупнейший загрязнитель на угле), "
    "угольное отопление в частном секторе, автомобильный трафик, "
    "температурную инверсию зимой и влияние ветра. "
    "Если спрашивают о конкретных мерах — давай практичные советы."
)


async def chat_with_advisor(user_message: str) -> str:
    """Свободный чат с AI-советником по экологии Бишкека."""
    if not client:
        return _chat_fallback(user_message)

    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
        )
        text = response.choices[0].message.content
        return text.strip() if text else _chat_fallback(user_message)
    except Exception as e:
        print(f"AI Chat: Ошибка API: {e}")
        return _chat_fallback(user_message)


def _chat_fallback(question: str) -> str:
    t = question.lower()
    if "тэц" in t or "тепло" in t:
        return "ТЭЦ Бишкек — крупнейший источник выбросов. На угле даёт до 40% AQI. Перевод на газ снизит выбросы на 60-70%."
    if "трафик" in t or "проб" in t or "машин" in t:
        return "Автотранспорт составляет около 35% загрязнения. Развитие электротранспорта и BRT-линий снизит AQI на 30-50 пунктов."
    if "вет" in t or "погод" in t:
        return "Ветер — главный природный регулятор. При скорости более 5 м/с смог рассеивается. Зимой температурная инверсия блокирует рассеивание."
    if "угол" in t or "отоп" in t:
        return "Угольное отопление даёт до 20% AQI зимой. Перевод частного сектора на газ или электричество кардинально улучшит ситуацию."
    return "Качество воздуха зависит от ТЭЦ, трафика, отопления и метеоусловий. Задайте конкретный вопрос о любом факторе."

