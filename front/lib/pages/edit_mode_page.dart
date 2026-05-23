import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/mapbox_map.dart';
import '../widgets/glassmorphic_panel.dart';
import '../widgets/pill_buttons.dart';
import '../widgets/aqi_indicator.dart';
import '../services/simulation_api.dart';
import '../models/simulation_params.dart';
import '../models/simulation_response.dart';
import '../models/city_object.dart';

/// Edit mode page: clean map + control panel to configure and run simulation.
class EditModePage extends StatefulWidget {
  const EditModePage({super.key});

  @override
  State<EditModePage> createState() => _EditModePageState();
}

class _EditModePageState extends State<EditModePage> {
  MapboxBridge? _bridge;
  final SimulationApi _api = SimulationApi();
  SimulationResponse? _response;
  bool _simulating = false;

  // ── Weather controls ──
  double _windDirection = 45;
  double _windSpeed = 2.0;
  double _temperature = -5.0;

  // ── City state controls ──
  double _tecPower = 80; // 0-100
  double _trafficLevel = 50; // 0-100
  bool _coalHeating = true;

  // ── City objects ──
  late List<CityObject> _cityObjects;

  @override
  void initState() {
    super.initState();
    // Deep-copy city objects for local editing.
    _cityObjects = bishkekCityObjects
        .map((o) => CityObject(
              id: o.id,
              name: o.name,
              lat: o.lat,
              lng: o.lng,
              type: o.type,
              possibleStates: o.possibleStates,
              currentState: o.currentState,
            ))
        .toList();
  }

  Future<void> _runSimulation() async {
    setState(() => _simulating = true);
    try {
      final params = SimulationParams(
        activeMode: 'edit',
        weather: WeatherParams(
          windDirection: _windDirection,
          windSpeed: _windSpeed,
          temperature: _temperature,
        ),
        cityState: {
          for (final obj in _cityObjects) obj.id: obj.currentState,
        },
      );

      final resp = await _api.simulate(params);
      setState(() {
        _response = resp;
        _simulating = false;
      });

      // Update the map
      _bridge?.updateHeatmap(resp.heatmapData);

      // Add markers
      _bridge?.removeAllMarkers();
      for (final obj in _cityObjects) {
        _bridge?.addCityMarker(obj);
      }
    } catch (e) {
      setState(() => _simulating = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка симуляции: $e'),
            backgroundColor: AppColors.aqiDangerous,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // ── Full-screen map ──
        MapboxMapWidget(
          mapId: 'edit-map',
          initialZoom: 12,
          onMapReady: (bridge) {
            _bridge = bridge;
          },
        ),

        // ── Right-side control panel ──
        Positioned(
          top: 16,
          right: 16,
          bottom: 16,
          child: SingleChildScrollView(
            child: _buildControlPanel(),
          ),
        ),

        // ── AQI (top left) ──
        if (_response != null)
          Positioned(
            top: 16,
            left: 16,
            child: GlassmorphicPanel(
              borderRadius: 20,
              padding: const EdgeInsets.all(16),
              child: AqiIndicator(
                aqi: _response!.aqi,
                size: 100,
              ),
            ),
          ),

        // ── AI Insight (bottom left) ──
        if (_response != null && _response!.aiInsight.isNotEmpty)
          Positioned(
            bottom: 16,
            left: 16,
            child: GlassmorphicPanel(
              borderRadius: 16,
              padding: const EdgeInsets.all(16),
              width: 360,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Icon(Icons.auto_awesome,
                          color: AppColors.signalBlue, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        'Результат анализа',
                        style: AppTypography.label.copyWith(
                          color: AppColors.signalBlue,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _response!.aiInsight,
                    style: AppTypography.bodySm.copyWith(
                      color: AppColors.fog,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),

        // ── Loading ──
        if (_simulating)
          Positioned.fill(
            child: Container(
              color: AppColors.voidBlack.withAlpha(100),
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

  Widget _buildControlPanel() {
    return GlassmorphicPanel(
      borderRadius: 24,
      padding: const EdgeInsets.all(24),
      width: 340,
      blurSigma: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Header ──
          Text('Параметры симуляции', style: AppTypography.headingSm.copyWith(fontSize: 20)),
          const SizedBox(height: 4),
          Text(
            'Настройте факторы и запустите',
            style: AppTypography.bodySm.copyWith(color: AppColors.ash),
          ),
          const SizedBox(height: 24),

          // ── Wind direction ──
          _buildSliderControl(
            label: 'Направление ветра',
            value: _windDirection,
            min: 0,
            max: 360,
            suffix: '°',
            icon: Icons.explore_outlined,
            onChanged: (v) => setState(() => _windDirection = v),
          ),
          const SizedBox(height: 16),

          // ── Wind speed ──
          _buildSliderControl(
            label: 'Скорость ветра',
            value: _windSpeed,
            min: 0,
            max: 50,
            suffix: ' м/с',
            icon: Icons.air_outlined,
            onChanged: (v) => setState(() => _windSpeed = v),
          ),
          const SizedBox(height: 16),

          // ── Temperature ──
          _buildSliderControl(
            label: 'Температура',
            value: _temperature,
            min: -30,
            max: 40,
            suffix: '°C',
            icon: Icons.thermostat_outlined,
            onChanged: (v) => setState(() => _temperature = v),
          ),
          const SizedBox(height: 16),

          // ── TEC Power ──
          _buildSliderControl(
            label: 'Мощность ТЭЦ',
            value: _tecPower,
            min: 0,
            max: 100,
            suffix: '%',
            icon: Icons.factory_outlined,
            onChanged: (v) => setState(() => _tecPower = v),
          ),
          const SizedBox(height: 16),

          // ── Traffic Level ──
          _buildSliderControl(
            label: 'Уровень трафика',
            value: _trafficLevel,
            min: 0,
            max: 100,
            suffix: '%',
            icon: Icons.traffic_outlined,
            onChanged: (v) => setState(() => _trafficLevel = v),
          ),
          const SizedBox(height: 16),

          // ── Coal Heating Toggle ──
          Row(
            children: [
              Icon(Icons.local_fire_department_outlined,
                  color: AppColors.ash, size: 18),
              const SizedBox(width: 8),
              Text('Угольное отопление', style: AppTypography.label),
              const Spacer(),
              Switch(
                value: _coalHeating,
                onChanged: (v) => setState(() => _coalHeating = v),
              ),
            ],
          ),

          const SizedBox(height: 24),
          const Divider(color: AppColors.gunmetal, height: 1),
          const SizedBox(height: 24),

          // ── City Objects Section ──
          Text(
            'ОБЪЕКТЫ ГОРОДА',
            style: AppTypography.caption.copyWith(
              color: AppColors.slate,
              letterSpacing: 1.5,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 12),
          ..._buildCityObjectControls(),

          const SizedBox(height: 24),

          // ── Run Simulation Button ──
          SizedBox(
            width: double.infinity,
            child: PrimaryPillButton(
              label: 'Запустить симуляцию',
              icon: Icons.play_arrow_rounded,
              onPressed: _simulating ? null : _runSimulation,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliderControl({
    required String label,
    required double value,
    required double min,
    required double max,
    required String suffix,
    required IconData icon,
    required ValueChanged<double> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: AppColors.ash, size: 18),
            const SizedBox(width: 8),
            Text(label, style: AppTypography.label),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.graphite,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                '${value.toStringAsFixed(value == value.roundToDouble() ? 0 : 1)}$suffix',
                style: AppTypography.bodySm.copyWith(
                  color: AppColors.signalBlue,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            trackHeight: 4,
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
            overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
          ),
          child: Slider(
            value: value,
            min: min,
            max: max,
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }

  List<Widget> _buildCityObjectControls() {
    // Group by type
    final grouped = <CityObjectType, List<CityObject>>{};
    for (final obj in _cityObjects) {
      grouped.putIfAbsent(obj.type, () => []).add(obj);
    }

    final widgets = <Widget>[];
    for (final entry in grouped.entries) {
      widgets.add(
        Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 4),
          child: Text(
            _typeLabel(entry.key),
            style: AppTypography.bodySm.copyWith(
              color: AppColors.fog,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
      );

      for (final obj in entry.value) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _colorForType(obj.type),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    obj.name,
                    style: AppTypography.bodySm.copyWith(fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                _buildStateDropdown(obj),
              ],
            ),
          ),
        );
      }
    }
    return widgets;
  }

  Widget _buildStateDropdown(CityObject obj) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.graphite,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.steel, width: 1),
      ),
      child: DropdownButton<String>(
        value: obj.currentState,
        dropdownColor: AppColors.graphite,
        style: AppTypography.bodySm.copyWith(fontSize: 11, color: AppColors.fog),
        underline: const SizedBox.shrink(),
        isDense: true,
        items: obj.possibleStates.map((state) {
          return DropdownMenuItem(
            value: state,
            child: Text(
              _stateDisplayName(state),
              style: AppTypography.bodySm.copyWith(fontSize: 11),
            ),
          );
        }).toList(),
        onChanged: (value) {
          if (value != null) {
            setState(() => obj.currentState = value);
          }
        },
      ),
    );
  }

  String _typeLabel(CityObjectType type) {
    switch (type) {
      case CityObjectType.tec:
        return '🏭 ТЭЦ';
      case CityObjectType.park:
        return '🌳 Парки';
      case CityObjectType.district:
        return '🏘️ Районы';
      case CityObjectType.road:
        return '🛣️ Трафик';
      case CityObjectType.factory_:
        return '⚙️ Промышленность';
    }
  }

  Color _colorForType(CityObjectType type) {
    switch (type) {
      case CityObjectType.tec:
        return AppColors.aqiDangerous;
      case CityObjectType.park:
        return AppColors.mapGreen;
      case CityObjectType.district:
        return AppColors.aqiModerate;
      case CityObjectType.road:
        return AppColors.aqiUnhealthy;
      case CityObjectType.factory_:
        return const Color(0xFF9C27B0);
    }
  }

  String _stateDisplayName(String state) {
    const names = {
      'coal_full': 'Уголь (100%)',
      'coal_reduced': 'Уголь (50%)',
      'gas_converted': 'Газ',
      'off': 'Выкл',
      'active': 'Активный',
      'reduced': 'Сниженный',
      'inactive': 'Неактивный',
      'coal_heating': 'Уголь',
      'gas_heating': 'Газ',
      'electric_heating': 'Электро',
      'no_heating': 'Нет',
      'congested': 'Пробка',
      'moderate': 'Умеренно',
      'free_flow': 'Свободно',
      'closed': 'Закрыто',
      'full_load': 'Полная',
      'idle': 'Простой',
      'shutdown': 'Остановка',
    };
    return names[state] ?? state;
  }
}
