"""화면과 발표가 같이 쓰는 숫자 -> app/data/facts.json

숫자는 모두 여기서 계산한다. 화면이나 슬라이드에 숫자를 손으로 적지 않는다.
입력: app/data/regions.json, data/hls_clouds.json(tools/hls_cloud.py), data/hls_window.json(tools/hls_window.py)
사용: python3 tools/make_facts.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGIONS = json.loads((ROOT / "app/data/regions.json").read_text())
CLOUDS = json.loads((ROOT / "data/hls_clouds.json").read_text())
WINDOW = json.loads((ROOT / "data/hls_window.json").read_text())


def zone(zid):
    return next(z for z in REGIONS["zones"] if z["id"] == zid)


def forest_range(zid):
    """숲 대비 HH 계절 변동 폭(최대 - 최소, dB). 같은 통과에서 숲 구역 값을 빼 장면 전체의 공통 변화를 없앤다."""
    z = zone(zid)
    ref = next(r for r in REGIONS["zones"] if r["region"] == z["region"] and r["role"] == "ref")
    rel = [o["hh_db"] - f["hh_db"] for o, f in zip(z["observations"], ref["observations"])
           if o["hh_db"] is not None and f["hh_db"] is not None]
    return round(max(rel) - min(rel), 1)


def clear_days(region, months, src=WINDOW):
    """[맑은 관측, 전체 관측]. 기본은 창 안 구름(hls_window), src=CLOUDS 면 타일 구름(hls_cloud)"""
    mon = src["regions"][region]["monthly"]
    return sum(mon.get(m, [0, 0])[0] for m in months), sum(mon.get(m, [0, 0])[1] for m in months)


def main():
    rel = "숲 대비 HH 계절 변동 폭"
    src_r, src_c = "app/data/regions.json", "data/hls_window.json (tools/hls_window.py)"
    july = [clear_days(r, ["2026-07"]) for r in WINDOW["regions"]]
    july_tile = [clear_days(r, ["2026-07"], CLOUDS) for r in CLOUDS["regions"]]
    cw_july = [v["window_cloud"] for d, v in WINDOW["regions"]["cheorwon"]["dates"].items() if d.startswith("2026-07")]
    passes = REGIONS["passes"]
    valid = [p for p in passes if not p.get("rest")]
    provisional = [p for p in valid if "PROVISIONAL" in p.get("collection", "")]
    f = lambda v, unit, note, src: {"value": v, "unit": unit, "note": note, "source": src}
    facts = {
        "july_clear_optical": f(sum(c for c, _ in july), "장", f"2026년 7월, 다섯 지역 창 안이 맑았던(구름 {WINDOW['clear_pct']}% 이하) Landsat(HLS L30) 관측 수. 타일 구름량으로 세도 {sum(c for c, _ in july_tile)}", src_c),
        "july_optical_looks": f(sum(n for _, n in july), "번", "2026년 7월, 다섯 지역 창을 찍은 Landsat(HLS L30) 관측 수(지역별 합)", src_c),
        "july_regions": f(len(july), "곳", "7월 구름을 센 지역 수", src_c),
        "cheorwon_july_min_cloud": f(round(min(cw_july)), "%", "2026년 7월 철원 창 안 구름 비율이 가장 낮았던 날의 값(밝은 무채색 화소 비율, 옅은 구름은 못 셈)", src_c),
        "cheorwon_paddy_db": f(forest_range("cheorwon-paddy"), "dB", f"철원 민통선 논, {rel}", src_r),
        "cheorwon_dmz_db": f(forest_range("cheorwon-dmz"), "dB", f"철원 DMZ 안 저지대, {rel}", src_r),
        "cheorwon_north_db": f(forest_range("cheorwon-north"), "dB", f"철원 분계선 북쪽 경작지로 보이는 곳, {rel}", src_r),
        "paju_dmz_farm_db": f(forest_range("paju-dmz_farm"), "dB", f"파주 DMZ 안 경작지, {rel}", src_r),
        "paju_dmz_wild_db": f(forest_range("paju-dmz_wild"), "dB", f"파주 DMZ 안 미경작지, {rel}", src_r),
        "paju_north_db": f(forest_range("paju-north_farm"), "dB", f"파주 분계선 서쪽 경작지로 보이는 곳, {rel}", src_r),
        "passes": f(len(valid), "회", f"NISAR 통과 {len(passes)}번 중 자료가 있는 것", src_r),
        "passes_total": f(len(passes), "회", "2026-06-23 ~ 11-02, 12일 간격", src_r),
        "passes_provisional": f(len(provisional), "회", "PROVISIONAL 컬렉션에서 온 통과", src_r),
    }
    # 이야기의 핵심 주장이 자료와 맞는지 확인한다. 틀리면 문구를 바꿔야 한다.
    assert facts["july_clear_optical"]["value"] == 0, "7월 맑은 광학 0장 주장이 깨졌다"
    assert facts["july_optical_looks"]["value"] > 0, "7월 관측이 하나도 없으면 0장이라는 말이 무의미하다"
    assert facts["cheorwon_paddy_db"]["value"] > 2 * facts["cheorwon_dmz_db"]["value"], "철원: 논이 DMZ 안보다 크게 변한다는 주장이 깨졌다"
    assert facts["paju_dmz_farm_db"]["value"] > 2 * facts["paju_dmz_wild_db"]["value"], "파주: DMZ 안 경작지가 미경작지보다 크게 변한다는 주장이 깨졌다"
    out = ROOT / "app/data/facts.json"
    out.write_text(json.dumps(facts, ensure_ascii=False, indent=1), encoding="utf-8")
    for k, v in facts.items():
        print(f"{k:24s} {v['value']} {v['unit']}")


if __name__ == "__main__":
    main()
