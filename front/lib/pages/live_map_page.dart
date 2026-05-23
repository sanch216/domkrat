import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/mapbox_map.dart';
import '../widgets/glassmorphic_panel.dart';
import '../widgets/aqi_indicator.dart';
import '../services/simulation_api.dart';
import '../models/simulation_params.dart';
import '../models/simulation_response.dart';
import '../models/city_object.dart';

/// Live map page showing real-time smog, wind, traffic layers.
class LiveMapPage extends StatefulWidget {
  const LiveMapPage({super.key});

  @override
  State<LiveMapPage> createState() => _LiveMapPageState();
}

class _LiveMapPageState extends State<LiveMapPage> {
  MapboxBridge? _bridge;
  final SimulationApi _api = SimulationApi();
  SimulationResponse? _lastResponse;
  bool _loading = false;
  String _activeLayer = 'smog'; // smog, wind, traffic

  @override
  void initState() {
    super.initState();
    // Auto-load data after map is ready.
    Future.delayed(const Duration(seconds: 2), _loadDefaultData);
  }

  Future<void> _loadDefaultData() async {
    setState(() => _loading = true);
    try {
      final response = await _api.simulate(
        SimulationParams(
          activeMode: 'live',
          weather: const WeatherParams(
            windDirection: 45,
            windSpeed: 3.0,
            temperature: -5.0,
          ),
          cityState: {
            for (final obj in bishkekCityObjects) obj.id: obj.currentState,
          },
        ),
      );
      setState(() {
        _lastResponse = response;
        _loading = false;
      });
      _bridge?.updateHeatmap(response.heatmapData);
      // Add city markers
      for (final obj in bishkekCityObjects) {
        _bridge?.addCityMarker(obj);
      }
    } catch (e) {
      setState(() => _loading = false);
      debugPrint('Live data load failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // ── Full-screen map ──
        MapboxMapWidget(
          mapId: 'live-map',
          initialZoom: 12.5,
          onMapReady: (bridge) {
            _bridge = bridge;
          },
        ),

        // ── Top layer selector chips ──
        Positioned(
          top: 16,
          left: 0,
          right: 0,
          child: Center(child: _buildLayerChips()),
        ),

        // ── AQI indicator (bottom right) ──
        if (_lastResponse != null)
          Positioned(
            bottom: 24,
            right: 24,
            child: _buildAqiPanel(),
          ),

        // ── AI Insight panel (bottom left) ──
        if (_lastResponse != null && _lastResponse!.aiInsight.isNotEmpty)
          Positioned(
            bottom: 24,
            left: 24,
            child: _buildInsightPanel(),
          ),

        // ── Loading overlay ──
        if (_loading)
          Positioned.fill(
            child: Container(
              color: AppColors.voidBlack.withAlpha(120),
              child: const Center(
                child: CircularProgressIndicator(
                  color: AppColors.signalBlue,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildLayerChips() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(100),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.voidBlack.withAlpha(160),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: AppColors.glassBorder, width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _layerChip('smog', Icons.cloud_outlined, 'Смог'),
              _layerChip('wind', Icons.air_outlined, 'Ветер'),
              _layerChip('traffic', Icons.directions_car_outlined, 'Пробки'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _layerChip(String id, IconData icon, String label) {
    final isActive = _activeLayer == id;
    return GestureDetector(
      onTap: () => setState(() => _activeLayer = id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? AppColors.signalBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isActive ? AppColors.white : AppColors.fog,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: AppTypography.bodySm.copyWith(
                color: isActive ? AppColors.white : AppColors.fog,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAqiPanel() {
    return GlassmorphicPanel(
      borderRadius: 20,
      padding: const EdgeInsets.all(16),
      child: AqiIndicator(
        aqi: _lastResponse!.aqi,
        size: 110,
      ),
    );
  }

  Widget _buildInsightPanel() {
    return GlassmorphicPanel(
      borderRadius: 16,
      padding: const EdgeInsets.all(16),
      width: 320,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome, color: AppColors.signalBlue, size: 16),
              const SizedBox(width: 8),
              Text(
                'AI Анализ',
                style: AppTypography.label.copyWith(
                  color: AppColors.signalBlue,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _lastResponse!.aiInsight,
            style: AppTypography.bodySm.copyWith(
              color: AppColors.fog,
              height: 1.5,
            ),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
