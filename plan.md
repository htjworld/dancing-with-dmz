# 구현 계획 — 레이더로 찍은 DMZ의 한 계절

기준: `brainstorming/decision_jmj.md`(jmj 초안, hdk·khs 확인 전. 팀 최종본은 `brainstorming/decision.md`). 결정이 바뀌면 이 문서를 먼저 고친다.
마감: 11/15 23:59(hdk 확인, 기준 시간대는 운영진에게 재확인). 데모는 영상 30초 이내 또는 슬라이드 7장 이내, 영어.

두 사람이 각자 AI 세션을 돌려 동시에 작업한다. **화면 디자인에 영향이 적은 프론트 작업은 htj가 끝까지 맡는다**(4절 담당 칸). 막힌 일은 `todo.md`. 서로 막히지 않도록 **파일 소유권, 데이터 계약, git 순서** 세 가지를 지킨다.

| 이니셜 | 맡는 것 |
|---|---|
| **htj** (한태진) | 로직·데이터: `tools/`(Python), 데이터 파일(`app/data/`), 계산 모듈(JS), 테스트 |
| **jmj** (장민준) | 프론트: 화면 구성, 지도 그리기, 상호작용, 한·영 문구, 데모 영상·슬라이드 |

## 진행 방식: 전부 만들기 → 한 번에 피드백 → 수정

- **4절에 적힌 것을 먼저 전부 만든다.** 중간 피드백은 하지 않는다(바퀴마다 피드백할 시간이 없다).
- 4절의 MVP1~4는 **만드는 순서**다. 앞 단계가 끝나면 기다리지 않고 바로 다음 단계로 간다.
- 각 기능은 "돌아가는 가장 단순한 것"까지만 만든다. 다듬기는 피드백 뒤에 한다.
- 전부 만들면 **팀 전체 피드백을 한 번** 한다. 피드백은 5절 보드에 한 줄씩 적고, 그다음 수정에 들어간다.
- 4절 밖의 작업은 하지 않는다. 떠오른 것은 보드의 "다음에" 칸에 적는다.

| 시각 | 할 일 |
|---|---|
| ~ 11/15 13:00 | 4절 MVP1~4 기능 전부 완성 (J7 데모 제외) |
| 11/15 13:00 ~ 14:00 | 팀 전체 피드백 (hdk·khs 포함) → 5절 보드 |
| 11/15 14:00 ~ 18:00 | 피드백 반영. **18:00 기능 동결** |
| 11/15 18:00 ~ 21:00 | 버그·문구만 수정, 데모 영상·슬라이드 (J7) |
| 11/15 23:00 | 제출 (23:59 마감, 1시간 여유) |

## 0. 만들 것 (체험 흐름, 최종 모습)

1. **구름 문지르기 (오프닝)**: 2026년 7월 철원 광학 영상(구름뿐)을 띄운다. 문지르면 같은 시기의 NISAR 레이더 영상이 드러난다. 옆에 "7월, 다섯 지역 모두 맑은 광학 영상 0장"을 띄운다.
2. **밤사진 켜기**: 지도에 계절 변동 지도를 올린다. 6월부터 11월까지 통과가 쌓일수록 들판이 점점 빛나고, 밤하늘에 어울리는 잔잔한 곡에 맞춰 재생된다. 분계선은 흰 선으로 표시한다.
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
| `app/js/glow.js`, `landsound.js`, `evidence.js` (신규) | htj | `interface.md` 3절 |
| `app/js/state.js`의 `data`, `load()`, 데이터 조회 함수 | htj | |
| `app/js/state.js`의 `state` 객체(화면 상태 필드) | jmj | 같은 파일이지만 다른 덩어리다. rebase로 대부분 자동 병합된다 |
| `app/tests/**` | htj | jmj가 테스트를 추가해도 된다(새 파일로) |
| `app/index.html`, `app/style.css` | jmj | |
| `app/js/main.js`, `map.js`, `dance.js`, `stops.js`, `views/**` | jmj | |
| `app/js/screens/**`, `app/js/i18n.js` (신규) | jmj | 화면 모듈, 한·영 문구 |
| `demo/**` (신규) | jmj | 영상·슬라이드 자료 |
| `plan.md`, `CLAUDE.md` | 공동 | 고친 사람이 바로 푸시 |

## 2·3. 데이터 계약과 로직 API → `interface.md`

데이터 파일(`glow.json`, `opening.json`, `facts.json`), 함수(`glow.js`, `landsound.js`, `evidence.js`, `sound.js`), 한계 문구 키, 쓰는 법 예시는 **`interface.md` 하나가 기준**이다. 지금 저장소에 있는 그대로 적었다.
계약을 바꿀 때는 `interface.md`를 먼저 고쳐 푸시하고, 5절 요청 칸에 한 줄 남긴 뒤 코드를 바꾼다.

## 4. 작업 목록 (만드는 순서)

htj와 jmj가 동시에 만든다. 단계 사이에 피드백으로 멈추지 않는다. 피드백은 전부 만든 뒤 한 번 한다(위 표).

### MVP1 — 밤사진 한 장 ✅

"레이더로 찍은 DMZ의 밤사진"이 지도 위에 보이기만 하면 된다. 애니메이션, 소리, 오프닝은 없다.

| ID | 담당 | 작업 | 완료 기준 |
|---|---|---|---|
| H1 | htj | 시제품 변동 지도를 계약 형식으로 저장: `glow.json`(`color`, `value`만. `frames`는 빈 배열), `glow/*_color.webp`·`*_value.webp`, 숫자 몇 개만 든 `facts.json`, `state.js`가 이 둘을 읽게 함 | `data.glow`, `data.facts`가 채워진다. `npm test` 통과 |
| J1 | jmj | 밤사진 화면: 지도에 다섯 지역 `color` 영상을 `corners`대로 올리고, 분계선 흰 선, 제목, 한 줄 문구(`facts.july_clear_optical`) | 앱을 열면 철원에서 "들판은 빛나고 DMZ 띠는 어둡다"가 보인다 |

### MVP2 — 이야기의 시작과 끝

| ID | 담당 | 작업 | 완료 기준 |
|---|---|---|---|
| H2 | htj | `tools/make_glow.py`: 숲 대비 변동 폭으로 다시 계산 + 누적 `frames` | 다섯 지역 프레임 생성. 스크립트 안 assert 통과 |
| H3 | htj | `tools/make_opening.py` + `opening.json`: 7월 철원에서 가장 흐린 HLS 장면과 같은 시기 NISAR | 두 영상이 같은 범위로 겹친다 |
| J2 | jmj | 구름 문지르기 오프닝 → 밤사진으로 넘어가기 | 마우스·터치 둘 다 된다 |
| J3 | jmj | 밤사진 프레임 재생(잔잔한 곡에 맞춰서, `screens/nightmusic.js`) | 재생하면 들판이 점점 빛난다 |

### MVP3 — 만지고 확인하기

| ID | 담당 | 작업 | 완료 기준 |
|---|---|---|---|
| H4 | htj | `glow.js`(`pixelOf`, `sampleDb`, `frameAt`), `landsound.js`(`noteFor`, `touch`) + 테스트 | `npm test` 통과, 경계값 테스트 포함 |
| H5 | htj | `evidence.js` + 테스트 (`calc.forestChange`, `togetherDays` 재사용) | 철원·파주 숫자가 `facts.json`과 같다 |
| J4 ✅ | jmj | 땅 연주: 포인터 → `regionAt` → `sampleDb` → `touch` (`screens/land.js`) | DMZ 띠 위에서 소리가 끊긴다 |
| J5 | jmj | 확대 근거 패널: `evidence()` 곡선, 변동 폭, 한계 문구, 기존 미션 진입 | 철원·파주에서 숫자와 곡선이 보인다 |

### MVP4 — 영어와 제출물

| ID | 담당 | 작업 | 완료 기준 |
|---|---|---|---|
| H6 | htj | `tools/make_facts.py`: `facts.json`을 스크립트로 생성 | 숫자가 `regions.json`·HLS 집계에서 자동으로 나온다 |
| J6 | jmj | `i18n.js` 한·영 전환, 영어 문구 전체 | 영어로 바꾸면 한국어가 남지 않는다 |
| J7 | jmj (+htj 숫자 검수) | 데모 영상 30초(영어 자막) 또는 슬라이드 7장 이내 | 숫자는 `facts.json`에서만 |

J7(데모)은 피드백 반영 뒤 18:00 이후에 만든다. 18:00 이후에는 기능을 더하지 않는다.

### 시간이 남으면 (4절 목록을 다 만든 뒤)

- H7: 상승 궤도 125 또는 더 긴 띠(khs와). `glow.json`에 지역만 늘면 프론트 수정은 필요 없다.
- 원자료 판(`make_glow.py --source cache`): `.env`의 `EARTHDATA_TOKEN` 또는 khs의 캐시가 있어야 한다. 지금 htj 로컬에는 없다.
- 철원 두루미 이야기 한 줄(확대 패널).

### 다른 팀원 (참고, `decision_jmj.md`의 다음 할 일)

- khs: 더 긴 띠 추출 가능 여부, 모든 구역이 함께 변한 날의 원인, 원자료 캐시 공유
- hdk / khs: `decision_jmj.md` 확인, 구역 토지피복 대조(철원·파주), **11/15 13:00 전체 피드백 담당**
- 누구든: 대회 전 작업 사용 규정을 운영진에게 확인

## 5. 보드 (요청 · 피드백 · 다음에)

한 줄씩 적고 푸시한다. 처리하면 `[x]`로 바꾼다.

### 요청 (남의 파일에 고칠 것)

형식: `- [ ] (요청자→소유자) 무엇을, 왜 — 관련 작업 ID`

- [x] (jmj→htj) `opening/hls_cheorwon.jpg`: 타일 구름량은 95%인데 철원 창 안에서는 땅이 절반쯤 보인다. "구름뿐"이라는 오프닝과 어긋나서 문구를 "구름을 찍었습니다 / 타일 전체 95%"로 낮췄다. 창 안이 더 흐린 7월 장면이 있으면 바꾸거나, 창 안의 구름 비율을 `opening.json`에 넣어 달라 — H3, J2
  - htj 답: 창 안 구름을 직접 재는 `tools/hls_window.py`를 만들었다. 창을 다 덮는 7월 장면 중 가장 흐린 것이 지금 7/26이고 **창 안 66%**다(`optical.window_cloud_pct`). "구름뿐"이 아니라 "창 안 66%가 구름"으로 쓰면 된다. 7월 다섯 지역 창을 19번 찍었고 맑았던 적은 0번(`fact('july_clear_optical')`, `fact('july_optical_looks')`)
- [x] (htj→jmj) `brainstorming/decision_jmj.md`·`stage3_summary_jmj.md`의 "철원 7~9월 맑은 광학 0일"은 타일 구름량으로 센 값이라 창 기준으로 틀린다(8·9월엔 창 안이 맑은 날이 있다). "7월, 다섯 지역 창을 19번 찍었는데 맑은 날 0번"으로 바꿔 달라 — `interface.md` 2-3
  - jmj 답: 세 문서(`decision_jmj.md`, `stage3_summary_jmj.md`, `jmj_brainstorming.md`)와 화면 문구를 "7월, 19번 찍어 맑은 날 0번"으로 고쳤다. 오프닝은 `window_cloud_pct`와 `cheorwon_july_min_cloud`를 쓴다
- [x] (jmj→htj) J4 땅 연주는 jmj가 `8ed3f02`에서 이미 올렸다(`app/js/screens/land.js`, 밤사진의 "♪ 땅 연주" 단추로 켠다). 담당 변경(395d313)과 엇갈렸으니 `app/js/landplay.js`는 새로 만들지 말고, 고칠 점이 있으면 여기 적어 달라. 4절 J4 칸과 1절 소유권 표는 htj가 정리 — J4

- [ ] (htj→jmj) 근거 패널에 토지피복과 강수를 보여 달라(작게, 디자인은 jmj 판단). `evidence(zones, id, { landcover: data.landcover, rain: data.rain })`를 부르면 `lines[].cover.cropland`(%)와 `shared[].rain_mm_3day`가 나온다. 예: 철원 남쪽 논 경작지 78.7%, DMZ 안 0.6%(숲·초지 99%), 북쪽 82.9%. 함께 변한 날 8/22는 3일 강수 39 mm, 10/21은 0.2 mm(비로 설명 안 됨). 숫자는 `fact()`로도 있다 — `interface.md` 2-3, 2-4, 3
- [ ] (htj→jmj) `caveat.zone_unverified` 문구를 "구역은 영상에서 고른 사각형이다. ESA WorldCover 2021과 대조했다(2021년 지도)"처럼 바꿔 달라. 토지피복으로 구역 이름을 확인했다 — `interface.md` 5

- [ ] (jmj→htj) 밤사진 재생 음악을 아리랑에서 **밤하늘에 어울리는 잔잔한 곡**으로 바꿨다(`app/js/screens/nightmusic.js`, 새로 지은 곡, 북·하이햇 없음, 24초, 테스트 `nightmusic.test.js`). jmj 소유 문서와 `plan.md`·`CLAUDE.md`에서 아리랑 언급을 뺐다. 남은 것은 htj 소유다: 미션 조각·피날레의 아리랑 편곡(`music.js`), `landsound.js` 주석, `interface.md` 128·155행, `htj_brainstorming.md`·`stage3_review_htj.md`. 피날레 곡도 바꿀지, 문서에서 뺄지 정해 달라 — J3

- [ ] (hdk→jmj, 전원) 프론트 디자인 재구성을 hdk가 맡고 싶다. 화면 파일 소유권 조정 제안: hdk = `app/style.css`, `app/index.html` 구조·디자인, 오프닝 첫 장면 연출, 날짜 줄 표시, 에필로그 장면 / jmj = `screens/**` 동작 로직, `i18n.js`, 데모(J7). 동의하면 1절 표를 고친다 — `brainstorming/decision_hdk.md` 5절
- [x] (hdk→htj) 근거 패널용 내포리 논 계절 곡선을 원자료(또는 지금 레이어)에서 만들어 `interface.md`에 올려 달라. 숲과 견준 값이면 더 좋다 — `brainstorming/decision_hdk.md` 3절
  - htj 답: `tools/make_paddy_curve.py` → `data/paddy_curve.json`, `data.paddyCurve`로 읽힌다. 형식과 읽는 법은 `interface.md` 2-5. 6월 17% → 한여름 0~1% → 10월 22%(어두운 물 찬 화소), 숲은 내내 0%

### 피드백 (전부 만든 뒤 전체 피드백에서 나온 것)

형식: `- [ ] 화면/기능 · 누가 · 무엇이 이상한가/좋은가 → 누가 고칠지`

- (아직 없음)

### 다음에 (4절 밖에서 떠오른 것)

- [ ] (jmj) 브라우저가 옛 JS를 캐시해 새 모듈과 어긋난 적이 있다(`sound.js`의 `blip`). 데모·피드백 때는 강력 새로고침(Ctrl+Shift+R)으로 연다. 필요하면 스크립트 주소에 버전 꼬리표를 붙인다
- [ ] (jmj) 근거 패널과 땅 연주의 좁은 화면(휴대폰) 배치는 확인하지 않았다
- [x] (jmj) 영어 화면의 구역 이름표: `i18n.js`의 `ZONE_EN`(구역 id → 영어 이름)과 `zoneName()`으로 해결. 구역이 늘거나 id가 바뀌면 `ZONE_EN`에도 넣어야 한다

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
- 계약(`interface.md`)을 바꿀 때는 **그 문서를 먼저 고쳐 푸시하고**, 요청 보드에 한 줄 남긴 뒤 코드를 바꾼다. 바뀌는 동안은 옛 형식도 읽히게 둔다.
- 작업을 시작하거나 끝내면 `CLAUDE.md` 트래커의 해당 줄을 같은 커밋에서 고친다.

## 7. AI 세션 시작 문장

htj:

```
git pull --rebase origin main 하고 CLAUDE.md, plan.md, interface.md를 읽어. 나는 htj(로직·데이터)야.
5절 보드의 요청·피드백 중 내 몫을 먼저 처리하고, 4절 htj 작업 중 안 끝난 것을 MVP 순서대로 전부 해. 4절 밖은 하지 마.
내 소유 파일만 고치고, 푸시 전에는 6절 순서(fetch → rebase → npm test → push)를 지켜.
```

jmj:

```
git pull --rebase origin main 하고 CLAUDE.md, plan.md, interface.md를 읽어. 나는 jmj(프론트)야.
5절 보드의 요청·피드백 중 내 몫을 먼저 처리하고, 4절 jmj 작업 중 안 끝난 것을 MVP 순서대로 전부 해(J7 데모는 피드백 뒤). 4절 밖은 하지 마.
데이터·함수는 interface.md에 있는 것만 쓰고, 없는 게 필요하면 5절 요청 칸에 적어.
내 소유 파일만 고치고, 푸시 전에는 6절 순서(fetch → rebase → npm test → push)를 지켜.
```

## 8. 화면 문구 원칙 (둘 다)

- "빛난다 / 고요하다"는 레이더 신호 변화 크기를 말한다. 생태 회복, 작황, 무인 지대 같은 판정어는 쓰지 않는다.
- 북쪽 땅은 "경작지로 보이는 곳 (appears to be farmland)"으로만 부른다.
- 숫자는 `facts.json`에서만 가져온다.
- 화면마다 `interface.md` 5절 한계 문구 키 중 해당하는 것을 하나 이상 보여 준다.

## 9. 배포와 CI/CD

**결론: GitHub Pages + GitHub Actions.** 무료이고 다른 서비스 계정이 필요 없다. `main`에 푸시하면 테스트를 돌리고, 통과하면 자동으로 배포된다. 빌드 단계가 없는 정적 앱(`app/` 폴더 그대로)이라 가장 단순하다.

| 선택지 | 무료 | 비공개 저장소 | 자동 배포 | 판단 |
|---|---|---|---|---|
| **GitHub Pages + Actions** | O | X (공개 저장소만 무료) | `main` 푸시 → 테스트 → 배포 | **채택.** 제출 규정상 저장소를 어차피 공개해야 한다(Final Project 공개 링크, OSI 라이선스) |
| Cloudflare Pages | O | O | 저장소 연결 시 `main` 푸시마다 | 저장소를 공개하지 못할 때의 대안. 소유자가 대시보드에서 연결(빌드 명령 없음, 출력 폴더 `app`) |
| Render (Static Site) | O | O | 연결 시 자동 | 대안. Publish directory `app` |
| Vercel (Hobby) | O | 조건부 | 연결 시 자동 | 비공개 저장소 + 여러 사람 커밋이면 Hobby에서 배포가 막힐 수 있어 제외 |
| Netlify | O | O | 연결 시 자동 | 대안. Publish directory `app` |

### 파이프라인 (`.github/workflows/deploy.yml`)

- **모든 브랜치 push와 PR**: `npm test` + 앱이 처음에 읽는 데이터 파일이 다 있는지 확인한다.
- **`main` push**: 테스트를 통과하면 `app/`을 GitHub Pages에 배포한다. 주소는 `https://cen04088.github.io/dancing-with-dmz/`이다(소유자 계정 기준).
- 저장소가 비공개인 동안은 배포 단계를 건너뛴다(빨간 실패가 뜨지 않게). 공개되는 순간부터 자동으로 배포된다.
- 테스트가 실패하면 배포되지 않는다. 6절 푸시 순서(`npm test`)를 지키면 실패할 일이 없다.

### 처음 한 번만 (저장소 소유자 cen04088이 해야 한다. htj는 쓰기 권한뿐이라 못 한다)

1. 저장소 공개: Settings → General → Danger Zone → Change visibility → Public. 그 전에 비밀값이 없는지 확인한다(`.env`, `data/raw`, `data/cache`는 gitignore 대상).
2. Pages 켜기: Settings → Pages → Build and deployment → Source를 **GitHub Actions**로.
3. Actions → test-and-deploy → Run workflow(또는 `main`에 아무 커밋)로 첫 배포를 확인한다.

### 배포 뒤 확인

- 로그아웃 상태(시크릿 창)에서 주소가 열리는지(제출 규정 p19, p23)
- 오프닝 → 밤사진 → 땅 연주 → 근거 패널이 돌아가는지, 콘솔 에러가 없는지
- README 맨 위에 서비스 주소를 넣는다(p33)

## 10. 제출 준비 (공식 안내 `ref/03_nasa_seoul_guide.md`)

- [ ] High-Level Summary 영어 50~200단어
- [ ] Project Demo: 영상 30초 이하(영어 자막) 또는 슬라이드 7장 이하, 공개 링크 하나 — J7
- [ ] Final Project: 배포 주소(+ 공개 저장소)
- [ ] Project Details: 문제 → 근거 → NASA 데이터의 의미와 쓰임 → 검증(WorldCover, 창 안 구름, 강수) → 한계 → 다음 검증
- [ ] **Use of SI: 쓴 AI 도구와 쓴 곳을 공개.** AI가 만든 코드·데이터는 설명문과 메타데이터(README)에 표시
- [ ] Space Agency Data: NISAR GCOV(ASF), HLS, NASA POWER (+ ESA WorldCover, OSM은 References)
- [ ] References: 출처·링크·라이선스·쓰인 곳
- [ ] `LICENSE` 파일(정하지 않으면 Apache 2.0으로 배포됨)
- [ ] **Submit for Judging**까지 누르고 "Project Submitted for Judging" 확인, 23:55까지
- [ ] 출석: 개인 체크인 5번 중 4번, 팀 미팅 전원 1회

