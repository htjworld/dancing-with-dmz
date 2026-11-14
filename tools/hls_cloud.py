"""DMZ 다섯 지역 중심점의 HLS v2.0(S30+L30) 장면 구름량을 NASA CMR에서 조회한다 -> data/hls_clouds.json

날짜마다 가장 맑은 장면 하나를 남긴다(구름량, granule id, 미리보기 영상 주소).
구름량은 HLS 타일(약 110 km) 단위 값이다. 맑음 = 20% 이하. 인증 불필요(메타데이터 검색).
월별 맑은 날 수와 NISAR 통과일 ±6일 안에 맑은 광학 영상이 있었는지도 출력한다.
사용: python3 tools/hls_cloud.py
"""
import collections
import datetime as dt
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "hls_clouds.json"
POINTS = {"paju": (126.70, 37.94), "yeoncheon": (126.97, 38.11), "cheorwon": (127.23, 38.30),
          "hwacheon": (127.72, 38.33), "yanggu": (128.13, 38.30)}
TEMPORAL = "2026-06-01T00:00:00Z,2026-11-14T00:00:00Z"
CLEAR = 20


def granules(short_name, lon, lat):
    out, page = [], 1
    while True:
        url = (f"https://cmr.earthdata.nasa.gov/search/granules.umm_json?short_name={short_name}&version=2.0"
               f"&point={lon},{lat}&temporal={TEMPORAL}&page_size=2000&page_num={page}")
        items = json.load(urllib.request.urlopen(url, timeout=60)).get("items", [])
        for it in items:
            m = it["umm"]
            cc = m.get("CloudCover")
            if cc is None:
                cc = next((float(a["Values"][0]) for a in m.get("AdditionalAttributes", []) if a["Name"] == "CLOUD_COVERAGE"), None)
            browse = next((u["URL"] for u in m.get("RelatedUrls", [])
                           if u.get("Type") == "GET RELATED VISUALIZATION" and u["URL"].startswith("https")), None)
            if cc is not None:
                out.append({"date": m["TemporalExtent"]["RangeDateTime"]["BeginningDateTime"][:10],
                            "cloud": float(cc), "granule": m["GranuleUR"], "browse": browse})
        if len(items) < 2000:
            return out
        page += 1


def clearest_by_date(gs):
    best = {}
    for g in gs:
        if g["date"] not in best or g["cloud"] < best[g["date"]]["cloud"]:
            best[g["date"]] = g
    return dict(sorted(best.items()))


def monthly(by_date):
    mon = collections.defaultdict(lambda: [0, 0])
    for d, g in by_date.items():
        mon[d[:7]][0] += g["cloud"] <= CLEAR
        mon[d[:7]][1] += 1
    return dict(sorted(mon.items()))


def clear_near(by_date, day, days=6):
    p = dt.date.fromisoformat(day)
    return any(g["cloud"] <= CLEAR and abs((dt.date.fromisoformat(d) - p).days) <= days for d, g in by_date.items())


def main():
    passes = [p["date"] for p in json.loads((ROOT / "app/data/regions.json").read_text())["passes"]]
    result = {"clear_pct": CLEAR, "temporal": TEMPORAL, "regions": {}}
    for name, (lon, lat) in POINTS.items():
        by_date = clearest_by_date(granules("HLSS30", lon, lat) + granules("HLSL30", lon, lat))
        result["regions"][name] = {"point": [lon, lat], "dates": by_date, "monthly": monthly(by_date),
                                   "pass_clear": {p: clear_near(by_date, p) for p in passes}}
        print(name, {m: f"{c}/{n}" for m, (c, n) in result["regions"][name]["monthly"].items()})
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    print("->", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
