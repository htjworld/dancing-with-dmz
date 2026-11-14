"""밤하늘 영상의 물결 선 자료 -> app/data/ridges.json (hdk, 2026-11-14)

지역마다 가로줄(약 0.6 km 간격) x 점(약 0.2 km 간격) x 관측 11번의 값을 만든다. 숲 기준은 make_glow.py 와 같다
(같은 관측의 숲 구역 평균을 뺌). 입력은 app/data/layers(앱용 흑백 WebP)라 원자료보다 거칠다.
  wave   = 그 칸의 숲 대비 HH 가 한 계절 평균에서 벗어난 값(dB, +/-), 가로로 가우스 평활(빈 칸 제외). 영상이 쓰는 값
  change = |숲 대비 HH(관측 k) - 숲 대비 HH(첫 관측)| (dB)
  season = 그 칸의 숲 대비 HH 표준편차(밤사진 glow 와 같은 뜻)
사용: python tools/make_ridges.py
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "app" / "data"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else DATA / "ridges.json"
layers = json.loads((DATA / "layers.json").read_text(encoding="utf-8"))
zones = json.loads((DATA / "regions.json").read_text(encoding="utf-8"))["zones"]
lo, hi = layers["scale_db"]
ROW_KM, COL_KM = 0.6, 0.2


def db_of(path):
    a = np.asarray(Image.open(path).convert("RGBA")).astype("float64")
    d = lo + a[..., 0] / 255 * (hi - lo)
    d[a[..., 3] == 0] = np.nan
    return d


def grid(corners, size):
    w, h = size
    (x0, y0), (x1, y1), _, (x3, y3) = corners
    uu, vv = np.meshgrid((np.arange(w) + .5) / w, (np.arange(h) + .5) / h)
    return x0 + uu * (x1 - x0) + vv * (x3 - x0), y0 + uu * (y1 - y0) + vv * (y3 - y0)


out = {"dates": None, "regions": {}}
for region, meta in layers["regions"].items():
    corners, (w, h) = meta["corners"], meta["size"]
    lon, lat = grid(corners, (w, h))
    ref = next(z for z in zones if z["region"] == region and z["role"] == "ref")["polygon"]
    xs, ys = [p[0] for p in ref], [p[1] for p in ref]
    forest = (lon >= min(xs)) & (lon <= max(xs)) & (lat >= min(ys)) & (lat <= max(ys))
    # 화소 크기(km): 위쪽 가장자리 길이 / 너비
    (x0, y0), (x1, y1) = corners[0], corners[1]
    km_px = np.hypot((x1 - x0) * 111.32 * np.cos(np.radians(y0)), (y1 - y0) * 110.57) / w
    band, step = max(4, round(ROW_KM / km_px)), max(2, round(COL_KM / km_px))
    ny, nx = h // band, w // step
    rel = []
    for date in meta["dates"]:
        d = db_of(DATA / "layers" / region / f"{date}_hh.webp")
        p = 10 ** (d / 10)
        r = 10 * np.log10(np.nanmean(p[forest]))
        # 칸 평균(전력값) -> dB
        cells = np.full((ny, nx), np.nan)
        for j in range(ny):
            blk = p[j * band:(j + 1) * band]
            for i in range(nx):
                c = blk[:, max(0, i * step - step):i * step + 2 * step]   # 이웃과 겹치는 창으로 부드럽게
                ok = np.isfinite(c)
                if ok.mean() > .6:
                    cells[j, i] = 10 * np.log10(c[ok].mean()) - r
        rel.append(cells)
    rel = np.stack(rel)
    change = np.abs(rel - rel[0])
    # 부드러운 물결용: 계절 평균에서 벗어난 정도(+/-), 가로로 가우스 평활(빈 칸 제외), 세로로 약하게
    dev = rel - np.nanmean(rel, 0)
    def gsmooth(a, sx=1.8, sy=0.8):
        out = []
        for f in a:
            ok = np.isfinite(f).astype(float); v = np.nan_to_num(f)
            for sig, ax in ((sx, 1), (sy, 0)):
                r = int(3 * sig) + 1; k = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2)
                conv = lambda m: np.apply_along_axis(lambda x: np.convolve(x, k, "same"), ax, m)
                v, ok2 = conv(v * ok), conv(ok)
                v = np.where(ok2 > 1e-6, v / np.maximum(ok2, 1e-6), 0); ok = (ok2 > 0.5 * k.sum()).astype(float) * 1.0
            out.append(np.where(np.isfinite(f), v, np.nan))
        return np.stack(out)
    wave = gsmooth(dev)
    season = np.nanstd(rel, 0)
    q = lambda a: [[None if not np.isfinite(v) else round(float(v), 2) for v in row] for row in a]
    out["dates"] = meta["dates"]
    out["regions"][region] = {"corners": corners, "nx": nx, "ny": ny,
                              "change": [q(c) for c in change], "season": q(season), "wave": [q(c) for c in wave]}
    print(region, "rows", ny, "cols", nx, "band px", band, "km/px", round(km_px, 4),
          "median change", round(float(np.nanmedian(change[1:])), 2), "p95", round(float(np.nanpercentile(change[1:], 95)), 2),
          "season p50/p95", round(float(np.nanmedian(season)), 2), round(float(np.nanpercentile(season, 95)), 2),
          "wave |p95|", round(float(np.nanpercentile(np.abs(wave), 95)), 2))
OUT.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
print("bytes", OUT.stat().st_size)
