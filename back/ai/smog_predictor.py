import os
import joblib
import pandas as pd
from datetime import datetime

script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "smog_model.pkl")

# Загружаем модель один раз при старте
try:
    model = joblib.load(model_path)
    print("Smog Predictor: OK — ML модель загружена.")
except Exception as e:
    model = None
    print(f"Smog Predictor: ВНИМАНИЕ! Ошибка загрузки модели ({e}). Предикт будет недоступен.")

def predict_future_aqi(current_aqi, tec_power, traffic, heating_ban, wind_speed):
    if model is None:
        return None
        
    now = datetime.now()
    
    # Подготавливаем фичи так же, как при обучении:
    # ['hour', 'month', 'traffic', 'heating_ban', 'tec_power', 'wind_speed', 'pm25']
    features = pd.DataFrame([{
        'hour': now.hour,
        'month': now.month,
        'traffic': traffic,
        'heating_ban': heating_ban,
        'tec_power': tec_power,
        'wind_speed': wind_speed,
        'pm25': current_aqi
    }])
    
    try:
        prediction = model.predict(features)[0]
        # Не даем прогнозу уйти в минуса или космические значения
        return float(max(5.0, min(500.0, prediction)))
    except Exception as e:
        print(f"Ошибка предсказания: {e}")
        return None
