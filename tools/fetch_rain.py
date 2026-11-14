"""NASA POWER 일 강수량(PRECTOTCORR)을 받아, NISAR 통과일마다 '통과일 포함 직전 3일 합계'를 만든다.

POWER 격자는 약 50 km 이다. 지역의 국지 강수·수위·침수 관측이 아니며, 설명의 보조 자료로만 쓴다.
사용: python tools/fetch_rain.py   (data/granules.json 이 먼저 있어야 한다)
"""
import json
from datetime import date, timedelta
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
API = "https://power.larc.nasa.gov/api/temporal/daily/point"
# 지역 창의 중심(경도, 위도). tools/extract_nisar.py 의 REGIONS 와 같은 범위다.
POINTS = {"paju": (126.71, 37.93), "yeoncheon": (126.975, 38.08), "cheorwon": (127.35, 38.25),
          "hwacheon": (127.775, 38.28), "yanggu": (128.135, 38.29)}


def main():
    passes = sorted({g["date"] for g in json.loads((ROOT / "data" / "granules.json").read_text(encoding="utf-8"))})
    start = (date.fromisoformat(passes[0]) - timedelta(days=5)).strftime("%Y%m%d")
    end = passes[-1].replace("-", "")
    out = {"source": "NASA POWER daily PRECTOTCORR (mm/day), community AG",
           "rule": "mm_3day = 통과일과 그 앞 이틀의 합. 값이 하나라도 없으면 null",
           "note": "약 50 km 격자. 국지 강수·수위 관측이 아니다.", "regions": {}}
    for rid, (lon, lat) in POINTS.items():
        r = requests.get(API, params={"parameters": "PRECTOTCORR", "community": "AG", "longitude": lon,
                                      "latitude": lat, "start": start, "end": end, "format": "JSON"}, timeout=120)
        r.raise_for_status()
        daily = r.json()["properties"]["parameter"]["PRECTOTCORR"]
        rows = []
        for p in passes:
            d = date.fromisoformat(p)
            vals = [daily.get((d - timedelta(days=k)).strftime("%Y%m%d")) for k in range(3)]
            ok = all(v is not None and v > -900 for v in vals)
            rows.append({"date": p, "mm_day": round(vals[0], 2) if ok else None,
                         "mm_3day": round(sum(vals), 2) if ok else None})
        out["regions"][rid] = {"lon": lon, "lat": lat, "passes": rows}
        print(rid, [row["mm_3day"] for row in rows])
    dst = ROOT / "app" / "data" / "rain.json"
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("->", dst)


if __name__ == "__main__":
    main()
