"""구역을 고르기 위한 미리보기: 지역마다 (왼쪽) 기간 평균 HH 밝기, (오른쪽) 기간 중 변동 폭을 그린다.

군사분계선(실선)과 zones.py 의 구역 사각형을 함께 그린다. 결과는 data/cache/_preview/ 에 저장한다(저장소에 올리지 않는다).
사용: python tools/preview_regions.py [지역 ...]
"""
import json, sys
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "cache"
sys.path.insert(0, str(Path(__file__).parent))


def smooth(a, k=5):
    """k x k 평균(빈 화소는 뺀다)"""
    ok = np.isfinite(a)
    v = np.where(ok, a, 0.0)
    pad = k // 2
    def box(m):
        c = np.cumsum(np.cumsum(np.pad(m, ((pad + 1, pad), (pad + 1, pad))), 0), 1)
        return c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    n = box(ok.astype("float64"))
    with np.errstate(all="ignore"):
        return np.where(n > 0, box(v) / n, np.nan)


def stack(region, pol="hh"):
    files = sorted((CACHE / region).glob("2026-*.npz"))
    d0 = np.load(files[0])
    return [f.stem for f in files], np.stack([np.load(f)[pol] for f in files]), d0["x"], d0["y"], int(d0["epsg"])


def main():
    try:
        from zones import ZONES
    except Exception:
        ZONES = {}
    mdl = json.loads((ROOT / "app" / "data" / "dmz.geojson").read_text(encoding="utf-8"))["features"][0]["geometry"]["coordinates"]
    out = CACHE / "_preview"
    out.mkdir(exist_ok=True)
    for region in sys.argv[1:] or [p.name for p in CACHE.iterdir() if p.is_dir() and not p.name.startswith("_")]:
        dates, hh, x, y, epsg = stack(region)
        t = Transformer.from_crs(4326, epsg, always_xy=True)
        with np.errstate(all="ignore"):
            db = np.stack([10 * np.log10(smooth(a)) for a in hh])
            mean, rng = np.nanmean(db, 0), np.nanmax(db, 0) - np.nanmin(db, 0)
        ext = [x[0], x[-1], y[-1], y[0]]
        fig, axes = plt.subplots(1, 2, figsize=(22, 11 * (y[0] - y[-1]) / (x[-1] - x[0]) + 1))
        for ax, img, kw, title in [(axes[0], mean, dict(cmap="gray", vmin=-22, vmax=-4), "mean HH (dB)"),
                                   (axes[1], rng, dict(cmap="magma", vmin=0, vmax=6), "range over dates (dB)")]:
            ax.imshow(img, extent=ext, **kw)
            mx, my = t.transform([p[0] for p in mdl], [p[1] for p in mdl])
            ax.plot(mx, my, color="cyan", lw=1)
            # 경위도 눈금(0.02도)
            inv = Transformer.from_crs(epsg, 4326, always_xy=True)
            w, s = inv.transform(x[0], y[-1]); e, n = inv.transform(x[-1], y[0])
            lons = np.arange(np.ceil(w / .02) * .02, e, .02); lats = np.arange(np.ceil(s / .02) * .02, n, .02)
            ax.set_xticks([t.transform(l, (s + n) / 2)[0] for l in lons]); ax.set_xticklabels([f"{l:.2f}" for l in lons], rotation=90, fontsize=7)
            ax.set_yticks([t.transform((w + e) / 2, l)[1] for l in lats]); ax.set_yticklabels([f"{l:.2f}" for l in lats], fontsize=7)
            ax.grid(color="white", alpha=.18, lw=.4)
            for zid, z in ZONES.items():
                if z["region"] != region:
                    continue
                zw, zs, ze, zn = z["bounds"]
                px, py = t.transform([zw, ze, ze, zw, zw], [zs, zs, zn, zn, zs])
                ax.plot(px, py, color="lime", lw=1.2)
                ax.text(px[0], py[2], zid.split("-", 1)[1], color="lime", fontsize=8, va="bottom")
            ax.set_xlim(x[0], x[-1]); ax.set_ylim(y[-1], y[0]); ax.set_title(f"{region} · {title} · {dates[0]}~{dates[-1]}")
        fig.tight_layout()
        fig.savefig(out / f"{region}.png", dpi=70)
        plt.close(fig)
        print(region, hh.shape, "->", out / f"{region}.png")


if __name__ == "__main__":
    main()
