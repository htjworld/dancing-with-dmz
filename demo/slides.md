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

- **Headline:** This land is hidden twice
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

- **Headline:** The land was never unseen. Now anyone can read it
- **Impact (세 줄):**
  - A visitor leaves knowing five things they can read in any SAR image
  - A place no one can enter, in a season no camera can see, becomes readable
  - The method works anywhere access is closed: cloud-covered, remote or restricted land
- **Next:** rebuild from the 30 m source · add a second track for twice the views · a second season · test with visitors at an observatory
- **Links:** Live app htjworld.github.io/dancing-with-dmz · Code github.com/htjworld/dancing-with-dmz
- **Credits (맨 아래 작게):** Data: NISAR (NASA/ISRO, ASF DAAC), HLS (NASA LP DAAC), NASA POWER, ESA WorldCover 2021, © OpenStreetMap contributors. Built with SI (AI) tools: Claude Code, OpenAI Codex; intro clips are SI-generated (Higgsfield) and labelled.
- **Visual:** 엔딩의 춤추는 선(파주에서 양구까지)

---

## 만들 때 확인

- [ ] 캡처는 영어 화면(`?lang=en`)에서 찍는다
- [ ] 6번 장의 한계 줄은 줄이더라도 지우지 않는다(`plan.md` 8절)
- [ ] 북쪽 땅은 "appears to be farmland" 또는 "north of the line"으로만 부른다
- [ ] 생성 영상 캡처를 슬라이드에 쓰면 그 캡처에도 "SI-generated video" 표시가 보여야 한다(소개 카드를 통째로 찍으면 보인다)
- [x] 팀 이름 채우기(Nasafy)
- [ ] 올린 뒤 시크릿 창에서 링크가 열리는지 확인하고, 그 링크를 `submission.md` 2번 칸에 적는다
- [ ] htj 숫자 검수
