import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_dataset(days=180):
    print(f"Генерируем синтетический датасет за {days} дней (симуляция Бишкека)...")
    
    # Создаем временной ряд (каждый час)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    dates = pd.date_range(start=start_date, end=end_date, freq='h')
    df = pd.DataFrame({'datetime': dates})
    
    # Извлекаем час и месяц
    df['hour'] = df['datetime'].dt.hour
    df['month'] = df['datetime'].dt.month
    
    # Трафик: пики в 8-10 утра и 17-20 вечера
    def simulate_traffic(h):
        if 8 <= h <= 10 or 17 <= h <= 20:
            return np.clip(np.random.normal(0.9, 0.1), 0.5, 1.0)
        elif 1 <= h <= 5:
            return np.clip(np.random.normal(0.1, 0.05), 0.0, 0.3)
        else:
            return np.clip(np.random.normal(0.5, 0.15), 0.2, 0.8)
            
    df['traffic'] = df['hour'].apply(simulate_traffic)
    
    # ТЭЦ и Уголь: зависят от сезона (зима = ноябрь - март)
    def is_winter(m): return m in [11, 12, 1, 2, 3]
    
    df['heating_ban'] = df['month'].apply(lambda m: False if is_winter(m) else True)
    
    # Мощность ТЭЦ: зимой высокая, летом низкая
    df['tec_power'] = df['month'].apply(
        lambda m: np.clip(np.random.normal(0.85, 0.1), 0.6, 1.0) if is_winter(m) else np.clip(np.random.normal(0.3, 0.1), 0.2, 0.5)
    )
    
    # Погода (Ветер): случайный ветер от 0 до 10 м/с
    df['wind_speed'] = np.random.uniform(0.0, 10.0, len(df))
    
    # ГЕНЕРАЦИЯ AQI (PM2.5) по физике смога
    # Базовый уровень загрязнения (летом ~20, зимой ~50)
    base_aqi = df['month'].apply(lambda m: 50 if is_winter(m) else 20)
    
    # Влияние ТЭЦ (+ до 100 AQI)
    tec_impact = df['tec_power'] * 100
    
    # Влияние трафика (+ до 80 AQI)
    traffic_impact = df['traffic'] * 80
    
    # Влияние отопления углем (если не запрещено) (+ до 150 AQI)
    coal_impact = df['heating_ban'].apply(lambda ban: 0 if ban else np.random.uniform(50, 150))
    
    # Рассеивание ветром: чем сильнее ветер, тем меньше смог (делим на (1 + wind_speed))
    wind_dispersion = 1 + (df['wind_speed'] / 2)
    
    # Итоговый AQI (с добавлением случайного шума)
    raw_aqi = (base_aqi + tec_impact + traffic_impact + coal_impact) / wind_dispersion
    noise = np.random.normal(0, 10, len(raw_aqi))
    df['pm25'] = np.clip(raw_aqi + noise, 5.0, 500.0) # От 5 до 500 (максимум AQI)
    
    # Считаем целевую переменную: какой будет pm25 через 12 часов?
    df['target_pm25_in_12h'] = df['pm25'].shift(-12)
    
    # Удаляем последние 12 строк (там NaN)
    df = df.dropna()
    
    return df

def main():
    print("API OpenAQ не содержит полной истории, генерируем эталонный датасет (физика Бишкека).")
    df = generate_synthetic_dataset(days=3650) # 10 лет, около 87 000 записей
    
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    filename = os.path.join(script_dir, "dataset_smog.csv")
    df.to_csv(filename, index=False)
    print(f"\nГотово! Датасет для ML модели сохранен: {filename}")
    print(df[['datetime', 'pm25', 'tec_power', 'traffic', 'heating_ban', 'target_pm25_in_12h']].head(5))

if __name__ == "__main__":
    main()
