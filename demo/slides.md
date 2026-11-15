# Demo slides — 7장 원고 (J7)

제출 규정: 제목 포함 **최대 7장**, 영어, 공개 링크 하나, NASA 로고를 팀·프로젝트 상표처럼 쓰지 않는다.
숫자는 `app/data/facts.json`(6번 장의 띠 숫자만 `section.json`)에서 왔다. 숫자를 고치면 여기도 고친다.
구성은 안내 20쪽의 예시 순서를 따랐다. 글은 장마다 제목 + 세 줄 이내, 나머지는 화면 캡처로 채운다.

분위기: 앱과 같은 밤하늘. 남색 바탕(#0b1026 근처), 금빛 강조, 제목은 명조(Noto Serif KR / 영어는 가는 산세리프). 모든 장을 어두운 바탕으로 통일한다.

---

## 1. Title

- **Title:** Dancing with DMZ
- **Tagline:** Reading a land no one can visit, with NISAR radar
- **Small line:** NASA Space Apps Challenge 2026 · Seoul · Challenge: Dancing with the SARs · Team Nasafy
- **Visual (full bleed):** 밤하늘 둘러보기 화면. 금빛 들판 사이로 어두운 DMZ 띠와 흰 분계선이 보이는 철원 구간
- **Link (작게):** htjworld.github.io/dancing-with-dmz

## 2. The problem: a land hidden twice

- **Headline:** Land no one could walk into, or see from above (앱 오프닝 문장과 같게)
- **Left — "Closed to people":** Closed to the public for over 70 years. Visitors can only look across from an observatory.
- **Right — "Closed to cameras":** July 2026: Landsat looked at five DMZ windows **19** times. Clear views: **0**.
- **Bottom line:** NISAR radar saw it every 12 days, through cloud and at night. But a radar image does not look like a photo, so few people can read it.
- **Who it is for (작게):** 530,223 people visited Paju's Third Tunnel in 2025; 77% came from abroad.
- **Visual:** 왼쪽에 7월 26일 철원 광학 영상(창 안 66%가 구름), 오른쪽에 같은 달 NISAR 영상. 큰 숫자 "0 / 19"

## 3. Our solution: a radar night photo you can play

- **Headline:** One season of radar, turned into one picture and one line
- **Flow (가로 다섯 칸, 화살표로 잇는다):**
  1. **Rub** — wipe away the July cloud to reveal radar
  2. **Watch** — 11 passes stack up; land that changes glows
  3. **Play** — five missions, five ways to read radar
  4. **Dance** — the five curves join into one moving line
  5. **Check** — evidence, land cover and limits for every region
- **Bottom line:** Bright = the radar signal changed a lot over the season. Farmed fields glow on both sides of the line; the strip between stays still.
- **Visual:** 각 칸 위에 해당 화면 작은 캡처

## 4. The experience: five missions, five radar features

- **Headline:** Each place teaches one way to read radar
- **Five cards (지역 · 특징 · 하는 일), 서쪽에서 동쪽 순서:**
  - **Paju** · Radar comes back — step through 11 dates, find the darkest and brightest paddy
  - **Yeoncheon** · Calm water looks black — trace the river
  - **Cheorwon** · Change maps — overlay two dates; only changed land takes colour
  - **Hwacheon** · Two polarizations — slide between HH and HV
  - **Yanggu** · Radar works at night — 6 of our 11 images were taken after dark
- **Small line:** Korean and English. No install, no login.
- **Visual:** 다섯 미션 화면 캡처를 한 줄로. 카드 위에 파주에서 양구까지 이어지는 선

## 5. NASA data: what we used and how

- **Headline:** Built on NISAR, checked with three other sources
- **Main (크게):** **NISAR L2 GCOV** (NASA/ISRO, via ASF DAAC) · L-band · track 133 · HH and HV · **11 of 12 passes**, June 23 – November 2, 2026
- **Method (세 단계 그림):** read only the needed pixels over HTTP → subtract the same-day forest mean → measure each pixel's spread over the season
- **Checks (작은 세 칸):**
  - **HLS Landsat** (NASA LP DAAC) — cloud inside each window
  - **NASA POWER** — rain before each pass
  - **ESA WorldCover 2021** — land cover of each zone
- **Visual:** 왼쪽에 흑백 NISAR 영상 한 장, 화살표, 오른쪽에 금빛 변동 지도

## 6. What the data says, and what it does not

- **Headline:** The glow follows farming, not the line
- **Chart (막대 세 개, 철원, 숲 대비 계절 변동 폭):** Paddy south of the line **2.1 dB** · Inside the DMZ **0.7 dB** · North of the line **2.0 dB**
- **Under each bar (토지피복 경작지 비율):** 78.7% cropland · 0.6% · 82.9%
- **Second fact:** Paju, both inside the DMZ: farmed **2.1 dB**, unfarmed **0.6 dB**
- **How we keep it honest (작게):** every number on screen is generated from the data; the build stops if a claim no longer matches; automated tests on every push
- **Limits (작게, 지우지 않는다):** 10 of 11 passes are provisional products · one season · zones are rectangles we chose · glow is signal change, not an ecological or crop judgment
- **Visual:** 근거 창의 철원 곡선(금빛 둘, 회청 하나)

## 7. Impact and next steps

- **Headline:** The land was never unseen. Now people can learn to read it
- **Impact (세 줄, 누가 / 무엇을 할 수 있게 되나):**
  - **Visitors and guides at the observatories:** five short missions show what radar sees in land they can only look across at. No install, no login, Korean and English.
  - **Teachers and students:** a ready-made lesson, one radar concept per mission (repeat passes, dark water, change maps, polarization, night). Open source.
  - **Anyone following land they cannot enter:** free NISAR GCOV plus a nearby forest already separates farmed land (2.1 dB) from unfarmed land (0.6–0.7 dB); the same steps can be repeated for other closed areas.
- **쓸 때 지킬 것:** 학습 효과("배운다", "leaves able to read")는 시험해 본 적이 없으니 쓰지 않는다. 전망대 전후 질문을 실제로 해 보면 그 결과로 바꾼다. 세 번째 줄은 실제 사용자가 아니라 "되풀이할 수 있다"까지만 쓴다.
- **Next:** rebuild from the 30 m source · add a second track for twice the views · a second season · test with visitors at an observatory
- **Links:** Live app htjworld.github.io/dancing-with-dmz · Code github.com/htjworld/dancing-with-dmz
- **Credits (맨 아래 작게):** Data: NISAR (NASA/ISRO, ASF DAAC), HLS (NASA LP DAAC), NASA POWER, ESA WorldCover 2021, © OpenStreetMap contributors. Built with SI (AI) tools: Claude Code, OpenAI Codex; intro clips are SI-generated (Higgsfield) and labelled.
- **Visual:** 엔딩의 춤추는 선(파주에서 양구까지)

## 5·6·7번 장의 실제 구성 (11/15 오후, 세 장이 같은 모양이던 것을 구분)

미리캔버스 슬라이드는 아래처럼 바뀌었다. 위 5·6번 원고와 다르면 이 절이 기준이다.

- **5. NASA data — 상자 세 개, 번호 단계.** 카드 제목이 큰 `01` `02` `03`이고, 본문 첫마디가 단계 이름이다(Measure change / Cross-check / Stay honest). 아이콘: 위성, 체크리스트, 방패.
- **6. The evidence — 상자 없음, 큰 숫자.** 카드 상자 세 개를 지웠다. 금색 큰 숫자 `2.1 dB`(농사짓는 곳: 철원 남쪽 논 2.1, 북쪽 2.0, 경작지 78.7%·82.9%)와 `0.7 dB`(DMZ 안: 경작지 0.6%, 숲·초지 99.2%, 파주도 2.1 대 0.6), 셋째 칸은 Limits. 아이콘: 벼, 지도 핀, 경고.
- **7. Who it helps — 넓은 판 하나에 세 칸.** 카드 상자 하나를 슬라이드 폭으로 넓혀 세 칸을 한 판에 담았다(작년 SAR 결선작 TengriSpacers의 마지막 장처럼 결론을 한 덩어리로). 첫 칸 제목이 금색 큰 `530,223`, 둘째 칸 Classrooms, 셋째 칸 Closed land. 주소는 오른쪽 위로 옮겼다. 아이콘: 화살표, 학사모, 망원경.

## 11/15 저녁 문구 다듬기 (미리캔버스 실제 슬라이드 기준)

학습 효과 주장("teaches", "learns to read")을 모두 "shows"로 바꾸고, 7번 장을 세 사용자 묶음으로 맞췄다. 새 숫자는 없다.

- **1번 설명:** An interactive web app that shows anyone how to read radar, using a land no one can visit. Built on 11 NISAR passes over the Korean DMZ, June to November 2026.
- **2번 왼쪽 원(No way in):** Land no one could walk into. Closed to the public for over 70 years; visitors can only look across.
- **2번 오른쪽 원(No clear view):** Or see from above. July 2026: Landsat looked 19 times at five DMZ windows and got 0 clear views. NISAR radar saw it every 12 days, through cloud and after dark. Few people can read a radar image.
- **4번:** 둘째 설명 "Each mission shows one radar feature. The short intro clips are SI-generated and labelled." · 셋째 제목 "3. The evidence"
- **5번 `03`:** Stay honest. Every number on screen is generated from the data, and the build stops if a claim no longer matches. SI tools used: Claude Code, Codex, Higgsfield (labelled clips).
- **6번 오른쪽 위:** Seasonal change of the radar signal, relative to nearby forest. / Why (hypotheses): flooded paddies look dark, growing rice brightens L-band, harvest darkens it. Signal change, not a crop or ecology judgment.

## 7. Who it helps (Impact)

미리캔버스 실제 슬라이드와 같은 내용이다(`brainstorming/metacognition_htj.md` 6절과 hdk의 세 사용자 묶음 기준).

- **Headline:** Who it helps
- **Top right:** App: htjworld.github.io/dancing-with-dmz · Code: github.com/htjworld/dancing-with-dmz · Next: test with visitors and count who can read a radar image before and after.
- **칸 1 — 530,223:** people visited the Third Tunnel in 2025, 77% from abroad. Five short missions show visitors and guides what radar sees in land they can only look across at. No install, no login, Korean and English.
- **칸 2 — Classrooms:** For teachers and students: a ready-made lesson, one radar concept per mission (repeat passes, dark water, change maps, polarization, night). Open source.
- **칸 3 — Closed land:** For anyone following land they cannot enter, in seasons cameras cannot see. Free NISAR data and a nearby forest already separate farmed land (2.1 dB) from unfarmed land (0.6–0.7 dB); the same steps can be repeated elsewhere.
- 셋째 칸은 "같은 방법을 되풀이할 수 있다"는 뜻으로만 쓴다. 그 사용자를 실제로 만나 본 적은 없다.
- 자료 출처 줄(NISAR, HLS, POWER, WorldCover, OpenStreetMap)은 이 장에서 빠졌다. 5번 장과 제출 양식의 링크 목록에 있다.

---

## 만들 때 확인

- [ ] 캡처는 영어 화면(`?lang=en`)에서 찍는다
- [ ] 6번 장의 한계 줄은 줄이더라도 지우지 않는다(`plan.md` 8절)
- [ ] 북쪽 땅은 "appears to be farmland" 또는 "north of the line"으로만 부른다
- [ ] 생성 영상 캡처를 슬라이드에 쓰면 그 캡처에도 "SI-generated video" 표시가 보여야 한다(소개 카드를 통째로 찍으면 보인다)
- [x] 팀 이름 채우기(Nasafy)
- [ ] 올린 뒤 시크릿 창에서 링크가 열리는지 확인하고, 그 링크를 `submission.md` 2번 칸에 적는다
- [ ] htj 숫자 검수
