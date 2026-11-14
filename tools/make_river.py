"""연천 창에서 '거의 언제나 어두운 화소'를 물로 보고 강 위의 점들을 만든다: app/data/river.json

규칙: 3x3 평균한 HH 가 -12 dB 미만인 날이 전체 관측일의 80% 이상인 화소 = 물.
       이어진 덩어리 가운데 MIN_PIXELS 이상만 남기고, 눈으로 확인해 못·저수지로 보이는 곳(EXCLUDE)은 뺀다.
dark_ratio: 강과 그 둘레 3화소(약 90 m) 안에서, 날짜별로 기준값 미만인 화소의 비율.
            비율이 줄어든 날은 '강이 좁아졌다'가 아니라 '물 위가 덜 어둡게 보였다'는 뜻이다.
사용: python tools/make_river.py   (확인용 그림: data/cache/_preview/river.png)
"""
import json
from pathlib import Path

import numpy as np
from pyproj import Transformer
from scipy import ndimage

from make_layers import smooth_db

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "cache" / "yeoncheon"
THRESH_DB, MIN_SHARE, MIN_PIXELS, MAX_POINTS = -12.0, 0.8, 15, 2000
# 확인용 그림을 눈으로 보고 뺀 곳(행 시작, 행 끝, 열 시작, 열 끝): 강줄기에서 떨어진 못·저수지로 보이는 덩어리
EXCLUDE = [(540, 595, 215, 260), (580, 705, 50, 150)]


def main():
    files = sorted(CACHE.glob("2026-*.npz"))
    d0 = np.load(files[0])
    x, y, epsg = d0["x"], d0["y"], int(d0["epsg"])
    db = np.stack([smooth_db(np.load(f)["hh"]) for f in files])
    dark = db < THRESH_DB
    need = int(np.ceil(MIN_SHARE * len(files)))
    water = dark.sum(0) >= need
    lab, n = ndimage.label(water, structure=np.ones((3, 3)))
    sizes = ndimage.sum(water, lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= MIN_PIXELS])
    for r0, r1, c0, c1 in EXCLUDE:
        keep[r0:r1, c0:c1] = False
    print(f"물 화소 {int(water.sum())} → 큰 덩어리 {int((sizes >= MIN_PIXELS).sum())}개, {int(keep.sum())} 화소 (규칙: {need}/{len(files)}일 이상 {THRESH_DB} dB 미만)")

    rows, cols = np.nonzero(keep)
    step = max(1, int(np.ceil(len(rows) / MAX_POINTS)))
    inv = Transformer.from_crs(epsg, 4326, always_xy=True)
    lon, lat = inv.transform(x[cols[::step]], y[rows[::step]])
    corridor = ndimage.binary_dilation(keep, iterations=3)
    ratio = [{"date": f.stem, "dark_ratio": round(float(dark[i][corridor].mean()), 4)} for i, f in enumerate(files)]
    for r in ratio:
        print(r["date"], f"{r['dark_ratio'] * 100:.1f}%")
    out = {"source": "NISAR L2 GCOV HH, 연천 창",
           "rule": f"3x3 평균 HH < {THRESH_DB} dB 인 날이 {need}/{len(files)}일 이상인 화소. {MIN_PIXELS}화소 이상 이어진 덩어리만, 못으로 보이는 두 곳 제외",
           "ratio_rule": f"강과 둘레 3화소 안에서 그날 {THRESH_DB} dB 미만인 화소의 비율",
           "points": [[round(a, 5), round(b, 5)] for a, b in zip(lon, lat)], "dark_ratio": ratio,
           "bounds": [round(float(min(lon)), 4), round(float(min(lat)), 4), round(float(max(lon)), 4), round(float(max(lat)), 4)]}
    (ROOT / "app" / "data" / "river.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(len(out["points"]), "points, bounds", out["bounds"])

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(11, 11))
    ax.imshow(np.nanmean(db, 0), cmap="gray", vmin=-22, vmax=-2)
    ov = np.zeros(keep.shape + (4,)); ov[keep] = (0, 1, 1, .8); ov[water & ~keep] = (1, .3, .3, .9)
    ax.imshow(ov); ax.set_title("cyan = kept as river, red = dropped small blobs")
    out_png = ROOT / "data" / "cache" / "_preview" / "river.png"
    fig.tight_layout(); fig.savefig(out_png, dpi=75); print(out_png)


if __name__ == "__main__":
    main()
