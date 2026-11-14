"""구역 토지피복 대조: ESA WorldCover 2021(10 m)로 각 구역 사각형의 피복 비율을 센다 -> app/data/landcover.json

구역은 팀이 레이더 영상을 보고 고른 사각형이라, "논 / DMZ 안 / 북쪽 경작지" 라는 이름이 맞는지 독립 자료로 확인한다.
WorldCover 타일은 공개 버킷이라 로그인이 필요 없다. 내려받은 파일은 data/raw/ 에 둔다(저장소에 올리지 않는다).
WorldCover 는 2021년 지도다. 2026년 현재와 다를 수 있다.
사용: python tools/landcover.py     (tifffile, imagecodecs, zarr 필요)
"""
import json
import urllib.request
from pathlib import Path

import numpy as np
import tifffile
import zarr

ROOT = Path(__file__).resolve().parents[1]
TILE = "ESA_WorldCover_10m_2021_v200_N36E126_Map.tif"   # 북위 36~39, 동경 126~129
URL = f"https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/{TILE}"
LOCAL = ROOT / "data" / "raw" / TILE
LON0, LAT0, STEP = 126.0, 39.0, 1 / 12000                  # 타일 좌상단과 화소 크기(도)
CLASSES = {10: "tree", 20: "shrub", 30: "grassland", 40: "cropland", 50: "built", 60: "bare", 80: "water", 90: "wetland"}


def tile():
    if not LOCAL.exists():
        LOCAL.parent.mkdir(parents=True, exist_ok=True)
        print("download", URL)
        urllib.request.urlretrieve(URL, LOCAL)
    return zarr.open(tifffile.imread(LOCAL, aszarr=True), mode="r")["0"]


def composition(arr, polygon):
    lons, lats = [p[0] for p in polygon], [p[1] for p in polygon]
    c0, c1 = int((min(lons) - LON0) / STEP), int(np.ceil((max(lons) - LON0) / STEP))
    r0, r1 = int((LAT0 - max(lats)) / STEP), int(np.ceil((LAT0 - min(lats)) / STEP))
    w = np.asarray(arr[r0:r1, c0:c1])
    n = w.size
    out = {name: round(100 * float((w == code).sum()) / n, 1) for code, name in CLASSES.items()}
    out["other"] = round(100 - sum(out.values()), 1)
    return out


def main():
    arr = tile()
    zones = json.loads((ROOT / "app/data/regions.json").read_text())["zones"]
    result = {"source": "ESA WorldCover 2021 v200 (10 m)", "unit": "%", "zones": {}}
    for z in zones:
        result["zones"][z["id"]] = composition(arr, z["polygon"])
        c = result["zones"][z["id"]]
        top = sorted(((v, k) for k, v in c.items()), reverse=True)[:3]
        print(f"{z['id']:20s} " + "  ".join(f"{k} {v}" for v, k in top))
    zc = result["zones"]
    # 이야기에 쓰는 구역 이름이 피복과 맞는지 확인한다. 틀리면 이름이나 문구를 바꿔야 한다
    assert zc["cheorwon-paddy"]["cropland"] > 50, "철원 '민통선 논'이 경작지가 아니다"
    assert zc["cheorwon-north"]["cropland"] > 30, "철원 '북쪽 경작지로 보이는 곳'이 경작지가 아니다"
    assert zc["cheorwon-dmz"]["cropland"] < zc["cheorwon-paddy"]["cropland"] / 2, "철원 DMZ 안이 논만큼 경작지다"
    (ROOT / "app/data/landcover.json").write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
