import os
import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import Message

# Импортируем нашу функцию для связи с ИИ
from ai_support import get_ai_support_reply

try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
except ImportError:
    pass

BOT_TOKEN = os.getenv("TG_BOT_TOKEN")
MANAGER_USERNAME = "@support_citybreaz"

logging.basicConfig(level=logging.INFO)

if not BOT_TOKEN:
    print("ВНИМАНИЕ: Нет TG_BOT_TOKEN в .env. Бот не сможет запуститься.")
    exit(1)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(
        "👋 Привет! Я AI-помощник интерактивного дашборда Бишкека.\n"
        "Спроси меня, как пользоваться симулятором смога, и я постараюсь помочь!"
    )

@dp.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "Я могу рассказать, как работает дашборд, как изменять параметры (ТЭЦ, трафик, отопление) и где посмотреть прогноз.\n"
        "Если у тебя проблема, с которой я не справлюсь, я перенаправлю тебя к живому менеджеру."
    )

@dp.message()
async def handle_message(message: Message):
    user_text = message.text
    
    # Отправляем сообщение пользователя в ИИ
    ai_reply = await get_ai_support_reply(user_text)
    
    # Обрабатываем кодовую фразу
    if "CALL_MANAGER" in ai_reply:
        await message.answer(
            f"Кажется, этот вопрос лучше решить со специалистом или у вас возникла техническая проблема.\n"
            f"Пожалуйста, обратитесь к нашему менеджеру: {MANAGER_USERNAME}"
        )
    else:
        # Отправляем ответ ИИ
        await message.answer(ai_reply)

async def main():
    print("Бот успешно запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
