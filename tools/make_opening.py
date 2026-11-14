"""구름 문지르기 오프닝 자료 -> app/data/opening/, app/data/opening.json

7월 철원의 HLS 광학 미리보기 영상(가장 흐린 장면, 공개 버킷이라 로그인 불필요)을
레이더 영상(app/data/layers)과 같은 격자·같은 corners 로 다시 맞춰 저장한다. 레이더는 같은 7월의 NISAR 통과를 쓴다.
clouds 에는 지역별·월별 [창 안이 맑았던 관측, 전체 관측] 을 담는다(Landsat L30, data/hls_window.json, tools/hls_window.py).
사용: python tools/make_opening.py
"""
import io
import json
import shutil
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "app" / "data"
OUT = DATA / "opening"
REGION, MONTH = "cheorwon", "2026-07"
TILE_PX_M = 109800  # HLS 타일 한 변(m). 미리보기 영상은 이 범위를 정사각형으로 담는다


def cmr_meta(granule):
    short = granule.split(".")[1].replace("L30", "HLSL30").replace("S30", "HLSS30")
    url = f"https://cmr.earthdata.nasa.gov/search/granules.umm_json?short_name={short}&version=2.0&readable_granule_name={granule}"
    umm = json.load(urllib.request.urlopen(url, timeout=60))["items"][0]["umm"]
    return {a["Name"]: a["Values"][0] for a in umm["AdditionalAttributes"]}


def clouds_scenes(region):
    """CMR 에서 그 지역 창과 겹치는 7월 L30 장면(미리보기 주소, 타일 구름량)"""
    import hls_window
    corners = json.loads((DATA / "layers.json").read_text())["regions"][region]["corners"]
    return [{"granule": s["granule"], "cloud": s["tile_cloud"], "browse": s["browse"]} for s in hls_window.scenes(corners)]


def utm_epsg(cs_name):
    """'UTM, WGS84, UTM ZONE 52' -> 32652"""
    return 32600 + int(cs_name.strip().split()[-1])


def warp_to_layer(browse, ulx, uly, epsg, corners, size):
    """레이어 격자의 화소마다 경위도 -> UTM -> 미리보기 영상 화소(최근접)"""
    w, h = size
    (x0, y0), (x1, y1), _, (x3, y3) = corners
    uu, vv = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    lon = x0 + uu * (x1 - x0) + vv * (x3 - x0)
    lat = y0 + uu * (y1 - y0) + vv * (y3 - y0)
    ex, ny = Transformer.from_crs(4326, epsg, always_xy=True).transform(lon, lat)
    src = np.asarray(browse.convert("RGB"))
    px = TILE_PX_M / src.shape[1]
    col = np.floor((ex - ulx) / px).astype(int)
    row = np.floor((uly - ny) / px).astype(int)
    inside = (col >= 0) & (col < src.shape[1]) & (row >= 0) & (row < src.shape[0])
    out = np.zeros((h, w, 3), "uint8")
    out[inside] = src[row[inside], col[inside]]
    assert inside.mean() > 0.95, f"미리보기 영상이 레이어 범위를 다 덮지 못한다({inside.mean():.0%})"
    return Image.fromarray(out)


def main():
    layers = json.loads((DATA / "layers.json").read_text())
    meta = layers["regions"][REGION]
    # 창 안 구름(tools/hls_window.py)이 가장 많은 7월 장면. 타일 구름량은 창과 다를 수 있다
    window = json.loads((ROOT / "data/hls_window.json").read_text())["regions"][REGION]["dates"]
    # 그림이 반쪽만 나오지 않도록 창을 95% 이상 찍은 장면 중에서 고른다
    date, w = max(((d, v) for d, v in window.items() if d.startswith(MONTH) and v["coverage"] >= 95), key=lambda c: c[1]["window_cloud"])
    g = next(s for s in clouds_scenes(REGION) if s["granule"] == w["granule"])
    attrs = cmr_meta(g["granule"])
    browse = Image.open(io.BytesIO(urllib.request.urlopen(g["browse"], timeout=120).read()))
    OUT.mkdir(parents=True, exist_ok=True)
    optical = warp_to_layer(browse, float(attrs["ULX"]), float(attrs["ULY"]), utm_epsg(attrs["HORIZONTAL_CS_NAME"]),
                            meta["corners"], meta["size"])
    optical.save(OUT / f"hls_{REGION}.jpg", quality=85)

    radar_date = max(d for d in meta["dates"] if d.startswith(MONTH))  # 같은 달의 마지막 NISAR 통과(7/29 는 결측)
    shutil.copy(DATA / "layers" / REGION / f"{radar_date}_hh.webp", OUT / f"nisar_{REGION}.webp")

    opening = {
        "region": REGION,
        "optical": {"date": date, "cloud_pct": g["cloud"], "window_cloud_pct": w["window_cloud"], "granule": g["granule"], "file": f"opening/hls_{REGION}.jpg",
                    "corners": meta["corners"]},
        "radar": {"date": radar_date, "file": f"opening/nisar_{REGION}.webp", "corners": meta["corners"]},
        "clouds": {r: v["monthly"] for r, v in json.loads((ROOT / "data/hls_window.json").read_text())["regions"].items()},
    }
    (DATA / "opening.json").write_text(json.dumps(opening, ensure_ascii=False, indent=1), encoding="utf-8")
    print("optical", date, "tile", g["cloud"], "% window", w["window_cloud"], "% /", "radar", radar_date)


if __name__ == "__main__":
    main()
