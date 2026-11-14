"""캐시(data/cache)와 구역 정의(zones.py)에서 app/data/regions.json 을 만든다.

구역 값 = 구역 안 화소의 전력(선형) 평균을 dB 로 바꾼 것. 12일 간격이 비는 통과는 '보지 못한 날'(rest)로 넣는다.
사용: python tools/make_regions.py
"""
import json, sys
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "cache"
sys.path.insert(0, str(Path(__file__).parent))
from zones import ZONES

MIN_VALID = 0.9      # 구역 화소의 90% 이상이 유효해야 그 날의 값을 쓴다


def passes(granules, step=12):
    out, prev = [], None
    for g in granules:
        d = date.fromisoformat(g["date"])
        while prev and (d - prev).days > step + 1:
            prev += timedelta(days=step)
            out.append({"date": prev.isoformat(), "rest": True})
        out.append({"date": g["date"], "rest": False, "granule": g["id"], "collection": g["collection"]})
        prev = d
    return [{"cycle": i, **p} for i, p in enumerate(out)]


def db(v):
    return None if v is None or not np.isfinite(v) or v <= 0 else round(float(10 * np.log10(v)), 3)


def main():
    ps = passes(json.loads((ROOT / "data" / "granules.json").read_text(encoding="utf-8")))
    zones = []
    for zid, z in ZONES.items():
        w, s, e, n = z["bounds"]
        obs, npx = [], 0
        for p in ps:
            f = CACHE / z["region"] / f"{p['date']}.npz"
            if p["rest"] or not f.exists():
                obs.append({"cycle": p["cycle"], "date": p["date"], "status": "missing", "hh_db": None, "hv_db": None})
                continue
            d = np.load(f)
            t = Transformer.from_crs(4326, int(d["epsg"]), always_xy=True)
            xs, ys = t.transform([w, e, w, e], [s, s, n, n])
            c = (d["x"] >= min(xs)) & (d["x"] <= max(xs)); r = (d["y"] >= min(ys)) & (d["y"] <= max(ys))
            hh, hv = d["hh"][np.ix_(r, c)], d["hv"][np.ix_(r, c)]
            npx = hh.size
            frac = float(np.isfinite(hh).mean()) if hh.size else 0.0
            ok = frac >= MIN_VALID
            with np.errstate(all="ignore"):
                obs.append({"cycle": p["cycle"], "date": p["date"], "status": "valid" if ok else "low_quality",
                            "hh_db": db(np.nanmean(hh)) if ok else None, "hv_db": db(np.nanmean(hv)) if ok else None,
                            "valid_frac": round(frac, 3)})
        zones.append({"id": zid, "region": z["region"], "role": z["role"], "name": z["name"], "bounds": list(z["bounds"]),
                      "polygon": [[w, s], [e, s], [e, n], [w, n], [w, s]], "n_pixels": int(npx), "observations": obs})
    out = {"source": "NISAR L2 GCOV (NASA/ISRO), ASF DAAC. track 133 descending, frame 069, mode 4005. gamma0 HH/HV",
           "method": "30 m 캐시(3x3 평균)에서 구역 화소의 전력 평균을 dB 로 변환. 구역은 팀이 영상에서 고른 사각형",
           "passes": ps, "zones": zones}
    dst = ROOT / "app" / "data" / "regions.json"
    dst.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    dates = [p["date"][5:] for p in ps]
    print(" " * 18, *[f"{d:>6}" for d in dates])
    for z in zones:
        base = next(o["hh_db"] for o in z["observations"] if o["hh_db"] is not None) if any(o["hh_db"] is not None for o in z["observations"]) else None
        row = [f"{o['hh_db'] - base:+6.1f}" if o["hh_db"] is not None else "     ." for o in z["observations"]]
        print(f"{z['id']:<18}", *row, f"| HH0 {base} HV0 {z['observations'][0]['hv_db']} n={z['n_pixels']}")


if __name__ == "__main__":
    main()
