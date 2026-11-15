# Submission (Space Apps project page)

**제출 완료: 2026-11-15 11:59 KST, "Project Submitted for Judging" 확인.** 이 문서는 실제로 제출한 내용의 기록이다.
공개 페이지: https://www.spaceappschallenge.org/2026/find-a-team/nct/?tab=project (팀 Nasafy)

초안 htj(11/14), 개정·입력·제출 jmj(11/15). 숫자는 `app/data/facts.json`에서 왔다(띠 단면 숫자만 `app/data/section.json`).
**양식을 고치면 Save Progress만으로는 공개되지 않는다. Submit for Judging을 다시 눌러야 한다(마감 11/15 23:59).** 고치면 이 문서도 같이 고친다.

실제 양식은 안내 자료와 달랐다:

- **Use of SI**는 글 칸이 아니라 선택 목록이고, 심사위원에게 보이지 않는다고 적혀 있다. 그래서 도구와 쓴 곳은 Project Details 끝의 "Use of SI" 문단에 적었다.
- **NASA Data**와 **Space Agency Partner & Other Data**는 "이름 + 주소"를 한 줄씩 추가하는 목록이다. References 칸은 따로 없다.
- Project Details는 서식 편집기다. 마크다운을 붙여 넣으면 `**` 기호가 그대로 보이므로 굵은 글씨와 목록으로 넣었다.

**확인한 것 (11/15 jmj)**

- [x] 띠 단면 숫자 10% / 15% / 29%: `tools/make_section.py`를 다시 돌려 `section.json`과 똑같이 나왔고, 집계 표에서 직접 계산해도 9.9% / 15.0% / 29.5%다(분계선 2 km 안 / 남쪽 2~10 km / 북쪽 2~10 km, 띠 상위 20% = 0.66 dB 이상인 화소의 몫)
- [x] 궤도 방향: ASF 검색 결과의 `flightDirection`이 DESCENDING이고 장면 이름에도 `_133_D_069_`가 있다. "하강 궤도 133"이 맞다. 제출한 글에서는 방향 표기를 뺐는데, 틀린 내용이 아니라 빠진 것이므로 다시 제출할 필요는 없다
- [x] 소개 영상 5개(`app/media/intro/*.mp4`)는 Higgsfield로 만들었고, 앱 화면에서 영상 오른쪽 아래에 "SI-generated video"가 항상 보인다. mp4 파일 자체에는 새겨져 있지 않다
- [x] `LICENSE`: Apache License 2.0
- [x] README의 AI 사용 고지를 제출 내용과 같게 고쳤다

**남은 것**

- [ ] 데모 링크가 로그인하지 않은 상태에서 열리는지 팀원 한 명이 더 확인한다(jmj는 시크릿 창에서 확인했다)
- [ ] 출석: 개인 체크인 5번 중 4번, 팀 미팅 전원 1회
- [ ] 마감 뒤에는 양식과 슬라이드를 고치지 않는다

---

## Project Name

> Dancing with DMZ

## 1. High-Level Summary (50–200 words)

> Dancing with DMZ is an interactive web app that teaches anyone to read radar, using a land no one can visit.
>
> The Korean Demilitarized Zone has been closed to the public for over 70 years, and in July 2026 optical satellites were blind: Landsat looked at five DMZ windows 19 times and got no clear view. NISAR's L-band radar imaged it every 12 days, through cloud and after dark.
>
> From 11 NISAR passes (June–November 2026) we track one season of surface change across paddies, a river, forest and a mountain basin. Our map shows how much each pixel changed, relative to nearby forest. Where people farm, the land glows; the unfarmed strip stays still. In Cheorwon the glowing paddy is 78.7% cropland, the still DMZ lowland 0.6%.
>
> Visitors rub away a cloudy image to reveal radar, then play five missions, each teaching one way to read it: repeat passes, dark water, change maps, polarization and night imaging; their curves join into one dancing line.
>
> Radar data is free, but few people can read it. We turn it into something a student or a tourist at a DMZ observatory can understand. Every number comes from the data, with limits stated.

(199단어, 1140자. 양식 칸은 1,500자 제한)

## 2. Project Demo

> https://www.miricanvas.com/v2/ko/design2/v/f8087dac-ed37-48a5-beae-be03e35a9318

- 미리캔버스 7장 슬라이드(제목 포함, 영어, 밤하늘 톤). 보기 전용 공유 링크다. 편집 주소(`/design2/<id>`)는 로그인이 필요하므로 쓰지 않는다.
- 슬라이드를 고치면 이 링크에 바로 반영된다. 구성: 제목 / Two barriers / Five places. One line. / Rub. Play. Explore. / NASA data / The evidence. / Next steps

## 3. Final Project

> https://htjworld.github.io/dancing-with-dmz/

- 코드 저장소 주소는 Project Details 끝과 Other Data 목록에 적었다.
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
- NISAR L2 GCOV (track 133; frames 069 and 070), 11 passes from 2026-06-23 to 11-02, HH and HV. The ~6 GB scenes are read remotely with HTTP range requests, so only the needed pixels are downloaded.
- For every pixel: HH backscatter minus the same-day forest mean (this removes scene-wide effects such as a wet day), then the spread over the season. Bright means a large seasonal change.
- Checks from independent sources: cloud measured inside each window from HLS Landsat browse images; land cover of each zone from ESA WorldCover 2021; NASA POWER rain in the three days before each pass.
- Every number on screen comes from one generated file (`facts.json`), and the build stops if a stated claim no longer matches the data. Automated tests run on every push, and GitHub Actions deploys to GitHub Pages only when they pass.
- No server: a Python pipeline prepares the data and a static site draws it in the browser.

**What the data says.**
- Cheorwon (forest-relative seasonal range): paddy south of the line 2.1 dB, DMZ lowland 0.7 dB, land that appears to be farmland north of the line 2.0 dB.
- Paju, two zones both inside the DMZ: farmed 2.1 dB, unfarmed 0.6 dB. The glow follows farming, not the line itself.
- Land cover agrees: the Cheorwon paddy zone is 78.7% cropland, the DMZ lowland 0.6% (99.2% tree and grass), the northern zone 82.9%.
- Along the whole strip, the share of strongly changing land is 10% within 2 km of the line, 15% at 2–10 km south and 29% north.

**Benefits and impact.**
- A first-time visitor leaves able to read five things in any SAR image: repeat passes, dark water, change maps, polarization and night imaging.
- A place that cannot be visited, in a season cameras cannot see, becomes readable from open data.
- For teachers and guides: the missions are short, need no install or login, and run in Korean and English.
- The method needs only NISAR GCOV and a nearby forest as reference, so it can be repeated for other places where access is closed.

**What is creative.**
- It starts from what a visitor already knows, a cloudy photo, and lets them rub it away with their own hand to meet radar.
- One mission, one radar feature. Each place along the line was chosen because it shows that feature best.
- The challenge's "dance" is literal: the measured curves of five regions join into one line that moves with the data.
- Honesty is part of the design: the day we cannot explain is shown, not hidden.

**Design choices.**
- "Glow" and "still" describe only the size of the radar signal change. We do not claim ecological recovery or crop condition, and land north of the line is described only as "appears to be farmland".
- The dancing line shows change in backscatter, not ground movement. The music and the sky colours are staging; the height, pauses and jumps of the line follow the measurements, and the screen says so.
- Each mission teaches exactly one radar feature, so a first-time visitor leaves with five things they can read in any SAR image.
- Causes are written as possible explanations. Detailed numbers and caveats are one tap away on every result card.

**Physical drivers (hypotheses).** Flooded paddies are dark (smooth water reflects the signal away); growing rice raises L-band backscatter; harvest lowers it. On 8/22 every zone brightened after 39 mm of rain (wet surfaces). On 10/21 every zone brightened with 0.2 mm of rain, which we cannot yet explain (possibly product calibration).

**Limits.** 10 of the 11 passes are PROVISIONAL products. The glow map is built from display layers and is coarser than the 30 m source. One season only. Zones are rectangles we chose on the radar image; WorldCover is from 2021. The demarcation line is an approximate OpenStreetMap geometry.

**Next steps.** Rebuild the change map from the 30 m source; add a second track (125) for twice the views; a second season; test the app with visitors at an observatory; apply the same method to other places no one can enter.

**Tools.** Python (NumPy, SciPy, Pillow, pyproj, h5py, tifffile), JavaScript (ES modules, no framework), MapLibre GL JS, Canvas, Web Audio API, Node test runner, GitHub Actions and GitHub Pages.

**Use of SI (AI tools).** Team members chose the problem, directed each step, ran and reviewed every script, and checked results against the data.
- Code, data scripts, tests and documents: Claude (Anthropic) through Claude Code. SI-generated code is covered by automated tests and data asserts, and this use is stated in the repository README.
- Review: OpenAI Codex, to review brainstorming notes and check sources.
- Video: the five short intro clips on the mission cards were generated with Higgsfield. They are illustrations of each radar feature, not data. Each clip is shown with a visible "SI-generated video" label in the app, and they contain no NASA logos, flags or mission identifiers.
- Music: the soundtrack is synthesized in the browser from code written with SI assistance. No SI-generated audio files are used.
- All maps, curves and numbers come from NISAR and the other listed data, not from SI generation.

**Code and license.** https://github.com/htjworld/dancing-with-dmz (open source, Apache License 2.0)

## 5. Use of Super Intelligence (SI) — 선택 목록

고른 항목(심사위원에게는 보이지 않는다): Ideation or Brainstorming / Coding, Debugging, or Troubleshooting / Visual Design or Image Creation / Presentation, Video, or Audio / Writing, Editing, or Translation

## 6. NASA Data — 링크 4개

| Link Text | Link Url |
|---|---|
| NISAR L2 GCOV (NASA/ISRO) via ASF DAAC, ASF Data Search Vertex: radar time series, source of every map, curve and mission | https://search.asf.alaska.edu/ |
| HLS L30/S30 v2.0 (NASA LP DAAC), metadata and browse images: cloud over each window, opening image | https://www.earthdata.nasa.gov/data/projects/hls |
| NASA POWER daily precipitation: rain before each pass | https://power.larc.nasa.gov/ |
| NASA Earthdata Search and CMR: data discovery | https://search.earthdata.nasa.gov/ |

## 7. Space Agency Partner & Other Data — 링크 16개

| Link Text | Link Url |
|---|---|
| ESA WorldCover 2021 v200 (CC BY 4.0): land cover check of each zone | https://esa-worldcover.org/ |
| OpenStreetMap (ODbL): demarcation line, approximate | https://www.openstreetmap.org/ |
| OpenFreeMap (OSM data, ODbL): base map | https://openfreemap.org/ |
| Natural Earth 110m land (public domain): dot globe in the night-sky film | https://www.naturalearthdata.com/ |
| MapLibre GL JS (BSD-3-Clause): map rendering | https://maplibre.org/ |
| Google Fonts, Noto Serif KR and Inter Tight (SIL Open Font License): typography | https://fonts.google.com/ |
| Pretendard (SIL Open Font License): typography, body text — 11/15 오후 hdk가 팀 페이지에 추가해 다시 제출(링크 문구는 페이지의 것과 다를 수 있다) | https://github.com/orioncactus/pretendard |
| NOAA Solar Calculator (public domain): sun height at each pass, Yanggu mission | https://gml.noaa.gov/grad/solcalc/ |
| Paju City survey report 2014: Daeseong-dong village inside the DMZ | https://ggcf.kr/attachment/8614/download |
| Gyeonggi Province DMZ guide: Daeseong-dong village inside the DMZ | https://dmz.gg.go.kr/all-about-the-dmz/human-environment-of-the-dmz |
| Paju Third Tunnel visitor numbers 2025 (news article): target users | https://www.m-i.kr/news/articleView.html?idxno=1399626 |
| Claude Code (Anthropic): SI tool for code, data scripts, tests and documents | https://claude.com/claude-code |
| OpenAI Codex: SI tool for reviewing notes and checking sources | https://openai.com/codex/ |
| Higgsfield: SI tool, five generated intro clips on the mission cards | https://higgsfield.ai/ |
| NASA Space Apps Challenge mark, as provided by the Seoul organizers: browser tab icon | https://www.spaceappschallenge.org/ |
| Our source code (GitHub) | https://github.com/htjworld/dancing-with-dmz |

## 8. Project Submission Verification

- [x] Agree to Terms and Conditions
- [x] Confirm All Work is Original

## 제출 확인 (안내 13·14·30·31쪽)

- [x] 양식의 네 구역(Project Summary, Project Links, Project Information, Verification)이 모두 Complete
- [x] **Submit for Judging** → "Project Submitted for Judging" 표시 확인(11/15 11:59)
- [x] 공개 페이지에 새 Summary, Details, 데모 링크, 링크 목록이 반영된 것을 확인
- [ ] 편집할 때 Lock을 켜고, 편집 전후에 팀에 알린다(다른 사람이 Lock을 풀면 덮어써진다). 제출 때 Lock은 꺼져 있었다
