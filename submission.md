# Submission draft (Space Apps project page)

초안: htj, 2026-11-14. 11/15 jmj가 현재 앱(오프닝 → 밤하늘 영상 → 다섯 미션 → 엔딩 → 밤하늘 둘러보기)에 맞춰 고쳤다.
공식 제출 페이지(Project 탭 → Edit Details)의 칸 순서대로 영어로 썼다. `>` 인용 줄과 영어 본문을 그대로 붙여 넣는다.
숫자는 `app/data/facts.json`에서 왔다(띠 단면 숫자만 `app/data/section.json`). 숫자를 고치면 여기도 같이 고친다. 규정은 `ref/03_nasa_seoul_guide.md`.

**붙여 넣기 전에 정할 것 (팀)**

- [x] 소개 영상 5개(`app/media/intro/*.mp4`)를 만든 도구: Higgsfield (jmj 확인, 11/15)
- [x] 소개 영상의 SI 생성 표시: 앱 화면에서 영상 위에 글자를 겹쳐 보여 준다(11/15 jmj). mp4 파일 자체에는 표시가 없으니, 시간이 되면 영상에 직접 새겨 다시 내보낸다
- [ ] README의 "No AI-generated images, audio or video are used"를 5번 칸과 같게 고친다 — htj
- [ ] `LICENSE` 파일(안 정하면 Apache 2.0) → 7번 표 마지막 줄
- [ ] 띠 단면 숫자(10% / 15% / 29%)를 htj가 확인했는지 (`plan.md` 5절 hdk→htj). 확인 전이면 4번 칸의 해당 문장을 뺀다
- [ ] 팀 이름, 데모 링크

---

## Project Name

> Dancing with DMZ

## 1. High-Level Summary (50–200 words)

> Dancing with DMZ lets anyone read a land that no one can visit. The Korean Demilitarized Zone has been closed to the public for over 70 years, and in July 2026 optical satellites were blind as well: across five DMZ windows, Landsat looked 19 times and never got a clear view. NISAR's L-band radar imaged the same land every 12 days, through cloud and after dark. From 11 NISAR passes (June–November 2026) we built a "night photo" of how much each pixel changed over the season, relative to nearby forest. Farmed fields on both sides of the demarcation line glow; the strip between them stays still. In our web app, visitors rub away a cloudy July image to reveal the radar view, watch the season build up, then play five short missions from Paju to Yanggu. Each mission teaches one way to read radar: repeat passes, dark water, change maps, polarization and night imaging. The five measured curves then join into one line that dances. Independent checks agree: Cheorwon's glowing paddy is 78.7% cropland, the dark DMZ lowland 0.6%. Every number on screen is generated from the data, with its limits stated.

(약 190단어)

## 2. Project Demo

- [ ] J7: 7장 이하 슬라이드(제목 포함) 또는 30초 이하 영상(영어 자막). **공개 링크 하나만.** 로그아웃 상태(시크릿 창)에서 열리는지 확인. 슬라이드 원고는 `demo/slides.md`.

## 3. Final Project

> https://htjworld.github.io/dancing-with-dmz/

- 칸이 하나면 위 주소(실행되는 서비스)를 넣는다. 코드 저장소 https://github.com/htjworld/dancing-with-dmz 는 4번 칸 끝과 7번 칸에 적는다.
- 영어 화면: https://htjworld.github.io/dancing-with-dmz/?lang=en

## 4. Project Details

**Problem.** The DMZ is hidden twice. People cannot visit it, and in the monsoon month even optical satellites cannot see it: in July 2026, Landsat looked at our five DMZ windows 19 times and got 0 clear views. NISAR radar data is free and sees through cloud, but a radar image does not look like a photo, so most people cannot read it.

**Who it is for.** Visitors who stand at the DMZ observatories and can only look across. Paju's Third Tunnel alone had 530,223 visitors in 2025, 77% of them from abroad. The app is in Korean and English.

**What we built.** A static web app that tells one story in five steps.

1. **Opening.** A cloudy July optical image of Cheorwon (66% cloud inside the window). Rub it away and the NISAR image from the same month appears underneath.
2. **Night-sky film.** The view pulls back to the globe and returns to the DMZ. Eleven observations stack up as moving ridgelines, and the land that changed most turns gold.
3. **Five missions, one radar feature each.**
   - Paju — *radar comes back to the same place*: step through the dates and pick the darkest and brightest image of a paddy.
   - Yeoncheon — *calm water looks black*: trace the river on the radar image.
   - Cheorwon — *change maps*: overlay two dates; only land that changed takes colour. Compare a paddy with land inside the DMZ.
   - Hwacheon — *two polarizations*: slide a curtain between HH and HV over forest and flat land.
   - Yanggu — *radar works at night*: NISAR passes at 19:25 local time; of our 11 images, 3 were taken in daylight, 2 at dusk and 6 after dark.
4. **Ending.** The five regional curves join into one line from west to east, and the line moves with the measured values, pass by pass. It closes on the July comparison: optical 0 clear of 19 looks, radar 11 of 12 passes.
5. **Explore.** The seasonal-change map as a continuous strip along the demarcation line, a cross-section chart, and an evidence panel for each region with forest-relative curves, land cover, rain and limits.

**How it works.**
- NISAR L2 GCOV (track 133, descending; frames 069 and 070), 11 passes from 2026-06-23 to 11-02, HH and HV. The ~6 GB scenes are read remotely with HTTP range requests, so only the needed pixels are downloaded.
- For every pixel: HH backscatter minus the same-day forest mean (this removes scene-wide effects such as a wet day), then the spread over the season. Bright means a large seasonal change.
- Checks from independent sources: cloud measured inside each window from HLS Landsat browse images; land cover of each zone from ESA WorldCover 2021; NASA POWER rain in the three days before each pass.
- Every number on screen comes from one generated file (`facts.json`), and the build stops if a stated claim no longer matches the data. Automated tests run on every push, and GitHub Actions deploys to GitHub Pages only when they pass.
- No server: a Python pipeline prepares the data and a static site draws it in the browser.

**What the data says.**
- Cheorwon (forest-relative seasonal range): paddy south of the line 2.1 dB, DMZ lowland 0.7 dB, land that appears to be farmland north of the line 2.0 dB.
- Paju, two zones both inside the DMZ: farmed 2.1 dB, unfarmed 0.6 dB. The glow follows farming, not the line itself.
- Land cover agrees: the Cheorwon paddy zone is 78.7% cropland, the DMZ lowland 0.6% (99.2% tree and grass), the northern zone 82.9%.
- Along the whole strip, the share of strongly changing land is 10% within 2 km of the line, 15% at 2–10 km south and 29% north.

**Design choices.**
- "Glow" and "still" describe only the size of the radar signal change. We do not claim ecological recovery or crop condition, and land north of the line is described only as "appears to be farmland".
- The dancing line shows change in backscatter, not ground movement. The music and the sky colours are staging; the height, pauses and jumps of the line follow the measurements, and the screen says so.
- Each mission teaches exactly one radar feature, so a first-time visitor leaves with five things they can read in any SAR image.
- Causes are written as possible explanations. Detailed numbers and caveats are one tap away on every result card.

**Physical drivers (hypotheses).** Flooded paddies are dark (smooth water reflects the signal away); growing rice raises L-band backscatter; harvest lowers it. On 8/22 every zone brightened after 39 mm of rain (wet surfaces). On 10/21 every zone brightened with 0.2 mm of rain, which we cannot yet explain (possibly product calibration).

**Limits.** 10 of the 11 passes are PROVISIONAL products. The glow map is built from display layers and is coarser than the 30 m source. One season only. Zones are rectangles we chose on the radar image; WorldCover is from 2021. The demarcation line is an approximate OpenStreetMap geometry.

**Next steps.** Rebuild the change map from the 30 m source; add the ascending track (125) for twice the views; a second season; test the app with visitors at an observatory; apply the same method to other places no one can enter.

**Tools.** Python (NumPy, SciPy, Pillow, pyproj, h5py, tifffile), JavaScript (ES modules, no framework), MapLibre GL JS, Canvas, Web Audio API, Node test runner, GitHub Actions and GitHub Pages.

**Code.** https://github.com/htjworld/dancing-with-dmz

## 5. Use of SI (AI tools)

> We used AI tools throughout, and team members chose the problem, directed each step, ran and reviewed every script, and checked results against the data.
>
> - **Code, data scripts, tests and documents:** Claude (Anthropic) through Claude Code. AI-generated code is covered by automated tests and data asserts, and this use is stated in the repository README.
> - **Review:** OpenAI Codex, to review brainstorming notes and check sources.
> - **Video:** the five short intro clips shown on the mission cards (`app/media/intro/`) were generated with Higgsfield. They are illustrations of each radar feature, not data. Each clip is shown with a visible "SI-generated video" label in the app. They contain no NASA logos, flags or mission identifiers.
> - **Music:** the soundtrack is synthesized in the browser from code written with AI assistance. No AI-generated audio files are used.
>
> All maps, curves and numbers come from NISAR and the other listed data, not from AI generation.

- [x] 생성 표시: 앱의 소개 카드에서 영상 오른쪽 아래에 "SI-generated video"가 항상 보인다(`main.js`, `style.css`, 11/15 jmj). mp4 파일 자체에는 새겨져 있지 않다.
- [ ] 팀원이 쓴 다른 AI 도구가 있으면 추가한다. 제출 페이지의 도구 선택 칸도 체크한다.

## 6. Space Agency Data

> **NASA data**
> - **NISAR L2 GCOV** (NASA/ISRO), from **ASF DAAC** via ASF Data Search (Vertex) — listed in the challenge Resources. Track 133, frames 069/070, HH and HV, 11 passes from 2026-06-23 to 11-02. It is the source of every map, curve, mission and sound in the app. Its 12-day repeat is what made a "season" visible, and its ability to see through cloud and at night is the story we tell.
> - **HLS L30/S30 v2.0** (NASA LP DAAC), CMR metadata and browse images — showed that July 2026 had no clear optical view of our five windows (0 of 19 looks). This is why radar matters here, and it became the opening scene.
> - **NASA POWER** daily precipitation — rain in the three days before each pass; explains one of the two days when every zone changed together.
> - **NASA Earthdata Search and CMR** — data discovery.
>
> **Partner and other data**
> - **ESA WorldCover 2021** — independent land cover check of each zone.
> - OpenStreetMap (demarcation line), Natural Earth (globe).

## 7. References

| Resource | Used for | License / terms |
|---|---|---|
| NISAR L2 GCOV, ASF DAAC — https://search.asf.alaska.edu/ | Radar time series, all maps and missions | NASA open data |
| HLS v2.0, LP DAAC — https://www.earthdata.nasa.gov/data/projects/hls | Cloud over windows, opening image | NASA open data |
| NASA POWER — https://power.larc.nasa.gov/ | Rain before each pass | NASA open data |
| NASA CMR / Earthdata Search — https://search.earthdata.nasa.gov/ | Data discovery | NASA open data |
| ESA WorldCover 2021 v200 — https://esa-worldcover.org/ | Land cover check | CC BY 4.0 |
| OpenStreetMap — https://www.openstreetmap.org/ | Demarcation line (approximate) | ODbL |
| OpenFreeMap — https://openfreemap.org/ | Base map | ODbL (OSM data) |
| Natural Earth 110m land — https://www.naturalearthdata.com/ | Dot globe in the night-sky film | Public domain |
| MapLibre GL JS — https://maplibre.org/ | Map rendering | BSD-3-Clause |
| Google Fonts: Noto Serif KR, Inter Tight — https://fonts.google.com/ | Typography | SIL Open Font License |
| NOAA solar position approximation — https://gml.noaa.gov/grad/solcalc/ | Sun height at each pass (Yanggu mission) | US Government public domain |
| Paju City survey report (2014) — https://ggcf.kr/attachment/8614/download ; Gyeonggi DMZ guide — https://dmz.gg.go.kr/all-about-the-dmz/human-environment-of-the-dmz | Daeseong-dong village inside the DMZ (explore screen) | Public reports |
| Paju Third Tunnel visitor numbers — https://www.m-i.kr/news/articleView.html?idxno=1399626 | Target users | News article |
| NASA Space Apps Challenge mark (favicon) — https://www.spaceappschallenge.org/ | Browser tab icon | Event mark, used as provided by the Seoul organizers |
| Claude Code (Anthropic), OpenAI Codex, Higgsfield | See "Use of SI" | — |
| Our code — https://github.com/htjworld/dancing-with-dmz | — | [LICENSE: Apache 2.0 unless the team decides otherwise] |

## 제출 직전 확인 (안내 13·14·30·31쪽)

- [ ] 모든 링크(데모, 서비스, 저장소)가 시크릿 창에서 로그인 없이 열린다
- [ ] 팀원 네 명이 모두 같은 Seoul Event에 확정 등록돼 있고 공식 팀 페이지에 있다
- [ ] 동의 두 칸(Terms and Conditions, All Work is Original) 체크
- [ ] Save Progress로 끝내지 않고 **Submit for Judging** → "Project Submitted for Judging" 표시 확인. 23:55까지. 고치면 다시 제출
- [ ] 편집할 때 Lock을 켜고, 편집 전후에 팀에 알린다(다른 사람이 Lock을 풀면 덮어써진다)
