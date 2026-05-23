/// Response from the simulation backend.
class SimulationResponse {
  final String status;
  final int aqi;
  final List<HeatmapPoint> heatmapData;
  final String aiInsight;

  const SimulationResponse({
    required this.status,
    required this.aqi,
    required this.heatmapData,
    required this.aiInsight,
  });

  factory SimulationResponse.fromJson(Map<String, dynamic> json) {
    return SimulationResponse(
      status: json['status'] as String? ?? 'ok',
      aqi: json['aqi'] as int? ?? 0,
      heatmapData: (json['heatmap_data'] as List<dynamic>?)
              ?.map((e) => HeatmapPoint.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      aiInsight: json['ai_insight'] as String? ?? '',
    );
  }
}

/// A single point on the heatmap.
class HeatmapPoint {
  final double lat;
  final double lng;
  final double intensity;

  const HeatmapPoint({
    required this.lat,
    required this.lng,
    required this.intensity,
  });

  factory HeatmapPoint.fromJson(Map<String, dynamic> json) {
    return HeatmapPoint(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      intensity: (json['intensity'] as num).toDouble(),
    );
  }
}
