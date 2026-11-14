"""다섯 지역 창 안의 구름 비율을 HLS L30 미리보기 영상에서 직접 잰다 -> data/hls_window.json

hls_cloud.py 의 구름량은 HLS 타일(약 110 km) 전체 값이라 우리 창과 다를 수 있다. 여기서는 미리보기 영상(공개 버킷)을
레이더 레이어와 같은 격자로 맞춘 뒤(make_opening.warp_to_layer) 창 안의 흰 화소 비율을 센다.
  구름 화소 = RGB 최솟값 > 150 이고 (최댓값 - 최솟값) < 45 인 밝은 무채색 화소. 영상 밖(검정)은 셈에서 뺀다.
  옅은 구름·연무는 못 잡으므로 실제보다 적게 센다(= "흐리다"는 주장에는 보수적인 값).
S30(Sentinel-2) 장면은 미리보기 영상이 없어 빠진다.
사용: python tools/hls_window.py
"""
import io
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

from make_opening import utm_epsg, warp_to_layer

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "hls_window.json"
TEMPORAL = "2026-06-01T00:00:00Z,2026-11-14T00:00:00Z"
CLEAR = 20          # 창 안 구름 20% 이하 = 맑음 (hls_cloud.py 와 같은 기준)
MIN_COVERAGE = 30   # 창의 30% 이상을 찍은 장면만 센다. 철원 창은 Landsat 경로 두 개에 걸쳐 절반만 찍는 장면이 많다


def scenes(corners):
    lons, lats = [c[0] for c in corners], [c[1] for c in corners]
    url = ("https://cmr.earthdata.nasa.gov/search/granules.umm_json?short_name=HLSL30&version=2.0"
           f"&bounding_box={min(lons)},{min(lats)},{max(lons)},{max(lats)}&temporal={TEMPORAL}&page_size=500")
    out = []
    for it in json.load(urllib.request.urlopen(url, timeout=60))["items"]:
        m = it["umm"]
        a = {x["Name"]: x["Values"][0] for x in m["AdditionalAttributes"]}
        browse = next((u["URL"] for u in m["RelatedUrls"] if u.get("Type") == "GET RELATED VISUALIZATION" and u["URL"].startswith("https")), None)
        if browse:
            out.append({"date": m["TemporalExtent"]["RangeDateTime"]["BeginningDateTime"][:10], "granule": m["GranuleUR"],
                        "tile_cloud": float(a["CLOUD_COVERAGE"]), "browse": browse,
                        "ulx": float(a["ULX"]), "uly": float(a["ULY"]), "epsg": utm_epsg(a["HORIZONTAL_CS_NAME"])})
    return out


def window_cloud(img):
    x = np.asarray(img).astype(int)
    mn, mx = x.min(-1), x.max(-1)
    data = mx > 0
    return round(100 * float(((mn > 150) & (mx - mn < 45) & data).sum() / max(1, data.sum())), 1), round(100 * float(data.mean()), 1)


def measure(s, meta):
    raw = urllib.request.urlopen(s["browse"], timeout=120).read()
    try:
        img = warp_to_layer(Image.open(io.BytesIO(raw)), s["ulx"], s["uly"], s["epsg"], meta["corners"], meta["size"])
    except AssertionError:
        return None   # 이 타일은 창을 다 덮지 못한다
    cloud, coverage = window_cloud(img)
    if coverage < MIN_COVERAGE:
        return None   # 창을 거의 안 찍은 장면은 관측으로 세지 않는다
    return {"granule": s["granule"], "tile_cloud": s["tile_cloud"], "window_cloud": cloud, "coverage": coverage}


def main():
    layers = json.loads((ROOT / "app/data/layers.json").read_text())["regions"]
    result = {"clear_pct": CLEAR, "method": __doc__.split("\n\n")[1].strip(), "regions": {}}
    with ThreadPoolExecutor(8) as pool:
        for region, meta in layers.items():
            ss = scenes(meta["corners"])
            by_date = {}   # 날짜마다 창 안이 가장 맑은 장면
            for s, r in zip(ss, pool.map(lambda s: measure(s, meta), ss)):
                if r and (s["date"] not in by_date or r["window_cloud"] < by_date[s["date"]]["window_cloud"]):
                    by_date[s["date"]] = r
            by_date = dict(sorted(by_date.items()))
            mon = {}
            for d, r in by_date.items():
                c, n = mon.get(d[:7], [0, 0])
                mon[d[:7]] = [c + (r["window_cloud"] <= CLEAR), n + 1]
            result["regions"][region] = {"dates": by_date, "monthly": mon}
            print(region, {m: f"{c}/{n}" for m, (c, n) in mon.items()})
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    print("->", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
