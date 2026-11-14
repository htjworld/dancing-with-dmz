"""캐시에서 지도에 올릴 흑백 레이더 영상(WebP)을 만든다: app/data/layers/<지역>/<날짜>_<편파>.webp, app/data/layers.json

밝기 = 3x3 평균한 gamma0 의 dB 를 -22 ~ -2 dB 범위에서 0~255 로 편 것. 자료가 없는 화소는 투명하다.
영상은 UTM 격자 그대로이며, 네 모서리의 경위도를 layers.json 에 적어 지도가 그 사각형에 맞춰 편다.
사용: python tools/make_layers.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from pyproj import Transformer
from scipy.ndimage import uniform_filter

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "cache"
OUT = ROOT / "app" / "data" / "layers"
LO, HI = -22.0, -2.0
POLS = {"paju": ["hh"], "yeoncheon": ["hh"], "cheorwon": ["hh"], "hwacheon": ["hh", "hv"], "yanggu": ["hh"]}
HV_SHIFT = -6.0     # HV 는 전체적으로 어두워 같은 눈금을 6 dB 내려 쓴다


def smooth_db(a, k=3):
    """k x k 평균(빈 화소 제외) 뒤 dB"""
    ok = np.isfinite(a)
    num = uniform_filter(np.where(ok, a, 0.0).astype("float64"), k, mode="nearest")
    den = uniform_filter(ok.astype("float64"), k, mode="nearest")
    with np.errstate(all="ignore"):
        return np.where(ok & (den > 0), 10 * np.log10(num / den), np.nan)


def main():
    meta = {"scale_db": [LO, HI], "hv_shift_db": HV_SHIFT, "regions": {}}
    total = 0
    for region, pols in POLS.items():
        files = sorted((CACHE / region).glob("2026-*.npz"))
        d0 = np.load(files[0])
        x, y, epsg = d0["x"], d0["y"], int(d0["epsg"])
        inv = Transformer.from_crs(epsg, 4326, always_xy=True)
        hx, hy = (x[1] - x[0]) / 2, (y[0] - y[1]) / 2
        corners = [inv.transform(px, py) for px, py in [(x[0] - hx, y[0] + hy), (x[-1] + hx, y[0] + hy), (x[-1] + hx, y[-1] - hy), (x[0] - hx, y[-1] - hy)]]
        (OUT / region).mkdir(parents=True, exist_ok=True)
        dates = []
        for f in files:
            d = np.load(f)
            for pol in pols:
                db = smooth_db(d[pol])
                lo = LO + (HV_SHIFT if pol == "hv" else 0)
                g = np.clip((db - lo) / (HI - LO), 0, 1)
                img = np.zeros(db.shape + (4,), "uint8")
                v = np.where(np.isfinite(g), g * 255, 0).astype("uint8")
                img[..., 0] = img[..., 1] = img[..., 2] = v
                img[..., 3] = np.where(np.isfinite(db), 255, 0)
                dst = OUT / region / f"{f.stem}_{pol}.webp"
                Image.fromarray(img, "RGBA").save(dst, "WEBP", quality=78, method=4)
                total += dst.stat().st_size
            dates.append(f.stem)
        meta["regions"][region] = {"pols": pols, "dates": dates, "size": [int(len(x)), int(len(y))],
                                   "corners": [[round(a, 6), round(b, 6)] for a, b in corners]}
        print(region, len(dates), "dates", pols)
    (ROOT / "app" / "data" / "layers.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(f"total {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
