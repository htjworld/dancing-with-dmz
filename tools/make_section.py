"""밤하늘 둘러보기의 남북 단면 자료 -> app/data/section.json (hdk, 2026-11-15)

연속 관측 띠(corridor.json 의 value 영상, 한 계절 변동 폭)의 화소마다
  - 분계선까지의 거리(km, 북쪽 +, 남쪽 -)와
  - 분계선을 따라 서쪽 끝에서 잰 위치(km)
를 재고, (위치 5 km) x (거리 2 km) 칸마다 화소 수와 '크게 흔들린 화소' 수를 센다.
'크게 흔들린'은 띠 전체 값의 상위 20%(80 백분위) 이상이다. 기준값은 이 스크립트가 계산해 함께 적는다.
동해 바다 위 화소는 뺀다(nightglow.js 의 해안선과 같은 점). 값은 바꾸지 않고 세기만 한다.
분계선은 dmz.geojson 의 LineString 을 앱(nightglow.js lineKm)과 같은 간격으로 솎아 쓴다.
예외 한 곳(대성동 마을, DMZ 안에서 벼농사를 짓는 마을)의 주변 비율도 함께 적는다.
  마을 위치: 파주시 의뢰 2014년 대성동마을 조사보고서 '표 1. 대성동마을 개요'(37°56'28.03" N, 126°40'44.92" E).
  행정구역: 파주시 군내면 조산리. 벼농사: 같은 보고서 4-1절, 경기도 DMZ 안내(dmz.gg.go.kr).
  비율은 '마을 표식 반경 R_KM 안 x 지도상 분계선 ±2 km 띠'의 표본 화소 중 기준 이상인 몫이다(마을 면적·논 비율이 아니다).
  견줄 값은 같은 서쪽 구간(선의 서쪽 끝부터 WEST_KM, 마을 주변 제외)이다. WEST_KM 은 팀이 정한 비교 구간이며 행정 경계가 아니다.
사용: python tools/make_section.py
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "app" / "data"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else DATA / "section.json"
ALONG_KM, DIST_KM, SUB = 5, 2, 2   # 위치 칸, 거리 칸, 화소 솎기(2 = 60 m 간격)
COAST = [[38.06,128.684],[38.08,128.68],[38.10,128.654],[38.12,128.634],[38.14,128.618],[38.16,128.61],[38.18,128.614],[38.20,128.598],[38.22,128.596],[38.24,128.578],[38.26,128.562],[38.28,128.554],[38.30,128.55],[38.32,128.532],[38.34,128.52],[38.36,128.51],[38.38,128.506],[38.40,128.482],[38.42,128.468],[38.44,128.456],[38.46,128.458],[38.48,128.442],[38.50,128.428],[38.52,128.42],[38.54,128.409],[38.56,128.405],[38.58,128.385],[38.60,128.369],[38.62,128.359],[38.64,128.363],[38.66,128.339],[38.68,128.361],[38.70,128.331],[38.71,128.323],[38.72,128.205],[38.74,128.199],[38.76,128.181],[38.78,128.161],[38.80,128.135],[38.82,128.123],[38.84,128.091],[38.86,128.005]]

cor = json.loads((DATA / "corridor.json").read_text(encoding="utf-8"))
bnd = json.loads((DATA / "dmz.geojson").read_text(encoding="utf-8"))
c = next(f for f in bnd["features"] if f["geometry"]["type"] == "LineString")["geometry"]["coordinates"]
step = max(1, len(c) // 500)
P = np.array([p for i, p in enumerate(c) if i % step == 0 or i == len(c) - 1])
lo, hi = cor["scale_db"]
H = cor["half_width_km"]

my = lambda lat: np.log(np.tan(np.pi / 4 + np.radians(lat) / 2))
il = lambda y: np.degrees(2 * np.arctan(np.exp(y)) - np.pi / 2)
lons, lats, vals = [], [], []
for r in cor["regions"].values():
    a = np.asarray(Image.open(DATA / r["value"]).convert("RGBA"))[::SUB, ::SUB]
    (x0, y0), (x1, _), _, (_, y3) = r["corners"]
    h, w = a.shape[:2]
    fx = (np.arange(w) * SUB + SUB / 2) / (w * SUB); fy = (np.arange(h) * SUB + SUB / 2) / (h * SUB)
    px, py = np.meshgrid(fx, fy)
    lon = x0 + px * (x1 - x0); lat = il(my(y0) + py * (my(y3) - my(y0)))   # 영상은 Web Mercator 격자
    m = a[..., 3] > 0
    lons.append(lon[m]); lats.append(lat[m]); vals.append(lo + a[..., 0][m] / 255 * (hi - lo))
# 표본 간격(지상 m): 표시 영상 한 칸(Web Mercator 80 m, 이 위도에서 지상 약 63 m) x SUB
_r = next(iter(cor["regions"].values())); _w = _r["size"][0]
PX_M = round((_r["corners"][1][0] - _r["corners"][0][0]) / _w * 111320 * np.cos(np.radians(38.3)) * SUB)
lon, lat, v = np.concatenate(lons), np.concatenate(lats), np.concatenate(vals)
cl = np.array(COAST)
coast = np.interp(lat, cl[:, 0], cl[:, 1], left=np.inf, right=np.inf)
keep = lon <= coast
lon, lat, v = lon[keep], lat[keep], v[keep]
strong = float(np.percentile(v, 80))

kx = 111.32 * np.cos(np.radians(lat)); ky = 110.57
seglen = [0.0]
for i in range(1, len(P)):
    k = 111.32 * np.cos(np.radians((P[i][1] + P[i - 1][1]) / 2))
    seglen.append(seglen[-1] + float(np.hypot((P[i][0] - P[i - 1][0]) * k, (P[i][1] - P[i - 1][1]) * ky)))
best = np.full(lon.size, np.inf); sgn = np.zeros(lon.size); along = np.zeros(lon.size)
for i in range(1, len(P)):
    ax = (P[i - 1][0] - lon) * kx; ay = (P[i - 1][1] - lat) * ky; bx = (P[i][0] - lon) * kx; by = (P[i][1] - lat) * ky
    dx, dy = bx - ax, by - ay
    t = np.clip(-(ax * dx + ay * dy) / (dx * dx + dy * dy + 1e-12), 0, 1)
    ex, ey = ax + dx * t, ay + dy * t; dd = ex * ex + ey * ey
    u = dd < best
    best[u] = dd[u]
    sgn[u] = np.where(dx * (-ay) - dy * (-ax) > 0, 1, -1)[u]   # 선은 서 -> 동, 진행 방향 왼쪽이 북쪽
    along[u] = (seglen[i - 1] + t * (seglen[i] - seglen[i - 1]))[u]
dist = np.sqrt(best) * sgn

na, nd = int(np.ceil(seglen[-1] / ALONG_KM)), int(2 * np.ceil(H / DIST_KM))
ia = np.clip((along // ALONG_KM).astype(int), 0, na - 1)
idd = np.floor((dist + nd / 2 * DIST_KM) / DIST_KM).astype(int)
ok = (idd >= 0) & (idd < nd)
total = np.zeros((na, nd), int); hit = np.zeros((na, nd), int)
np.add.at(total, (ia[ok], idd[ok]), 1)
np.add.at(hit, (ia[ok], idd[ok]), (v[ok] >= strong).astype(int))

# 예외: 대성동 마을 반경 R_KM 안(분계선 2 km 띠 안)과, 견줄 띠(파주 서쪽 끝 35 km / 그 밖)
VIL, R_KM, WEST_KM = (126.679144, 37.941118), 1.5, 35
dv = np.hypot((lon - VIL[0]) * 111.32 * np.cos(np.radians(VIL[1])), (lat - VIL[1]) * ky)
strip = np.abs(dist) < 2
share = lambda m: round(float((v[m] >= strong).mean()), 3)
j = int(np.argmin(dv))
places = [{
    "id": "daeseong", "lonlat": list(VIL), "line_km": round(float(dist[j]), 2), "r_km": R_KM, "west_km": WEST_KM,
    "share": share(strip & (dv < R_KM)),
    "west_share": share(strip & (along < WEST_KM) & (dv >= R_KM)),
    "rest_share": share(strip & (along >= WEST_KM)),
    "sources": ["https://ggcf.kr/attachment/8614/download", "https://dmz.gg.go.kr/all-about-the-dmz/human-environment-of-the-dmz"],
}]

# 지역마다 한 곳씩 더(jmj, 2026-11-15): 연천·철원·화천·양구. 좌표는 OpenStreetMap(Nominatim 검색, 2026-11-15)의 그 대상 위치다.
# 대성동과 달리 분계선 2 km 띠 밖이라, '표식 반경 R_KM 안'의 몫을 '그 바깥 AROUND_KM 고리'의 몫과 견준다(둘 다 기준 이상 화소의 비율, 값은 바꾸지 않는다).
# 무엇이 있는 곳인지는 이름뿐이고, 왜 변했는지는 이 자료로 알 수 없다(화면의 한계 문구와 같다).
AROUND_KM = (3, 12)
MORE = [   # id, 경도, 위도, OpenStreetMap 대상
    ("pilseung", 126.9608929, 38.1111185, "way/128946971"),    # 필승교(임진강)
    ("sapseul", 127.2382800, 38.2855500, "node/10253017899"),  # 삽슬봉(철원평야 가운데의 낮은 봉우리)
    ("peacedam", 127.8463418, 38.2101489, "way/200227266"),    # 평화의 댐
    ("punchbowl", 128.1350583, 38.2837717, "relation/14361839"),  # 양구군 해안면(해안분지, 펀치볼)
    ("hwajinpo", 128.4366268, 38.4685331, "way/37221087"),       # 화진포호(고성)
]
for pid, plon, plat, osm in MORE:
    d = np.hypot((lon - plon) * 111.32 * np.cos(np.radians(plat)), (lat - plat) * ky)
    k = int(np.argmin(d))
    places.append({
        "id": pid, "lonlat": [plon, plat], "line_km": round(float(dist[k]), 2), "r_km": R_KM, "around_km": list(AROUND_KM),
        "share": share(d < R_KM), "around_share": share((d >= AROUND_KM[0]) & (d < AROUND_KM[1])),
        "sources": [f"https://www.openstreetmap.org/{osm}"],
    })

out = {
    "about": "Pixel counts of the corridor seasonal-swing value image, binned by position along the demarcation line and signed distance from it (north +). 'strong' = at or above the corridor's 80th percentile. East Sea pixels excluded. Counts only; values unchanged.",
    "source": "corridor.json value images (NISAR GCOV HH seasonal variability, khs); line from dmz.geojson (approximate, OpenStreetMap)",
    "strong_db": round(strong, 3), "along_km": ALONG_KM, "dist_km": DIST_KM, "dist_from_km": -nd / 2 * DIST_KM,
    "line_km": round(seglen[-1], 2), "pixel_step_m": PX_M,
    "places": places,
    "total": total.tolist(), "strong": hit.tolist(),
}
OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
print(places)
print(f"{OUT.name}: {na} x {nd} cells, strong >= {strong:.2f} dB, line {seglen[-1]:.0f} km, {lon.size} px")
