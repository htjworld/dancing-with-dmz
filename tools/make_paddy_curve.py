"""철원 내포리 논의 계절 곡선(근거 패널용) -> app/data/paddy_curve.json

내포리 중심(OpenStreetMap 기준 38.289N, 127.209E) 반경 RADIUS_KM 안의 화소와 같은 철원 창의 숲 구역을 통과마다 견준다.
  dark_pct : HH 가 DARK_DB 보다 어두운 화소 비율(%). 물이 찬 논(모내기 전후)은 레이더에 어둡게 보인다
  rel_db   : 같은 날 숲 구역 평균을 뺀 HH 평균(dB). 벼가 자라면 오르고, 거두면 내려가는 쪽으로 움직인다
입력은 app/data/layers(앱용 흑백 WebP)를 dB 로 되돌린 값이라 원자료보다 거칠다(hdk 가 처음 잰 방법과 같다).
사용: python tools/make_paddy_curve.py
"""
import json
from pathlib import Path

import numpy as np

from make_glow import DATA, lonlat_grid, mask_of, smooth_db, to_db

CENTER = (127.209, 38.289)   # 내포리, OpenStreetMap
RADIUS_KM = 1.8
DARK_DB = -12.0


def main():
    layers = json.loads((DATA / "layers.json").read_text())
    lo, hi = layers["scale_db"]
    meta = layers["regions"]["cheorwon"]
    zones = json.loads((DATA / "regions.json").read_text())["zones"]
    lon, lat = lonlat_grid(meta["corners"], meta["size"])
    km = np.hypot((lon - CENTER[0]) * 111.32 * np.cos(np.radians(CENTER[1])), (lat - CENTER[1]) * 110.57)
    paddy = km <= RADIUS_KM
    forest = mask_of(next(z for z in zones if z["id"] == "cheorwon-forest"), lon, lat)
    out = {"name": "철원 내포리 논", "center": CENTER, "radius_km": RADIUS_KM, "dark_db": DARK_DB, "source": "layers",
           "dates": [], "dark_pct": [], "forest_dark_pct": [], "rel_db": []}
    for date in meta["dates"]:
        db = smooth_db(to_db(DATA / "layers" / "cheorwon" / f"{date}_hh.webp", lo, hi), 3)
        p, f = db[paddy], db[forest]
        p, f = p[np.isfinite(p)], f[np.isfinite(f)]
        mean = lambda a: 10 * np.log10(np.mean(10 ** (a / 10)))
        out["dates"].append(date)
        out["dark_pct"].append(round(100 * float((p < DARK_DB).mean()), 1))
        out["forest_dark_pct"].append(round(100 * float((f < DARK_DB).mean()), 1))
        out["rel_db"].append(round(float(mean(p) - mean(f)), 2))
    for row in zip(out["dates"], out["dark_pct"], out["forest_dark_pct"], out["rel_db"]):
        print(*row)
    # 논은 물 찬 초여름과 추수 뒤에 어두운 화소가 많고 한여름에는 적다. 숲은 내내 거의 없다
    d = dict(zip(out["dates"], out["dark_pct"]))
    assert d["2026-06-23"] > 3 * d["2026-08-10"], "내포리: 6월이 8월보다 훨씬 어두워야 한다(물 찬 논)"
    assert max(out["forest_dark_pct"]) < 5, "숲은 어두운 화소가 거의 없어야 한다"
    (DATA / "paddy_curve.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
