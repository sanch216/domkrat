import requests
import json

query = """
[out:json];
area["name:en"="Bishkek"]->.searchArea;
(
  way["name:ru"~"Чуй|Жибек|Киевская|Токтогула|Горького|Ахунбаева|Токомбаева|Масалиева|Тоголок|Медерова|Исанова|Манаса|Айтматова|Московская|Абдрахманова|Байтик|7 Апреля"](area.searchArea)["highway"~"primary|secondary|tertiary|trunk"];
);
out geom;
"""

url = "https://overpass-api.de/api/interpreter"
response = requests.post(url, data=query.encode('utf-8'))

try:
    result = response.json()
    
    roads = {}
    for el in result.get('elements', []):
        tags = el.get('tags', {})
        name = tags.get('name:ru') or tags.get('name') or ''
        if not name: continue
        
        rid = 'unknown'
        if 'Чуй' in name: rid = 'chui'
        elif 'Жибек' in name: rid = 'jibek'
        elif 'Киев' in name: rid = 'kievskaya'
        elif 'Токтогула' in name: rid = 'toktogul'
        elif 'Горького' in name: rid = 'gorkogo'
        elif 'Ахунбаева' in name: rid = 'ahunbaeva'
        elif 'Токомбаева' in name or 'Масалиева' in name or 'Южная' in name: rid = 'south'
        elif 'Тоголок' in name: rid = 'togolok'
        elif 'Медерова' in name: rid = 'mederova'
        elif 'Исанова' in name: rid = 'isanova'
        elif 'Манаса' in name or 'Айтматова' in name: rid = 'manas'
        elif 'Московская' in name: rid = 'moskovskaya'
        elif 'Абдрахманова' in name or 'Байтик' in name: rid = 'abdrahmanova'
        elif '7 Апреля' in name or 'Шабдан' in name or 'Курманжан' in name: rid = '7apr'
        
        if rid == 'unknown': continue
        
        if rid not in roads:
            roads[rid] = []
        
        geom = [[pt['lon'], pt['lat']] for pt in el['geometry']]
        roads[rid].append(geom)

    features = []
    levels = {
        'chui': 0.5, 'jibek': 0.5, 'kievskaya': 0.4, 'toktogul': 0.4, 
        'gorkogo': 0.45, 'south': 0.5, 'ahunbaeva': 0.35, 'togolok': 0.3,
        'mederova': 0.3, 'isanova': 0.3, 'manas': 0.3, 'moskovskaya': 0.4,
        'abdrahmanova': 0.35, '7apr': 0.4
    }
    
    for rid, geoms in roads.items():
        features.append({
            "type": "Feature",
            "properties": {"id": rid, "name": rid, "level": levels.get(rid, 0.4)},
            "geometry": {
                "type": "MultiLineString",
                "coordinates": geoms
            }
        })
        
    fc = {"type": "FeatureCollection", "features": features}
    
    with open("d:/projects_shit/the_fear/front-web/js/real_roads.json", "w", encoding='utf-8') as f:
        json.dump(fc, f)
    print(f"Saved {len(features)} roads to real_roads.json")
except Exception as e:
    print("Error:", e, response.text[:200])
