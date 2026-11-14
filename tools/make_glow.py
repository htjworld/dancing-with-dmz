"""계절 변동 지도("레이더로 찍은 밤사진") -> app/data/glow/, app/data/glow.json

화소마다 NISAR HH 의 계절 변동 폭을 잰다: 같은 통과의 숲 구역 평균을 빼서(장면 전체가 함께 변한 몫 제거)
남은 값의 표준편차(dB). 많이 변한 땅은 밝게, 그대로인 땅은 어둡게 칠한다.

입력: app/data/layers(앱용 흑백 WebP, -22~-2 dB 를 0~255 로 편 값)를 dB 로 되돌려 쓴다. 원자료보다 거칠다(source = "layers").
출력(지역마다):
  glow/<지역>_value.webp  빨강 채널 0~255 = 0~SCALE_HI dB, 알파 0 = 자료 없음. 무손실. 소리·숫자는 이걸 읽는다.
  glow/<지역>_color.webp  기본 색을 입힌 표시용 영상
  glow/<지역>_fNN.webp    재생용 누적 프레임(첫 통과부터 NN+1 번째 통과까지). 마지막 프레임은 color 와 같다
사용: python tools/make_glow.py
"""
import json
import warnings
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import uniform_filter

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "data"
OUT = DATA / "glow"
SCALE_HI = 1.5   # dB. 이 값 이상은 가장 밝게(철원 화소 값의 약 97 백분위)
SMOOTH = 5       # 화소 평균 창(스페클 줄이기)


def to_db(path, lo, hi):
    a = np.asarray(Image.open(path).convert("RGBA")).astype("float64")
    db = lo + a[..., 0] / 255 * (hi - lo)
    db[a[..., 3] == 0] = np.nan
    return db


def smooth_db(db, k=SMOOTH):
    """k x k 평균(빈 화소 제외)을 전력값에서 한 뒤 dB"""
    p = 10 ** (db / 10)
    ok = np.isfinite(p)
    num = uniform_filter(np.where(ok, p, 0.0), k, mode="nearest")
    den = uniform_filter(ok.astype("float64"), k, mode="nearest")
    with np.errstate(all="ignore"):
        return np.where(ok & (den > 0), 10 * np.log10(num / den), np.nan)


def lonlat_grid(corners, size):
    """화소 중심의 경위도. corners = [좌상, 우상, 우하, 좌하] 는 영상 바깥 모서리"""
    w, h = size
    (x0, y0), (x1, y1), _, (x3, y3) = corners
    u = (np.arange(w) + 0.5) / w
    v = (np.arange(h) + 0.5) / h
    uu, vv = np.meshgrid(u, v)
    return x0 + uu * (x1 - x0) + vv * (x3 - x0), y0 + uu * (y1 - y0) + vv * (y3 - y0)


def mask_of(zone, lon, lat):
    xs = [p[0] for p in zone["polygon"]]
    ys = [p[1] for p in zone["polygon"]]
    return (lon >= min(xs)) & (lon <= max(xs)) & (lat >= min(ys)) & (lat <= max(ys))


def colorize(s, valid):
    """0~1 -> 어두운 남색에서 주황, 노랑으로"""
    rgb = np.stack([s, s ** 2.2, 0.25 * (1 - s)], -1)
    img = np.zeros(s.shape + (4,), "uint8")
    img[..., :3] = np.clip(np.nan_to_num(rgb) * 255, 0, 255).astype("uint8")
    img[..., 3] = np.where(valid, 255, 0)
    return img


def save(img, name, **kw):
    Image.fromarray(img, "RGBA").save(OUT / name, "WEBP", **kw)
    return f"glow/{name}"


def build_region(region, meta, zones, lo, hi):
    lon, lat = lonlat_grid(meta["corners"], meta["size"])
    forest = mask_of(next(z for z in zones if z["region"] == region and z["role"] == "ref"), lon, lat)
    rel = []
    for date in meta["dates"]:
        db = smooth_db(to_db(DATA / "layers" / region / f"{date}_hh.webp", lo, hi))
        with np.errstate(all="ignore"):
            ref = 10 * np.log10(np.nanmean(10 ** (db[forest] / 10)))
        rel.append(db - ref)
    rel = np.stack(rel)
    warnings.filterwarnings("ignore", "Degrees of freedom", RuntimeWarning)
    valid = np.isfinite(rel).sum(0) >= 2
    with np.errstate(all="ignore"):
        sd = np.where(valid, np.nanstd(rel, 0), np.nan)
    s = np.clip(sd / SCALE_HI, 0, 1)

    value = np.zeros(s.shape + (4,), "uint8")
    value[..., 0] = value[..., 1] = value[..., 2] = np.where(valid, np.round(np.nan_to_num(s) * 255), 0).astype("uint8")
    value[..., 3] = np.where(valid, 255, 0)
    # 재생용 누적 프레임: frames[i] = 첫 통과부터 i+2 번째 통과까지의 변동 폭. 마지막 프레임 = color
    frames = []
    for k in range(2, len(rel) + 1):
        ok = np.isfinite(rel[:k]).sum(0) >= 2
        with np.errstate(all="ignore"):
            sk = np.clip(np.where(ok, np.nanstd(rel[:k], 0), np.nan) / SCALE_HI, 0, 1)
        frames.append(save(colorize(sk, ok), f"{region}_f{k - 1:02d}.webp", quality=75, method=4))
    entry = {"corners": meta["corners"], "size": meta["size"],
             "value": save(value, f"{region}_value.webp", lossless=True),
             "color": save(colorize(s, valid), f"{region}_color.webp", quality=80, method=4),
             "frames": frames}
    zone_means = {z["id"]: float(np.nanmean(sd[mask_of(z, lon, lat)])) for z in zones if z["region"] == region}
    return entry, zone_means


def main():
    layers = json.loads((DATA / "layers.json").read_text())
    zones = json.loads((DATA / "regions.json").read_text())["zones"]
    lo, hi = layers["scale_db"]
    OUT.mkdir(parents=True, exist_ok=True)
    glow = {"metric": "숲 대비 HH 계절 변동 폭(표준편차, dB)", "scale_db": [0, SCALE_HI], "source": "layers",
            "dates": None, "regions": {}}
    means = {}
    for region, meta in layers["regions"].items():
        glow["regions"][region], m = build_region(region, meta, zones, lo, hi)
        means.update(m)
        glow["dates"] = glow["dates"] or meta["dates"]
        print(region, {k.split("-", 1)[1]: round(v, 2) for k, v in m.items()})
    # 그림이 이야기와 같은 말을 하는지 확인한다
    assert means["cheorwon-paddy"] > 1.5 * means["cheorwon-dmz"], "철원: 논이 DMZ 안보다 밝아야 한다"
    assert means["cheorwon-north"] > 1.5 * means["cheorwon-dmz"], "철원: 북쪽 경작지가 DMZ 안보다 밝아야 한다"
    assert means["paju-dmz_farm"] > 1.5 * means["paju-dmz_wild"], "파주: DMZ 안 경작지가 미경작지보다 밝아야 한다"
    (DATA / "glow.json").write_text(json.dumps(glow, ensure_ascii=False, indent=1), encoding="utf-8")
    print("total", round(sum(f.stat().st_size for f in OUT.iterdir()) / 1e6, 1), "MB")


if __name__ == "__main__":
    main()
