# 구현 계획 — 레이더로 찍은 DMZ의 한 계절

기준: `brainstorming/decision_jmj.md`(jmj 초안, hdk·khs 확인 전. 팀 최종본은 `brainstorming/decision.md`). 결정이 바뀌면 이 문서를 먼저 고친다.
마감: 11/15 23:59(hdk 확인, 기준 시간대는 운영진에게 재확인). 데모는 영상 30초 이내 또는 슬라이드 7장 이내, 영어.

두 사람이 각자 AI 세션을 돌려 동시에 작업한다. 서로 막히지 않도록 **파일 소유권, 데이터 계약, git 순서** 세 가지를 지킨다.

| 이니셜 | 맡는 것 |
|---|---|
| **htj** (한태진) | 로직·데이터: `tools/`(Python), 데이터 파일(`app/data/`), 계산 모듈(JS), 테스트 |
| **jmj** (장민준) | 프론트: 화면 구성, 지도 그리기, 상호작용, 한·영 문구, 데모 영상·슬라이드 |

## 0. 만들 것 (체험 흐름)

1. **구름 문지르기 (오프닝)**: 2026년 7월 철원 광학 영상(구름뿐)을 띄운다. 문지르면 같은 시기의 NISAR 레이더 영상이 드러난다. 옆에 "7월, 다섯 지역 모두 맑은 광학 영상 0장"을 띄운다.
2. **밤사진 켜기**: 지도에 계절 변동 지도를 올린다. 6월부터 11월까지 통과가 쌓일수록 들판이 점점 빛나고, 아리랑 반주에 맞춰 재생된다. 분계선은 흰 선으로 표시한다.
3. **땅 연주**: 지도를 쓸면 그 자리의 변동 폭이 소리가 된다. 많이 변한 땅은 크게 울리고, 고요한 땅에서는 소리가 끊긴다.
4. **확대해서 확인**: 지역을 누르면 근거 패널이 열린다. 남쪽 논, DMZ 안, 북쪽 경작지의 숲 대비 계절 곡선, 변동 폭 숫자, 한계 문구가 나온다. 기존 다섯 미션은 "직접 확인하기"로 남긴다.
5. **한·영 전환**: 모든 화면 문구를 한국어와 영어로 제공한다.

## 1. 파일 소유권

**자기 소유 파일만 고친다.** 남의 파일을 고쳐야 하면 5절 요청 보드에 한 줄 적고, 소유자가 고친다.
급하면 같이 고쳐도 되지만, 그때는 커밋 메시지에 `(owner: jmj 확인)`처럼 남긴다.

| 경로 | 소유 | 비고 |
|---|---|---|
| `tools/**` | htj | |
| `app/data/**` | htj | 생성물. 손으로 고치지 않고 `tools/`로 다시 만든다 |
| `app/js/calc.js`, `missions.js`, `rhythm.js`, `music.js`, `sound.js` | htj | 계산·소리 로직 |
| `app/js/glow.js`, `landsound.js`, `evidence.js` (신규) | htj | 3절 API |
| `app/js/state.js`의 `data`, `load()`, 데이터 조회 함수 | htj | |
| `app/js/state.js`의 `state` 객체(화면 상태 필드) | jmj | 같은 파일이지만 다른 덩어리다. rebase로 대부분 자동 병합된다 |
| `app/tests/**` | htj | jmj가 테스트를 추가해도 된다(새 파일로) |
| `app/index.html`, `app/style.css` | jmj | |
| `app/js/main.js`, `map.js`, `dance.js`, `stops.js`, `views/**` | jmj | |
| `app/js/screens/**`, `app/js/i18n.js` (신규) | jmj | 화면 모듈, 한·영 문구 |
| `demo/**` (신규) | jmj | 영상·슬라이드 자료 |
| `plan.md`, `CLAUDE.md` | 공동 | 고친 사람이 바로 푸시 |

## 2. 데이터 계약 (htj가 만들고 jmj가 읽는다)

모든 좌표는 경위도(EPSG:4326)다. `corners`는 `layers.json`과 같은 순서 `[좌상, 우상, 우하, 좌하]`다.

### 2-1. `app/data/glow.json` + `app/data/glow/*.webp` — 계절 변동 지도

```json
{
  "metric": "숲 대비 HH 계절 변동 폭(표준편차, dB)",
  "scale_db": [0, 2.5],
  "source": "layers",
  "dates": ["2026-06-23", "2026-07-05", "..."],
  "regions": {
    "cheorwon": {
      "corners": [[127.1, 38.4], [127.5, 38.4], [127.5, 38.1], [127.1, 38.1]],
      "size": [1184, 1019],
      "value": "glow/cheorwon_value.webp",
      "color": "glow/cheorwon_color.webp",
      "frames": ["glow/cheorwon_f01.webp", "..."]
    }
  }
}
```

- `value`: 회색 영상. 빨강 채널 0~255가 `scale_db` 범위로 선형 대응한다. 알파 0은 자료 없음이다. **땅 연주와 숫자 표시는 이 영상에서 읽는다.**
- `color`: 기본 색을 입힌 표시용 영상(어두운 남색 → 주황 → 노랑). 프론트가 색을 바꾸고 싶으면 `value`로 직접 칠한다.
- `frames[k]`: 첫 통과부터 k+2번째 유효 통과까지 누적한 변동 폭을 칠한 표시용 영상. 밤사진 켜기 애니메이션에 쓴다. 마지막 프레임은 `color`와 같다.
- `dates`: 유효 통과 날짜. 7/29 결측은 빠진다.
- `source`: `"layers"`(앱 흑백 영상에서 만든 거친 판) 또는 `"cache"`(원자료 판). 화면에서는 구분하지 않아도 된다.

### 2-2. `app/data/opening.json` + `app/data/opening/*` — 구름 문지르기

```json
{
  "region": "cheorwon",
  "optical": { "date": "2026-07-xx", "cloud_pct": 97, "file": "opening/hls_cheorwon.jpg", "corners": [] },
  "radar":   { "date": "2026-07-17", "file": "opening/nisar_cheorwon.webp", "corners": [] },
  "clouds": {
    "cheorwon": { "2026-06": [2, 7], "2026-07": [0, 3], "2026-08": [0, 7], "2026-09": [0, 10], "2026-10": [7, 10] }
  }
}
```

- `clouds[지역][월] = [맑은 날, 관측일]`. 맑음은 구름 20% 이하. 값은 `tools/hls_cloud.py` 결과와 같다.
- 두 영상은 같은 `corners`에 맞춘다(지도 위에 겹쳐 놓고 위 영상을 지운다).

### 2-3. `app/data/facts.json` — 화면과 발표가 같이 쓰는 숫자

```json
{
  "july_clear_optical": { "value": 0, "unit": "장", "note": "2026년 7월, 다섯 지역 모두", "source": "tools/hls_cloud.py" },
  "cheorwon_paddy_db":  { "value": 2.1, "unit": "dB", "note": "숲 대비 HH 계절 변동 폭", "source": "app/data/regions.json" },
  "cheorwon_dmz_db":    { "value": 0.7, "unit": "dB", "note": "", "source": "" },
  "paju_dmz_farm_db":   { "value": 2.1, "unit": "dB", "note": "", "source": "" },
  "paju_dmz_wild_db":   { "value": 0.6, "unit": "dB", "note": "", "source": "" },
  "passes":             { "value": 11, "unit": "회", "note": "12번 중 7/29 결측", "source": "app/data/regions.json" }
}
```

- **화면과 슬라이드의 숫자는 여기서만 가져온다.** 손으로 숫자를 적지 않는다.
- 발표 숫자는 숲 대비 값만 쓴다(`decision_jmj.md` 초안). 원본 값(3.4 dB 대 1.6 dB)은 쓰지 않는다.

### 2-4. 한계 문구 키 (로직은 키를 주고, 문구는 프론트가 한·영으로 쓴다)

| 키 | 뜻 |
|---|---|
| `signal_not_cause` | 빛남은 레이더 신호 변화이지 생태·작황 판정이 아니다 |
| `provisional` | 11번 중 10번은 PROVISIONAL 자료라 기준이 조금 다를 수 있다 |
| `zone_unverified` | 구역은 영상에서 고른 사각형이고 토지피복 검증이 없다 |
| `forest_relative` | 숲 구역을 기준으로 장면 전체가 함께 변한 몫을 뺐다 |
| `cloud_tile` | 구름량은 HLS 타일(약 110 km) 단위 값이다 |
| `north_wording` | 북쪽 땅은 "경작지로 보이는 곳"으로만 부른다 |
| `missing_pass` | 7/29 통과는 자료가 없다 |

## 3. 로직 API (htj가 만들고 jmj가 부른다)

모두 ES 모듈이고, 계산 함수는 DOM 없이 node 테스트가 된다.

```js
// app/js/glow.js
export function pixelOf(corners, size, lng, lat)      // → [x, y] | null (영상 밖)
export function sampleDb(imageData, x, y, scaleDb)    // → dB | null (알파 0)
export function frameAt(progress, nFrames)            // progress 0~1 → 프레임 번호

// app/js/landsound.js
export function noteFor(db, scaleDb)                  // → { freq, gain } | null(쉼). 순수 함수
export function touch(db, scaleDb)                    // noteFor 결과를 sound.js로 짧게 울린다. 소리 꺼짐이면 무시

// app/js/evidence.js
export function evidence(zones, regionId)
// → { dates: [...],
//     lines: [{ zoneId, name, role, values: [dB | null] }],   // 숲 대비 HH, 결측은 null
//     ranges: { [zoneId]: dB },                                // 계절 변동 폭(최대 - 최소)
//     excluded: [cycle],                                       // 모든 구역이 함께 변한 통과
//     caveats: ['forest_relative', 'provisional', ...] }       // 2-4 키
```

`state.js`의 `load()`는 htj가 `glow.json`, `opening.json`, `facts.json`을 함께 읽도록 늘린다. 결과는 `data.glow`, `data.opening`, `data.facts`에 담긴다.

## 4. 작업 목록

### htj (로직·데이터)

| ID | 작업 | 완료 기준 | 막는 것 |
|---|---|---|---|
| **H1** | 계약대로 **스텁 데이터** 먼저 푸시: 시제품 변동 지도를 `glow.json` 형식으로, `opening.json`(임시 영상), `facts.json`, `state.js` 로딩 | jmj가 실제 파일 경로로 화면 작업을 시작할 수 있다 | J2, J3, J4 |
| **H2** | `tools/make_glow.py`: 숲 대비 변동 폭 `value`·`color`·`frames` 생성(앱 영상판). 원자료 캐시가 생기면 `--source cache` | 다섯 지역 영상 생성, 철원 그림이 시제품과 같은 결론, 스크립트 안 assert 검사 통과 | J3 |
| **H3** | `tools/make_opening.py`: 7월 철원에서 가장 흐린 HLS 장면과 같은 시기 NISAR를 같은 범위로 잘라 저장, `clouds` 집계 포함 | 두 영상이 지도에서 겹친다 | J2 |
| **H4** | `glow.js`, `landsound.js` + 테스트 | `npm test` 통과, 경계값(알파 0, 범위 밖) 테스트 포함 | J4 |
| **H5** | `evidence.js` + 테스트(`calc.forestChange`, `togetherDays` 재사용) | 철원·파주 숫자가 `facts.json`과 같다 | J5 |
| **H6** | `facts.json`을 스크립트로 생성(`tools/make_facts.py`) | 숫자가 `regions.json`·HLS 집계에서 자동으로 나온다 | J7 |
| H7 (여유) | 상승 궤도 125 또는 더 긴 띠 추가(khs와) | `glow.json`에 지역이 늘어도 프론트 수정이 필요 없다 | — |

원자료 판(`--source cache`)은 `.env`에 `EARTHDATA_TOKEN`이 있어야 한다(지금 htj 로컬에는 없음). 그 전까지는 앱 영상판으로 끝까지 간다.

### jmj (프론트)

| ID | 작업 | 완료 기준 | 기다리는 것 |
|---|---|---|---|
| **J1** | 새 흐름의 화면 뼈대: 오프닝 → 밤사진 → 확대. `screens/` 모듈과 화면 전환 상태 | 세 화면을 버튼으로 오갈 수 있다(가짜 내용 가능) | 없음 |
| **J2** | 구름 문지르기: 캔버스 지우개로 광학 영상을 지우면 레이더가 드러남. "7월 맑은 광학 0장" 표시 | 마우스·터치 둘 다 된다 | H1(스텁), H3 |
| **J3** | 밤사진 레이어 + 프레임 재생(아리랑 반주와 동기, 기존 `music.js`·`rhythm.js` 사용), 분계선 흰 선 | 재생하면 들판이 점점 빛난다 | H1, H2 |
| **J4** | 땅 연주: 지도 위 포인터 → `pixelOf` → `sampleDb` → `touch` | DMZ 띠 위에서 소리가 끊긴다 | H4 |
| **J5** | 확대 근거 패널: `evidence()` 곡선과 변동 폭, 한계 문구, 기존 미션 진입 | 철원·파주에서 숫자와 곡선이 보인다 | H5 |
| **J6** | `i18n.js` 한·영 전환, 영어 문구 전체(한계 문구 키 포함) | 영어로 바꾸면 한국어가 남지 않는다 | 없음 |
| **J7** | 데모: 영상 30초(영어 자막) 또는 슬라이드 7장 이내 | 숫자는 `facts.json`에서만 | H6 |

### 다른 팀원 (참고, `decision_jmj.md`의 다음 할 일)

- khs: 더 긴 띠 추출 가능 여부, 모든 구역이 함께 변한 날의 원인, 원자료 캐시 공유
- hdk / khs: `decision_jmj.md` 확인, 구역 토지피복 대조(철원·파주)
- 누구든: 대회 전 작업 사용 규정을 운영진에게 확인

### 체크포인트

| 시각 | 상태 |
|---|---|
| 11/14 21:00 | H1 스텁 푸시, J1 뼈대 푸시 |
| 11/15 12:00 | 오프닝·밤사진·땅 연주가 실제 데이터로 동작 (J2~J4, H2~H4) |
| 11/15 18:00 | **기능 동결.** 이후에는 버그와 문구만 고친다 |
| 11/15 21:00 | 데모 영상·슬라이드 완성 (J7) |
| 11/15 23:00 | 제출. 남은 1시간은 여유 |

## 5. 요청 보드

남의 파일에 고칠 게 있으면 한 줄로 적고 푸시한다. 소유자가 처리하면 `[x]`로 바꾼다.

형식: `- [ ] (요청자→소유자) 무엇을, 왜 — 관련 작업 ID`

- (아직 없음)

## 6. git 순서 (main 브랜치에서 바로 작업)

**작업 시작 전**

```bash
git pull --rebase origin main
```

**푸시 직전 (매번)**

```bash
git fetch origin
git rebase origin/main          # 다른 사람 커밋을 내 커밋 아래로 병합
npm test                        # 실패하면 푸시하지 않는다
python3 -m http.server 5173 --directory app   # 화면을 고쳤으면 열어서 콘솔 에러가 없는지 확인
git push origin main
```

**규칙**

- 커밋은 작게, 작업 하나에 하나. 메시지 앞에 작업 ID를 붙인다: `H2: make_glow.py — forest-relative seasonal change frames`
- 충돌이 나면
  - 내 소유 파일은 내가 고친다.
  - 남의 소유 파일은 **상대 변경을 살리고**, 내 변경은 요청 보드로 옮긴다.
  - 다시 `npm test`를 통과하고 푸시한다.
- `git push --force`, `git reset --hard origin/...` 처럼 남의 커밋을 지울 수 있는 명령은 쓰지 않는다.
- 생성물(`app/data/**`)이 충돌하면 손으로 합치지 않는다. 최신 `tools/`로 다시 만들어 덮는다.
- 계약(2절·3절)을 바꿀 때는 **이 문서를 먼저 고쳐 푸시하고**, 요청 보드에 한 줄 남긴 뒤 코드를 바꾼다. 바뀌는 동안은 옛 형식도 읽히게 둔다.
- 작업을 시작하거나 끝내면 `CLAUDE.md` 트래커의 해당 줄을 같은 커밋에서 고친다.

## 7. AI 세션 시작 문장

htj:

```
CLAUDE.md와 plan.md를 읽어. 나는 htj(로직·데이터)야. 내 소유 파일만 고치고, 4절 htj 작업 중 아직 안 끝난 것을 순서대로 해.
푸시 전에는 6절 순서(fetch → rebase → npm test → push)를 지켜.
```

jmj:

```
CLAUDE.md와 plan.md를 읽어. 나는 jmj(프론트)야. 내 소유 파일만 고치고, 4절 jmj 작업 중 아직 안 끝난 것을 순서대로 해.
데이터·로직이 아직 없으면 2·3절 계약대로 가정하고 만들고, 필요한 건 5절 요청 보드에 적어.
푸시 전에는 6절 순서(fetch → rebase → npm test → push)를 지켜.
```

## 8. 화면 문구 원칙 (둘 다)

- "빛난다 / 고요하다"는 레이더 신호 변화 크기를 말한다. 생태 회복, 작황, 무인 지대 같은 판정어는 쓰지 않는다.
- 북쪽 땅은 "경작지로 보이는 곳 (appears to be farmland)"으로만 부른다.
- 숫자는 `facts.json`에서만 가져온다.
- 화면마다 2-4절 한계 문구 키 중 해당하는 것을 하나 이상 보여 준다.
