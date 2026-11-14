# Submission draft (Space Apps project page)

초안: htj, 2026-11-14. 공식 제출 페이지(Project 탭 → Edit Details)의 칸 순서대로 영어로 썼다. 팀이 고친 뒤 붙여 넣는다.
숫자는 모두 `app/data/facts.json`에서 왔다. 숫자를 고치면 여기도 같이 고친다. 규정은 `ref/03_nasa_seoul_guide.md`.

---

## 1. High-Level Summary (50–200 words)

> Dancing with DMZ is a radar "night photo" of the Korean Demilitarized Zone. Nobody has walked into the DMZ for over 70 years, and in July 2026 optical satellites were blind too: across five DMZ windows, Landsat looked 19 times and never saw a clear view. NISAR's L-band radar saw the land every 12 days through cloud. We turned 11 NISAR passes (June–November 2026) into a single image of how much each pixel changed over the season, relative to nearby forest. Farmed fields on both sides of the demarcation line glow; the strip between them stays still. Visitors can rub away a cloudy July image to reveal the radar view, play the season, sweep the map to hear the change, and open an evidence panel with curves, land cover and limits. Independent checks agree: Cheorwon's glowing paddy is 78.7% cropland, the dark DMZ lowland 0.6%. The project shows how NISAR can make a place no one can enter, in a season no camera can see, readable to anyone.

(약 170단어)

## 2. Project Demo

- [ ] J7: 30초 이하 영상(영어 자막) 또는 7장 이하 슬라이드. 공개 링크 하나. 로그아웃 상태에서 열리는지 확인.

## 3. Final Project

- Live: https://htjworld.github.io/dancing-with-dmz/
- Code: https://github.com/htjworld/dancing-with-dmz (공개 전환 뒤)

## 4. Project Details

**Problem.** The DMZ cannot be visited, and in the monsoon month even optical satellites cannot see it (July 2026: 0 clear Landsat views of 19 across our five windows). Radar data from NISAR is free, but radar images do not look like photos, so the public cannot read them.

**What we built.** A static web app for visitors who stand at the DMZ observatories and can only look across (77% of the 530,223 visitors to Paju's Third Tunnel in 2025 were from abroad). It opens on a cloudy July image that you rub away to reveal radar, then shows a seasonal-change "night photo" of five DMZ windows, plays the season pass by pass, turns the map into an instrument, and opens an evidence panel for each region. Korean and English.

**How it works.**
- NISAR L2 GCOV (track 133, frame 069), 11 passes, read remotely with HTTP range requests so only the needed pixels are downloaded.
- For every pixel, HH backscatter minus the same-day forest mean (removing scene-wide changes such as wet days), then the seasonal standard deviation. Bright = large seasonal change.
- Checks: cloud measured inside each window from HLS Landsat browse images; land cover of each zone from ESA WorldCover 2021; NASA POWER rain before each pass.
- Every number shown comes from one generated file (`facts.json`), and the build stops if a stated claim no longer matches the data. 42 automated tests; GitHub Actions tests and deploys on every push.

**What the data says.** Cheorwon: paddy south of the line 2.1 dB, DMZ lowland 0.7 dB, farmland north of the line 2.0 dB (forest-relative seasonal range). Paju, both inside the DMZ: farmed land 2.1 dB, unfarmed 0.6 dB, so the glow follows farming, not the line itself. Naepo-ri paddy: water-filled (dark) pixels 17% in June, ~0% in summer, 22% after harvest; forest 0% throughout.

**Physical drivers (hypotheses).** Flooded paddies are dark (specular water); growing rice raises L-band backscatter; harvest lowers it. On 8/22 every zone brightened after 39 mm of rain (wet surfaces); on 10/21 every zone brightened with 0.2 mm of rain, which we cannot yet explain (possibly product calibration).

**Limits and next steps.** 10 of 11 passes are PROVISIONAL; the glow map is built from display layers and should be rebuilt from the 30 m source; one season only; WorldCover is from 2021. Next: rebuild from source, add the ascending track (125) for twice the views, extend along the whole line, and apply the same method to other places no one can enter.

**Tools.** Python (NumPy, SciPy, Pillow, pyproj, h5py, tifffile), JavaScript (ES modules), MapLibre GL, Web Audio API, Node test runner, GitHub Actions and Pages.

## 5. Use of SI (AI tools)

> We used AI coding assistants throughout: Claude (Anthropic) via Claude Code to write and revise code, data-processing scripts, tests and documentation, and OpenAI Codex to review brainstorming notes. Team members chose the problem, directed each step, ran and reviewed every script, and checked results against the data. AI-generated code is covered by automated tests and data asserts, and this use is also stated in the repository README. No AI-generated images, audio or video are used.

- [ ] 팀원이 쓴 다른 AI 도구가 있으면 추가한다. 제출 페이지의 도구 선택 칸도 체크한다.

## 6. Space Agency Data

- **NISAR L2 GCOV** (NASA/ISRO) via **ASF DAAC / ASF Data Search Vertex** — listed in the challenge Resources. The core of every map, curve and sound in the app.
- **HLS L30/S30 v2.0** (NASA LP DAAC), CMR metadata and browse images — showed that July 2026 had no clear optical view, which is why radar matters here.
- **NASA POWER** daily precipitation — explains one of the two days when every zone changed together.
- NASA Earthdata Search and CMR for discovery.

## 7. References

| Resource | Used for | License / terms |
|---|---|---|
| NISAR L2 GCOV, ASF DAAC — https://search.asf.alaska.edu/ | Radar time series | NASA open data |
| HLS v2.0, LP DAAC — https://www.earthdata.nasa.gov/data/projects/hls | Cloud over windows, opening image | NASA open data |
| NASA POWER — https://power.larc.nasa.gov/ | Rain | NASA open data |
| ESA WorldCover 2021 v200 — https://esa-worldcover.org/ | Land cover check | CC BY 4.0 |
| OpenStreetMap — https://www.openstreetmap.org/ | Demarcation line | ODbL |
| OpenFreeMap — https://openfreemap.org/ | Base map | ODbL (OSM data) |
| MapLibre GL JS — https://maplibre.org/ | Map rendering | BSD-3-Clause |
| NASA Space Apps Challenge mark (favicon) — https://www.spaceappschallenge.org/ | Browser tab icon | Event mark, used as provided by the Seoul organizers |
| Paju Third Tunnel visitor numbers — https://www.m-i.kr/news/articleView.html?idxno=1399626 | Target users | News article |

- [ ] 우리 코드의 라이선스(`LICENSE`)를 정해서 여기와 README에 적는다(안 정하면 Apache 2.0).
