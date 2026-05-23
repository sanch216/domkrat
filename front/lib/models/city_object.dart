/// Represents a city object (ТЭЦ, park, district) that the user can click
/// on the map and change its state.
class CityObject {
  final String id;
  final String name;
  final double lat;
  final double lng;
  final CityObjectType type;
  final List<String> possibleStates;
  String currentState;

  CityObject({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
    required this.type,
    required this.possibleStates,
    required this.currentState,
  });
}

enum CityObjectType {
  tec,        // ТЭЦ
  park,       // Парк / зелёная зона
  district,   // Жилой массив
  road,       // Трафик / дорога
  factory_,   // Промышленность
}

/// All 17 Bishkek city objects for the simulation.
final List<CityObject> bishkekCityObjects = [
  // ── ТЭЦ ──
  CityObject(
    id: 'tec_1',
    name: 'ТЭЦ Бишкек',
    lat: 42.8465,
    lng: 74.6182,
    type: CityObjectType.tec,
    possibleStates: ['coal_full', 'coal_reduced', 'gas_converted', 'off'],
    currentState: 'coal_full',
  ),
  // ── Парки ──
  CityObject(
    id: 'panfilov_park',
    name: 'Парк Панфилова',
    lat: 42.8746,
    lng: 74.6122,
    type: CityObjectType.park,
    possibleStates: ['active', 'reduced', 'inactive'],
    currentState: 'active',
  ),
  CityObject(
    id: 'ata_turk_park',
    name: 'Парк Ата-Тюрк',
    lat: 42.8820,
    lng: 74.5885,
    type: CityObjectType.park,
    possibleStates: ['active', 'reduced', 'inactive'],
    currentState: 'active',
  ),
  CityObject(
    id: 'botanical_garden',
    name: 'Ботанический сад',
    lat: 42.8571,
    lng: 74.5743,
    type: CityObjectType.park,
    possibleStates: ['active', 'reduced', 'inactive'],
    currentState: 'active',
  ),
  // ── Жилые массивы / частный сектор ──
  CityObject(
    id: 'private_sector_north',
    name: 'Частный сектор (север)',
    lat: 42.8960,
    lng: 74.5950,
    type: CityObjectType.district,
    possibleStates: ['coal_heating', 'gas_heating', 'electric_heating', 'no_heating'],
    currentState: 'coal_heating',
  ),
  CityObject(
    id: 'private_sector_south',
    name: 'Частный сектор (юг)',
    lat: 42.8380,
    lng: 74.5900,
    type: CityObjectType.district,
    possibleStates: ['coal_heating', 'gas_heating', 'electric_heating', 'no_heating'],
    currentState: 'coal_heating',
  ),
  CityObject(
    id: 'private_sector_west',
    name: 'Частный сектор (запад)',
    lat: 42.8700,
    lng: 74.5500,
    type: CityObjectType.district,
    possibleStates: ['coal_heating', 'gas_heating', 'electric_heating', 'no_heating'],
    currentState: 'coal_heating',
  ),
  CityObject(
    id: 'private_sector_east',
    name: 'Частный сектор (восток)',
    lat: 42.8700,
    lng: 74.6400,
    type: CityObjectType.district,
    possibleStates: ['coal_heating', 'gas_heating', 'electric_heating', 'no_heating'],
    currentState: 'gas_heating',
  ),
  CityObject(
    id: 'microdistrict_asanbai',
    name: 'Мкр. Асанбай',
    lat: 42.8440,
    lng: 74.6300,
    type: CityObjectType.district,
    possibleStates: ['coal_heating', 'gas_heating', 'electric_heating', 'no_heating'],
    currentState: 'gas_heating',
  ),
  // ── Трафик ──
  CityObject(
    id: 'traffic_osh_bazaar',
    name: 'Ошский базар',
    lat: 42.8620,
    lng: 74.5980,
    type: CityObjectType.road,
    possibleStates: ['congested', 'moderate', 'free_flow', 'closed'],
    currentState: 'congested',
  ),
  CityObject(
    id: 'traffic_south_highway',
    name: 'Южная магистраль',
    lat: 42.8350,
    lng: 74.5850,
    type: CityObjectType.road,
    possibleStates: ['congested', 'moderate', 'free_flow', 'closed'],
    currentState: 'moderate',
  ),
  CityObject(
    id: 'traffic_chui_avenue',
    name: 'Проспект Чуй',
    lat: 42.8738,
    lng: 74.5932,
    type: CityObjectType.road,
    possibleStates: ['congested', 'moderate', 'free_flow', 'closed'],
    currentState: 'moderate',
  ),
  CityObject(
    id: 'traffic_manas_avenue',
    name: 'Проспект Манаса',
    lat: 42.8680,
    lng: 74.5828,
    type: CityObjectType.road,
    possibleStates: ['congested', 'moderate', 'free_flow', 'closed'],
    currentState: 'free_flow',
  ),
  CityObject(
    id: 'traffic_7_april',
    name: 'Ул. 7 Апреля',
    lat: 42.8770,
    lng: 74.6050,
    type: CityObjectType.road,
    possibleStates: ['congested', 'moderate', 'free_flow', 'closed'],
    currentState: 'moderate',
  ),
  // ── Промышленность ──
  CityObject(
    id: 'factory_north_industrial',
    name: 'Северная промзона',
    lat: 42.9000,
    lng: 74.5700,
    type: CityObjectType.factory_,
    possibleStates: ['full_load', 'reduced', 'idle', 'shutdown'],
    currentState: 'full_load',
  ),
  CityObject(
    id: 'factory_east_industrial',
    name: 'Восточная промзона',
    lat: 42.8650,
    lng: 74.6500,
    type: CityObjectType.factory_,
    possibleStates: ['full_load', 'reduced', 'idle', 'shutdown'],
    currentState: 'reduced',
  ),
  CityObject(
    id: 'airport_manas',
    name: 'Аэропорт Манас',
    lat: 42.8533,
    lng: 74.5374,
    type: CityObjectType.factory_,
    possibleStates: ['full_load', 'reduced', 'idle', 'shutdown'],
    currentState: 'reduced',
  ),
];
