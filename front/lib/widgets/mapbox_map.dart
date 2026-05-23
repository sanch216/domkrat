import 'dart:convert';
import 'dart:js_interop';
import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;
import '../models/simulation_response.dart';
import '../models/city_object.dart';
import '../theme/app_colors.dart';

// ── JS function bindings (declared in index.html) ──

@JS('initMapbox')
external JSAny? _jsInitMapbox(
    JSString containerId, JSNumber lat, JSNumber lng, JSNumber zoom);

@JS('updateHeatmap')
external JSAny? _jsUpdateHeatmap(JSString containerId, JSString pointsJson);

@JS('clearHeatmap')
external void _jsClearHeatmap(JSString containerId);

@JS('addCityMarker')
external void _jsAddCityMarker(JSString containerId, JSString id,
    JSString name, JSNumber lat, JSNumber lng, JSString type, JSString color);

@JS('removeAllMarkers')
external void _jsRemoveAllMarkers(JSString containerId);

@JS('flyTo')
external void _jsFlyTo(
    JSString containerId, JSNumber lat, JSNumber lng, JSNumber zoom);

@JS('destroyMap')
external void _jsDestroyMap(JSString containerId);

/// Bridge between Dart and the Mapbox GL JS functions in index.html.
class MapboxBridge {
  final String containerId;

  MapboxBridge(this.containerId);

  /// Initialize the map.
  void init({
    double lat = 42.87,
    double lng = 74.59,
    double zoom = 12,
  }) {
    _jsInitMapbox(
      containerId.toJS,
      lat.toJS,
      lng.toJS,
      zoom.toJS,
    );
  }

  /// Update heatmap layer with new points.
  void updateHeatmap(List<HeatmapPoint> points) {
    final json = jsonEncode(points
        .map((p) => {'lat': p.lat, 'lng': p.lng, 'intensity': p.intensity})
        .toList());
    _jsUpdateHeatmap(containerId.toJS, json.toJS);
  }

  /// Clear heatmap data.
  void clearHeatmap() {
    _jsClearHeatmap(containerId.toJS);
  }

  /// Add a city object marker.
  void addCityMarker(CityObject obj) {
    final color = _colorForType(obj.type);
    _jsAddCityMarker(
      containerId.toJS,
      obj.id.toJS,
      obj.name.toJS,
      obj.lat.toJS,
      obj.lng.toJS,
      obj.type.name.toJS,
      color.toJS,
    );
  }

  /// Remove all markers.
  void removeAllMarkers() {
    _jsRemoveAllMarkers(containerId.toJS);
  }

  /// Fly camera to a location.
  void flyTo(double lat, double lng, {double zoom = 14}) {
    _jsFlyTo(containerId.toJS, lat.toJS, lng.toJS, zoom.toJS);
  }

  /// Destroy the map instance.
  void destroy() {
    _jsDestroyMap(containerId.toJS);
  }

  String _colorForType(CityObjectType type) {
    switch (type) {
      case CityObjectType.tec:
        return '#E53935'; // Red
      case CityObjectType.park:
        return '#228A56'; // Green
      case CityObjectType.district:
        return '#FFC107'; // Yellow
      case CityObjectType.road:
        return '#FF9800'; // Orange
      case CityObjectType.factory_:
        return '#9C27B0'; // Purple
    }
  }
}

/// Flutter widget wrapping a Mapbox GL JS map via HtmlElementView.
class MapboxMapWidget extends StatefulWidget {
  final String mapId;
  final double initialLat;
  final double initialLng;
  final double initialZoom;
  final void Function(MapboxBridge bridge)? onMapReady;

  const MapboxMapWidget({
    super.key,
    required this.mapId,
    this.initialLat = 42.87,
    this.initialLng = 74.59,
    this.initialZoom = 12,
    this.onMapReady,
  });

  @override
  State<MapboxMapWidget> createState() => _MapboxMapWidgetState();
}

class _MapboxMapWidgetState extends State<MapboxMapWidget> {
  late MapboxBridge _bridge;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _bridge = MapboxBridge(widget.mapId);
  }

  void _initMap() {
    if (_initialized) return;
    _initialized = true;

    // Defer map initialization to allow the DOM element to mount.
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      _bridge.init(
        lat: widget.initialLat,
        lng: widget.initialLng,
        zoom: widget.initialZoom,
      );
      widget.onMapReady?.call(_bridge);
    });
  }

  @override
  void dispose() {
    _bridge.destroy();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _initMap();

    return HtmlElementView.fromTagName(
      tagName: 'div',
      onElementCreated: (element) {
        final div = element as web.HTMLDivElement;
        div.id = widget.mapId;
        div.style.width = '100%';
        div.style.height = '100%';
        div.className = 'mapbox-container';
      },
    );
  }
}
