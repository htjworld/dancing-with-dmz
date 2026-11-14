"""OpenStreetMap 의 남북 육상 경계(군사분계선)를 받아 app/data/dmz.geojson 으로 만든다.

대한민국(relation 307756)과 북한(relation 192734)의 경계에 함께 속한 선 가운데 육지 구간만 남기고
서→동 한 줄로 잇는다. 표시용 개략 기하이며 정밀 측량 자료가 아니다. © OpenStreetMap contributors (ODbL).
사용: python tools/make_dmz.py [--refresh]
"""
import json, sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "osm" / "mdl.json"
QUERY = "[out:json][timeout:120];rel(307756);way(r)->.a;rel(192734);way(r)->.b;way.a.b;out geom;"
WEST, EAST = 126.60, 128.40      # 한강 하구와 동해 구간(해상 경계)은 뺀다


def fetch():
    r = requests.post("https://overpass-api.de/api/interpreter", data={"data": QUERY},
                      headers={"User-Agent": "dmz-hackathon-tool/1.0"}, timeout=180)
    r.raise_for_status()
    RAW.parent.mkdir(parents=True, exist_ok=True)
    RAW.write_bytes(r.content)


def main():
    if "--refresh" in sys.argv or not RAW.exists():
        fetch()
    ways = [[(p["lon"], p["lat"]) for p in e["geometry"]] for e in json.loads(RAW.read_text(encoding="utf-8"))["elements"]]
    # 끝점이 맞닿는 선끼리 이어 붙인다
    lines = [w for w in ways if any(WEST <= x <= EAST for x, _ in w)]
    chain = lines.pop(0)
    while lines:
        for i, w in enumerate(lines):
            if w[0] == chain[-1]: chain += w[1:]
            elif w[-1] == chain[-1]: chain += w[::-1][1:]
            elif w[-1] == chain[0]: chain = w[:-1] + chain
            elif w[0] == chain[0]: chain = w[::-1][:-1] + chain
            else: continue
            lines.pop(i)
            break
        else:
            break
    if chain[0][0] > chain[-1][0]:
        chain.reverse()
    line = [[round(x, 5), round(y, 5)] for x, y in chain if WEST <= x <= EAST]
    out = {"type": "FeatureCollection", "features": [{"type": "Feature",
           "properties": {"kind": "mdl", "source": "OpenStreetMap contributors (ODbL)", "note": "표시용 개략 기하"},
           "geometry": {"type": "LineString", "coordinates": line}}]}
    dst = ROOT / "app" / "data" / "dmz.geojson"
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(len(ways), "ways ->", len(line), "points", line[0], line[-1], "| 못 이은 선", len(lines))


if __name__ == "__main__":
    main()
