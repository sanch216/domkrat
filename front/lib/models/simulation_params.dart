/// Parameters sent to the backend for smog simulation.
class SimulationParams {
  final String activeMode;
  final bool useRealWeather;
  final WeatherParams weather;
  final Map<String, String> cityState;

  const SimulationParams({
    this.activeMode = 'edit',
    this.useRealWeather = false,
    required this.weather,
    required this.cityState,
  });

  Map<String, dynamic> toJson() => {
        'active_mode': activeMode,
        'use_real_weather': useRealWeather,
        'weather': weather.toJson(),
        'city_state': cityState,
      };

  /// Legacy format fallback for the simpler backend endpoint.
  Map<String, dynamic> toLegacyJson() => {
        'tec_power': weather.temperature > 0 ? 50.0 : 80.0,
        'traffic_level': 50.0,
        'coal_heating': true,
        'wind_direction': weather.windDirection,
        'wind_speed': weather.windSpeed,
      };
}

class WeatherParams {
  final double windDirection;
  final double windSpeed;
  final double temperature;

  const WeatherParams({
    this.windDirection = 45,
    this.windSpeed = 2.0,
    this.temperature = -5.0,
  });

  Map<String, dynamic> toJson() => {
        'wind_direction': windDirection,
        'wind_speed': windSpeed,
        'temperature': temperature,
      };

  WeatherParams copyWith({
    double? windDirection,
    double? windSpeed,
    double? temperature,
  }) =>
      WeatherParams(
        windDirection: windDirection ?? this.windDirection,
        windSpeed: windSpeed ?? this.windSpeed,
        temperature: temperature ?? this.temperature,
      );
}
