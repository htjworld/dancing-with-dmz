# ref — 브레인스토밍 참고 자료

수집일: 2026-11-14. 출처는 모두 spaceappschallenge.org의 팀 페이지·심사 가이드와 Space Apps 공개 GraphQL API다.
팀별 파일은 원문(영문)을 그대로 옮겼고, 이 문서의 표와 관찰은 그 원문을 요약한 것이다.

## 파일

| 파일 | 내용 |
|---|---|
| `00_challenge_dancing_with_the_sars.md` | 우리 챌린지 원문 (수정 금지) |
| `01_organizer_feedback.md` | 운영진 피드백 4가지(필요성·데이터 신뢰성·차별성·48시간 구현) + 함께 받은 HLS(광학) 자료 원문 |
| `2025_winners/01~10_*.md` | 2025 Global Winner 10팀 프로젝트 원문 |
| `2025_sar_finalist_tengrispacers.md` | 직전 SAR 챌린지(2025)의 유일한 Global Finalist 원문 |
| `02_finalists_2024_2025_benchmark.md` | 2024·2025 지구관측 관련 결선팀 9곳 벤치마킹 요약(2025 수상 10팀 제외, 2024 수상팀 포함). 팀 페이지 원문이 아니라 팀이 정리한 요약이며, 우리 단계별로 참고할 사례를 짚는다 |

## 1. 심사 기준 (Judging & Awards Guide 원문 요약)

출처: https://www.spaceappschallenge.org/resources/judging-awards-guide/ — 항목마다 1~5점.

| 기준 | 원문 핵심 | 한 줄 해석 |
|---|---|---|
| Impact | addressing either a minor or major problem … inspires or helps others | 어떤 문제를 누구에게 얼마나 풀어 주나 |
| Creativity | introduces a novel concept … or presents an improvement upon existing ideas in a meaningful way | 처음 보는 접근인가 |
| Validity | grounded in scientific principles … technical, functional, or logical feasibility … usability | 과학적으로 맞고 실제로 돌아가나 |
| Relevance | fully and directly addresses the challenge … integrates NASA data as a core component rather than a superficial addition | 챌린지에 딱 맞고 NASA 데이터가 핵심인가 |
| Presentation | clearly conveying the challenge, their proposed solution, and its significance … Judges evaluate the demo and full project | 발표·데모로 잘 전달되나 |

## 2. 글로벌 어워드 10종 (Awards 페이지 원문)

| 상 | 정의 원문 |
|---|---|
| Best Use of Science | The project that makes the best and most valid use of science and/or the scientific method. |
| Best Use of Data | The project that best makes space data accessible or leverages it for a unique application. |
| Best Use of Technology | The project that exemplifies the most innovative use of technology. |
| Galactic Impact | The project with the most potential to improve life on Earth or in the universe. |
| Best Mission Concept | The project with the most plausible concept and design. |
| Most Inspirational | The project that captures our hearts. |
| Best Use of Storytelling | The project that most creatively communicates the potential of open data through the art of storytelling. |
| Global Connection | The project that best connects people around the world through technology. |
| Art & Technology | The project that most effectively combines technical and creative skills. |
| Local Impact | The project that demonstrates the greatest potential for local impact. |

선발 단계: 지역 심사 → Global Nominee → Global Finalist / Honorable Mention → Global Winner(상 10개, 팀 10개).

## 3. 2025 Global Winner 10팀

| # | 팀 · 프로젝트 | 상 | 챌린지 | 무엇을 만들었나 | 형태 | NASA 데이터 |
|---|---|---|---|---|---|---|
| 01 | QUEÑARIS · Queñaris | Local Impact | BloomWatch (식물 개화 관측) | 페루 아레키파 물 부족 → 퀘뉴아 숲 재조림 의사결정 플랫폼. 위성 식생지수+드론+AI로 심을 곳 선정, 미생물로 묘목 성장 가속 | 웹 플랫폼 + 영상 | HLS 식생지수(NDVI 등), FIRMS |
| 02 | Astro Sweepers | Galactic Impact | Commercializing LEO | 우주 쓰레기 규제 준수 보고서 자동 생성 + 위험 지수(ASRI) SaaS | 웹 대시보드 + 사업 모델 | Orbital Debris Program, ORDEM, DAS |
| 03 | Gaia+LEO | Global Connection | Commercializing LEO | 궤도·지상 데이터센터 배치 최적화(MIP) 시뮬레이터 | Streamlit + Three.js | NASA POWER |
| 04 | HerCode Space · A Solar Tale | Best Use of Storytelling | Stellar Stories (어린이 우주날씨 동화) | 태양이 화자인 5막짜리 디지털 동화 | 스크롤 스토리 웹 | NASA/NOAA 우주날씨 자료(참고 문헌) |
| 05 | Photonics Odyssey · AakashNet | Most Inspirational | Commercializing LEO | 인도 자체 LEO 위성 인터넷망 + 위상배열 단말 설계 | 슬라이드 + 하드웨어 콘셉트 | NASA 이미지 라이브러리 |
| 06 | PureFlow | Best Mission Concept | Habitat Layout Creator | 우주 거주지 3D 설계 + 생존 시뮬레이션, 실제 태양폭풍(DONKI)으로 시험 | 웹 3D 도구 | DONKI API, NASA 기술 보고서 |
| 07 | Resonant Exoplanets | Best Use of Data | Hunting for Exoplanets with AI | 외계행성 탐지 + 생명신호 검증 파이프라인 | 웹 + 자동 보고서 | Kepler, TESS, JWST, HST |
| 08 | SpaceGenes+ | Best Use of Science | Space Biology Knowledge Engine | 방사선·미세중력 복합 스트레스의 유전자 시너지 대시보드 | 웹 대시보드 | GeneLab OSD-288 |
| 09 | Twisters · SkySense | Best Use of Technology | Will It Rain On My Parade? | 야외 일정용 초지역 날씨 위험 예측 + 챗봇 | 웹앱 | NASA POWER, Giovanni, GES DISC |
| 10 | Zumorroda-X · Henry's Farm Adventures | Art & Technology | Farm Navigators (농업) | 농부 Henry가 세계 농부를 만나며 미니게임으로 홍수·폭염을 배우는 게임 | 웹 게임 + 영상 | Earth Observatory, NASA Harvest, Data Pathfinders |

## 4. SAR 챌린지 기록

### 2026 Dancing with the SARs (우리)
지금 진행 중이라 수상작이 없다.

### 2025 Through the Radar Looking Glass: Revealing Earth Processes with SAR (직전 SAR 챌린지)
- 참가 306팀. **Global Winner 0팀**, Global Finalist 1팀, Honorable Mention 1팀, Global Nominee 36팀(Finalist·HM 포함).
- 상위 두 팀만 프로젝트 원문이 공개돼 있다. 나머지 Nominee는 팀 소개만 보인다.

| 단계 | 팀 | 지역 | 내용 |
|---|---|---|---|
| Global Finalist | TengriSpacers | 키르기스스탄 비슈케크 | 고향 빙하(Ala-Archa, Golubin) 후퇴를 Sentinel-1 시계열로 정량화. 2016~2025 빙하 끝 1~2% 감소, 2050년까지 최대 약 30% 손실 예측(LSTM). **UI 없는 Python CLI**. 결과의 한계를 직접 적음 → `2025_sar_finalist_tengrispacers.md` |
| Honorable Mention | FarmHubGlobal | 프랑스 툴루즈 | 기존 SAR 영상을 개발도상·접근 제한 지역 농민용 필지별 의사결정 지도로 바꾸고 튜토리얼 제공 (팀 소개 기준) |

Global Nominee 34팀(위 두 팀 제외): Aperture Science(튀르키예), Arapua Labs(브라질, 렌소이스 사구·석호), Arkivators(방글라데시 안전), Astroos(이집트), Brave New World(베트남), Cea-SAR(아일랜드), EchoSpace(브라질, 남미 산불 인터랙티브), Elite Erudite(인도), Equipo Senkata(볼리비아), Explorer_J1K2R1(캐나다), FloodyHell(인도, 홍수), Forest Sentinel(미국, AI 예측), Hacker Mates(아르헨티나), HARP-I.A(브라질, 숲·공동체 협업), Hydro Vision(이집트, 재난 대응), Impact Crew(미국), IOT AVENGERS(인도), ITB(폴란드), Los Alpha(스페인), LOS QUE APRUEBAN MILAGROSAMENTE(우루과이 중학생), Lost Frequencies(스페인), MicroOndeados(멕시코), NARO(인도), npSAR(네팔, 빙하 홍수·산사태), Panggau Libau(말레이시아), SAR Monsters(미국), SARIN(인도), Surface Sleuths(온라인), The Third Eye(베트남), Through the radar and flames(아르헨티나, 산불), Tigris Bilsem(튀르키예), tryHard(카자흐스탄), UpIT(우루과이), Yekta(튀르키예).

### 2021 What on Earth is Synthetic Aperture Radar?
SAR 설명 콘텐츠를 만드는 챌린지였다. 검색으로는 Global Nominee(Astro Focus, ATON, Flexible Warriors 등)만 확인되고 글로벌 수상은 확인되지 않았다.

## 5. 데이터에서 보이는 것 (관찰)

1. **10팀 모두 돌아가는 데모 링크와 영상(또는 슬라이드)이 있다.** Presentation 점수는 데모까지 보고 매긴다.
2. **지구과학 수상팀은 장소와 숫자가 구체적이다.** Queñaris: 샘물 유량 14 L/s → 며칠 만에 0, 물 사용 비중(농업 28.5% 등). TengriSpacers: 빙하 1~2% 감소, 2050년 최대 30%.
3. **둘 다 "고향 문제"다.** 아레키파 물 부족, 비슈케크 빙하. 챌린지 원문도 "your hometown … provide personal context and stories"를 권한다.
4. **스토리·게임으로도 상을 받는다.** A Solar Tale(동화, Storytelling), Henry's Farm(게임, Art & Technology). 둘 다 대상(어린이, 플레이어)을 처음부터 못 박았다. Henry's Farm은 NASA 영상을 게임 안 장치(전후 비교 슬라이더, 퀴즈)로 넣었다.
5. **SAR 챌린지는 작년에 글로벌 우승이 0팀이다.** 유일한 Finalist는 화면 없는 CLI였는데, 실제 SAR 시계열 처리와 정량 결과, 지역 영향(물·에너지·빙하호 홍수)으로 올라갔다. SAR 쪽은 화려함보다 Validity와 Impact가 먼저 걸러진다고 읽을 수 있다.
6. **한계를 스스로 밝힌 팀이 있다.** TengriSpacers는 "실제 손실은 더 크다"고 적었다. 우리 README의 "해석의 한계"와 같은 태도다.

## 6. 브레인스토밍에서 답해야 할 질문 (위 관찰에서 나온 것)

- 우리 앱은 어느 상을 노리나? (후보: Art & Technology, Best Use of Storytelling, Local Impact, Best Use of Data, Global Connection)
- DMZ에서 "숫자로 말할 수 있는 문제"는 무엇인가? (Queñaris·TengriSpacers처럼)
- 대상(누가 쓰나)을 한 문장으로 못 박을 수 있나? (A Solar Tale은 "children", Henry's Farm은 "player")
- 게임으로 간다면, NISAR 데이터가 장식이 아니라 게임 판정의 핵심인가? (Relevance)
- 작년 SAR 챌린지에서 아무도 못 받은 글로벌 상을 받으려면 무엇이 더 필요한가?
