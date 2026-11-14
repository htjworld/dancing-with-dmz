# Dancing with DMZ

NASA Space Apps Challenge 2026 · 챌린지 **Dancing with the SARs**

사람이 70년 넘게 들어가지 못한 땅, 한반도 비무장지대(DMZ). 레이더 위성 NISAR는 구름과 밤을 가리지 않고 이 땅을 12일마다 다시 본다. 이 서비스는 다섯 지역의 레이더 미션을 풀며 땅의 리듬을 모으고, 다섯 조각이 이어지면 DMZ 선이 실측 자료에 맞춰 춤추는 것을 보여 준다.

> 작업 중입니다. 대회 기간(2026-11-14 ~ 11-15)에 이 저장소에서 처음부터 만듭니다.

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
python tools/fetch_rain.py                  # NASA POWER 강수 -> app/data/rain.json
python tools/make_dmz.py                    # OpenStreetMap 군사분계선 -> app/data/dmz.geojson
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
- 구역은 팀이 영상에서 고른 사각형이며, 토지피복이나 행정 경계를 독립적으로 검증한 것이 아니다.
