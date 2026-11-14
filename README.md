# Dancing with DMZ

### ▶ [Open the app — htjworld.github.io/dancing-with-dmz](https://htjworld.github.io/dancing-with-dmz/)

No login needed. Deployed automatically by GitHub Actions on every push to `main`.

NASA Space Apps Challenge 2026 · Challenge: **Dancing with the SARs** · Team: Seoul

## What it is

A radar "night photo" of the Korean Demilitarized Zone. Nobody has walked into the DMZ for over 70 years, and in July 2026 optical satellites could not see it either: across five DMZ windows, Landsat looked 19 times and never saw a clear view. NISAR's L-band radar saw the land every 12 days. We turn 11 NISAR passes (June to November 2026) into one image of **how much each pixel changed over the season**. Farmed fields on both sides of the demarcation line glow; the strip between them stays dark.

- **Opening:** rub away a cloudy July optical image to reveal the radar image underneath.
- **Night photo:** play the season and watch the fields light up pass by pass.
- **Land play:** sweep the map to hear the change; still land is silent.
- **Evidence panel:** forest-relative curves, change ranges, land cover, and the limits, for each region. The five original missions remain as "check it yourself".
- Korean / English.

## How it works

No server. A Python pipeline prepares everything, and a static web app draws it in the browser.

```
NISAR L2 GCOV (ASF, ~6 GB per scene) → read only the needed pixels with HTTP range requests (tools/extract_nisar.py)
→ forest-relative seasonal change per pixel (tools/make_glow.py)
+ cloud inside each window from Landsat HLS browse images (tools/hls_window.py)
+ land cover check with ESA WorldCover 2021 (tools/landcover.py) + NASA POWER rain (tools/fetch_rain.py)
→ every number on screen comes from app/data/facts.json (tools/make_facts.py), with asserts that stop the build if a claim breaks
→ static site (app/), tested and deployed by GitHub Actions on every push to main
```

## Key numbers (from `app/data/facts.json`)

| | |
|---|---|
| July 2026 clear optical views (5 windows, Landsat) | 0 of 19 |
| Seasonal change, forest-relative, Cheorwon | paddy 2.1 dB · inside DMZ 0.7 dB · north of the line 2.0 dB |
| Seasonal change, Paju (both inside the DMZ) | farmed 2.1 dB · unfarmed 0.6 dB |
| Cropland share (ESA WorldCover 2021), Cheorwon | paddy 78.7% · inside DMZ 0.6% · north 82.9% |

## Data

| Data | Use | License / terms |
|---|---|---|
| NISAR L2 GCOV (NASA/ISRO), via ASF DAAC — track 133, frame 069, HH/HV, 2026-06-23 to 11-02 | Seasonal change, layers, missions | NASA open data |
| HLS L30/S30 v2.0 (NASA LP DAAC), CMR metadata and browse images | Cloud over each window, opening image | NASA open data |
| NASA POWER daily precipitation | Rain before each pass | NASA open data |
| ESA WorldCover 2021 v200 | Land cover check of each zone | CC BY 4.0 |
| OpenStreetMap (demarcation line), OpenFreeMap (base map) | Map | ODbL |

## Limits

- Glow is the size of the radar signal change, not an ecological or crop judgment.
- 10 of the 11 passes are PROVISIONAL products; the glow map is currently built from the app's display layers (coarser than the 30 m source).
- On 8/22 every zone brightened after 39 mm of rain; on 10/21 every zone brightened with almost no rain, and we do not know why.
- One season only; zones are rectangles chosen on the radar image (checked against WorldCover 2021).
- North of the line is described only as "appears to be farmland".

## Run locally

```bash
python -m http.server 5173 --directory app   # then open http://localhost:5173
npm test                                      # logic and data checks (node --test)
```

## Use of AI tools

This project was built with AI coding assistants: **Claude (Anthropic) through Claude Code** for code, data-processing scripts, tests and documents, and **OpenAI Codex** for reviewing brainstorming notes. Team members directed the work, reviewed and ran every script, and checked results against the data; AI-generated code is covered by the tests in `app/tests` and the asserts in `tools/`. No AI-generated images, audio or video are used.

---

## 한국어

사람이 70년 넘게 들어가지 못한 땅, 한반도 비무장지대(DMZ). 레이더 위성 NISAR는 구름과 밤을 가리지 않고 이 땅을 12일마다 다시 본다. 이 서비스는 2026년 6~11월 11번의 NISAR 관측으로 **화소마다 한 계절 동안 얼마나 변했는지**를 빛으로 그린다. 분계선 양쪽의 농사짓는 들판은 빛나고, 그 사이 DMZ 띠는 어둡게 멈춰 있다. 기존 다섯 지역 미션은 "직접 확인하기"로 남아 있다.

## 실행

```bash
python -m http.server 5173 --directory app
```

## 데이터 다시 만들기

```bash
pip install -r requirements.txt
python tools/extract_nisar.py --list        # 사용하는 NISAR 장면 목록
python tools/extract_nisar.py --workers 4   # 다섯 지역 창을 원격으로 읽어 data/cache 에 저장
python tools/preview_regions.py             # 구역을 고르기 위한 미리보기 그림(data/cache/_preview)
python tools/make_regions.py                # tools/zones.py 의 구역별 시계열 -> app/data/regions.json
python tools/make_layers.py                 # 지도에 올릴 흑백 레이더 영상 -> app/data/layers/
python tools/make_river.py                  # 연천 강 위의 점과 날짜별 어두운 비율 -> app/data/river.json
python tools/fetch_rain.py                  # NASA POWER 강수 -> app/data/rain.json
python tools/make_dmz.py                    # OpenStreetMap 군사분계선 -> app/data/dmz.geojson
python tools/make_glow.py                   # 계절 변동 지도(숲 대비) -> app/data/glow/, glow.json
python tools/hls_cloud.py                   # HLS 광학 구름량(NASA CMR) -> data/hls_clouds.json
python tools/hls_window.py                  # 다섯 지역 창 안 구름(Landsat 미리보기) -> data/hls_window.json
python tools/landcover.py                   # 구역 토지피복(ESA WorldCover 2021) -> app/data/landcover.json
python tools/make_facts.py                  # 화면·발표 공통 숫자 -> app/data/facts.json
python tools/make_opening.py                # 7월 철원 HLS 광학(구름) + 같은 달 NISAR -> app/data/opening/, opening.json
```

Earthdata Login 토큰을 `.env` 의 `EARTHDATA_TOKEN` 에 넣어야 한다(`.env.example` 참고). `.env` 는 저장소에 올리지 않는다.

## 데이터와 출처

- NISAR L2 GCOV (NASA/ISRO), ASF DAAC 제공. 궤도 133(하강)·프레임 069, HH/HV 후방산란.
- 2026-06-23 ~ 11-02 의 11개 통과(7월 29일 통과는 자료가 없다). 11월 2일 장면만 정식판(V1) 컬렉션이고 나머지는 PROVISIONAL 이다. 처리 버전이 달라 값의 기준이 조금 다를 수 있다.
- 강수: NASA POWER 일 강수량(PRECTOTCORR). 약 50 km 격자라 파주와 연천은 같은 값이다.
- 군사분계선: © OpenStreetMap contributors (ODbL). 표시용 개략 기하다.
- 배경 지도: OpenFreeMap, © OpenStreetMap contributors.

## 해석의 한계

- 레이더 신호 변화의 원인은 "가능한 설명"으로만 적는다. 홍수·수확·생태 상태를 확정하지 않는다.
- 선의 춤은 후방산란 값의 변화를 그린 것이며, 땅이 실제로 움직인 것(지표 변위)이 아니다.
- 구역은 팀이 영상에서 고른 사각형이다. ESA WorldCover 2021로 토지피복을 대조했다(`app/data/landcover.json`, 2021년 지도).
