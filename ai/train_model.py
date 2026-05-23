import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, "dataset_smog.csv")
    model_path = os.path.join(script_dir, "smog_model.pkl")

    if not os.path.exists(dataset_path):
        print(f"Ошибка: Файл {dataset_path} не найден! Сначала запустите fetch_openaq_data.py")
        return

    print("Загрузка датасета...")
    df = pd.read_csv(dataset_path)
    
    print(f"Размер датасета: {len(df)} строк.")

    # Выбираем фичи (X) и целевую переменную (y)
    # Исключаем 'datetime' и 'target_pm25_in_12h'
    features = ['hour', 'month', 'traffic', 'heating_ban', 'tec_power', 'wind_speed', 'pm25']
    target = 'target_pm25_in_12h'

    X = df[features]
    y = df[target]

    print("Разделение на train/test (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Обучение RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    print("Оценка модели...")
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("-" * 30)
    print(f"Mean Absolute Error (MAE): {mae:.2f} AQI")
    print(f"R^2 Score: {r2:.2f}")
    print("-" * 30)

    print(f"Сохранение модели в {model_path}...")
    joblib.dump(model, model_path)
    print("Готово! Модель готова к использованию в бэкенде.")

if __name__ == "__main__":
    main()
