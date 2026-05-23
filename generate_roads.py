import math
import json

def rotate_point(cx, cy, angle, px, py):
    s = math.sin(angle)
    c = math.cos(angle)
    # Translate point back to origin
    px -= cx
    py -= cy
    # Rotate point
    xnew = px * c - py * s
    ynew = px * s + py * c
    # Translate point back
    px = xnew + cx
    py = ynew + cy
    return [round(px, 5), round(py, 5)]

# Center of Bishkek for rotation
cx, cy = 74.59, 42.87
# Bishkek grid is rotated roughly -1.5 degrees
angle = math.radians(1.0) # Try positive or negative

# Original latitudes (approximate)
# Chui: 42.876
# Jibek Jolu: 42.883
# Kievskaya: 42.874
# Toktogul: 42.872
# Moskovskaya: 42.868
# Gorkogo: 42.858
# Ahunbaeva: 42.844
# South Mag: 42.822
# Mederova: 42.850

# Original longitudes (approximate)
# Manas: 74.582
# Togolok Moldo: 74.595
# Isanova: 74.588
# Sovetskaya (Abdrahmanova): 74.608
# 7 April: 74.635

roads = [
    # East-West
    {"id": "chui", "name": "Проспект Чуй", "lat": 42.876, "level": 0.5},
    {"id": "jibek", "name": "Жибек Жолу", "lat": 42.883, "level": 0.5},
    {"id": "kievskaya", "name": "Киевская", "lat": 42.874, "level": 0.4},
    {"id": "toktogul", "name": "Токтогула", "lat": 42.872, "level": 0.4},
    {"id": "moskovskaya", "name": "Московская", "lat": 42.868, "level": 0.4},
    {"id": "gorkogo", "name": "Горького", "lat": 42.858, "level": 0.45},
    {"id": "mederova", "name": "Медерова", "lat": 42.850, "level": 0.3},
    {"id": "ahunbaeva", "name": "Ахунбаева", "lat": 42.844, "level": 0.35},
    {"id": "south", "name": "Южная магистраль", "lat": 42.822, "level": 0.5},
]

vertical_roads = [
    # North-South
    {"id": "manas", "name": "Манаса", "lng": 74.582, "level": 0.3},
    {"id": "isanova", "name": "Исанова", "lng": 74.588, "level": 0.3},
    {"id": "togolok", "name": "Тоголок Молдо", "lng": 74.595, "level": 0.3},
    {"id": "abdrahmanova", "name": "Абдрахманова", "lng": 74.608, "level": 0.35},
    {"id": "7apr", "name": "7 Апреля", "lng": 74.635, "level": 0.4},
]

features = []

lng_start, lng_end = 74.50, 74.70
lat_start, lat_end = 42.80, 42.92

for r in roads:
    pts = []
    # Create line from west to east
    for x in range(0, 11):
        lx = lng_start + (lng_end - lng_start) * (x / 10.0)
        ly = r['lat']
        # Apply scaling to x for rotation since degrees are not square
        # 1 deg lat = 111km, 1 deg lng = 111 * cos(42.8) = 81.5km
        # Actually just simple rotation is fine for 1-2 degrees
        rx, ry = rotate_point(cx, cy, angle, lx, ly)
        pts.append([rx, ry])
    
    features.append({
        "type": "Feature",
        "properties": {"id": r["id"], "name": r["name"], "level": r["level"]},
        "geometry": {"type": "LineString", "coordinates": pts}
    })

for r in vertical_roads:
    pts = []
    # Create line from south to north
    for y in range(0, 11):
        lx = r['lng']
        ly = lat_start + (lat_end - lat_start) * (y / 10.0)
        rx, ry = rotate_point(cx, cy, angle, lx, ly)
        pts.append([rx, ry])
    
    features.append({
        "type": "Feature",
        "properties": {"id": r["id"], "name": r["name"], "level": r["level"]},
        "geometry": {"type": "LineString", "coordinates": pts}
    })

# Osh market
features.append({
    "type": "Feature",
    "properties": {"id": "osh", "name": "Ошский рынок", "level": 0.8},
    "geometry": {"type": "LineString", "coordinates": [
        rotate_point(cx, cy, angle, 74.575, 42.875),
        rotate_point(cx, cy, angle, 74.580, 42.875),
        rotate_point(cx, cy, angle, 74.585, 42.875)
    ]}
})

js_code = "export const TRAFFIC_ROADS = {\n  type: 'FeatureCollection',\n  features: " + json.dumps(features, ensure_ascii=False, indent=2) + "\n};\n"
with open('d:/projects_shit/the_fear/front-web/js/new_roads.js', 'w', encoding='utf-8') as f:
    f.write(js_code)
print("done")
