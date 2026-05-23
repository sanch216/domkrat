import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/simulation_params.dart';
import '../models/simulation_response.dart';

/// HTTP client for the Bishkek Smog Simulation backend.
class SimulationApi {
  final String baseUrl;

  SimulationApi({this.baseUrl = 'http://localhost:8000'});

  /// Sends simulation parameters and returns the response with heatmap data.
  Future<SimulationResponse> simulate(SimulationParams params) async {
    final uri = Uri.parse('$baseUrl/api/v1/simulate');

    // Use legacy format for compatibility with the current backend schema.
    final body = jsonEncode(params.toLegacyJson());

    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return SimulationResponse.fromJson(json);
    } else {
      throw Exception(
        'Simulation failed: ${response.statusCode} ${response.body}',
      );
    }
  }
}
