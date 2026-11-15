# 메타인지 — 우리 서비스와 이 해커톤을 다시 보기

작성: htj + Claude, 2026-11-15 오후(제출 11:59 뒤, 마감 23:59 전).
근거: `ref/00_challenge_dancing_with_the_sars.md`(챌린지 원문), `ref/01_organizer_feedback.md`(운영진 피드백), `ref/02_finalists_2024_2025_benchmark.md`·`ref/2025_winners/`(수상작), `ref/03_nasa_seoul_guide.md`(심사 기준), `submission.md`(실제 제출 내용), `brainstorming/direction_check_htj.md`(어제의 방향 점검).
다른 팀의 결과물은 모른다. 아래 가능성은 우리 쪽 근거만 본 추정이다.
11/15 저녁 갱신: 서울 팀 목록(Find a Team, Seoul 필터 115팀)으로 경쟁 구도(4-1절)를, 실제 공식 페이지로 고칠 곳(8절)을 더했다. 팀 페이지의 프로젝트 내용은 로그인해야 보여서, 다른 팀은 챌린지 이름만 보고 판단했다.

## 1. 이 해커톤의 본질

**NASA가 공개한 자료를, 그 자료를 직접 다루지 못하는 사람에게도 의미 있게 만드는 대회다.**

챌린지 원문이 바라는 결과는 두 줄이다.

- "make NISAR data **accessible to a broad audience**" — 누구나 다가갈 수 있게
- "translate complex radar observations into **actionable insights**" — 복잡한 관측을 행동할 수 있는 통찰로

48시간이라는 조건 때문에 심사는 완성도보다 **문제 → 자료 → 통찰의 연결이 분명한가, 근거가 정직한가**를 본다. 공식 안내도 "완성 못 한 부분은 설계와 선택의 근거를 보여 주라"고 한다(p32). 심사위원은 공식 페이지와 링크된 제출물을 본다. 앱을 끝까지 해 본다는 보장은 없다. **점수의 대부분은 Summary·Details·7장 슬라이드가 정한다.**

## 2. 우리 서비스의 본질

**레이더를 읽는 눈을 길러 주는 번역기다. DMZ는 그 필요를 가장 강하게 보여 주는 무대다.**

- DMZ 감시 도구나 생태 평가 도구가 아니다. 결과물은 "처음 본 사람이 어떤 SAR 영상에서도 다섯 가지(같은 곳 다시 찍기, 검은 물, 변화 지도, 편파, 밤 촬영)를 읽게 되는 것"이다.
- DMZ를 고른 이유: 사람은 못 들어가고, 장마철엔 광학 위성도 못 본다(7월 19번 중 맑음 0번). "그 땅을 본 건 레이더뿐"이라는 사실이 레이더를 배워야 할 이유를 대신 말한다.
- 후렴 "보이지 않는 땅을, 보고 있었다"가 이 본질을 정확히 짚는다.

## 3. 다섯 기준으로 본 지금 (1~5, 추정)

| 기준 | 점수 | 근거 | 빈 곳 |
|---|---|---|---|
| Relevance | 5 | NISAR GCOV 11회 시계열, HH/HV 편파, 물리적 원인 가설, 사람이 바꾸는 땅(농사). 챌린지의 "고려할 것"을 거의 다 다룸. "춤"을 실측으로 움직이는 선으로 | — |
| Creativity | 5 | "두 번 가려진 땅" 구도, 구름 문지르기 → 레이더, 미션 하나에 레이더 특징 하나, 다섯 곡선이 한 줄로 춤 | — |
| Validity | 4 | 숲 대비 보정, WorldCover 대조(철원 논 78.7% / DMZ 안 0.6%), 창 안 구름 직접 측정, 강수 대조, 설명 못 하는 날(10/21)을 숨기지 않음, 자동 테스트 | 11번 중 10번 PROVISIONAL, 변동 지도가 화면용 영상으로 만든 거친 판, 한 계절, 사각형 구역 |
| Impact | 3 | 출입 불가 + 광학 공백, 제3땅굴 관람객 53만 명(외국인 77%) | "누가 무엇을 하려고 꼭 써야 하나"가 약하다. 실제 사용·수요 증거 없음. 챌린지의 "actionable"을 절반만 채움 |
| Presentation | 5 | 오프닝부터 엔딩까지 한 이야기, 한·영, 밤하늘 톤 | — |

**합계 약 22/25.** 강점이 분명하고, 약점은 **Impact 하나**에 몰려 있다.

## 4. 수상 가능성

| 상 | 가능성 | 이유 |
|---|---|---|
| 서울 특별상 | 높음 | Best Storytelling(Creativity+Presentation), Challenge Communication(Relevance+Presentation), Research Communication(Validity+Presentation)에 잘 맞는다 |
| 서울 최우수 3팀 | 중간 | 다섯 기준 합계로 순위를 매긴다. Impact가 강한 팀과의 경쟁이다 |
| 글로벌 | 낮음~중간 | 2024·2025 글로벌 수상작은 대부분 "누가 무엇을 결정하는 데 쓰나"가 분명했다(관개, 물 부족, 산불, 파종) |

### 4-1. 서울 115팀 경쟁 구도 (11/15 저녁, 등록 기준, 제출 여부는 모름)

| 챌린지 | 팀 | 우리와의 관계 |
|---|---|---|
| Health Monitoring for Astronauts | 15 | 겹치지 않음 |
| Martian Map | 15 | 겹치지 않음 |
| Flame in Freefall (미세중력 연소) | 11 | 겹치지 않음 |
| Space Mission Design Game | 11 | **스토리텔링·게임 경쟁**(Best Storytelling 등) |
| Junior Astronaut Mission Trainer | 10 | **교육 경쟁**(Impact를 "교육"으로 내세울 팀들) |
| Earth System Trend Detective | 10 | **지구 관측 자료 경쟁** |
| Lunar Landing Site Navigator | 9 | 겹치지 않음 |
| Field Shift: Farms with NASA Data | 9 | **가장 가까운 경쟁**: 농사 + NASA 자료, "농부가 무엇을 결정한다"는 Impact가 원래 분명하다 |
| Abandoned but not Forgotten (스토리텔링) | 8 | 스토리텔링 경쟁 |
| MODIS·VIIRS Hot Spots (산불) | 6 | 지구 관측. 재난 대응이라 Impact가 분명하다 |
| Planet X and SPHEREx | 5 | 겹치지 않음 |
| Moon·Mars Analog | 3 | 겹치지 않음 |
| **Dancing with the SARs** | **2** | 우리와 KimchiBoys(구인 중으로 표시) |
| Earth Information Jukebox | 1 | 겹치지 않음 |

읽은 것:
- **서울 시상은 챌린지 구분 없이 115팀을 한 줄로 세운다.** SAR 팀이 둘뿐이라 Relevance에서 비교당할 상대는 거의 없다. 대신 3등 다툼 상대는 다른 챌린지의 강한 팀이다.
- **희소성은 Creativity에 유리하다.** 심사위원은 비슷한 화성 지도와 우주인 건강 앱을 15개씩 본다. 그 사이에서 "출입 금지 땅 + 레이더 + 춤"은 기억에 남는다.
- **Impact 약점이 상대적으로 더 아프다.** 지구 관측 자료를 쓰는 25팀(Field Shift, Trend Detective, Hot Spots)은 "누가 무엇을 결정하는가"가 챌린지 문구에 이미 들어 있다. 교육으로 Impact를 내세울 팀도 21팀(Junior Trainer, Mission Game)이다. 그래서 "교육" 한 줄만으로는 차별이 안 된다. 우리 Impact의 차별점은 **실측 자료로 보여 주는 교육**과 **530,223명이라는 실제 현장**이다.
- **심사위원 4명이 모두 과학·데이터·CS 배경**(천문연, AWS 우주위성, 서울대 데이터사이언스, 연세대 CS)이다. 실측 숫자, 검증, 한계 공개가 다른 게임·교육 팀보다 앞서는 지점이다. Validity를 깎는 과장은 피한다.
- 특별상 중 덜 붐빌 곳: **Research Communication**(Validity+Presentation), **Scientific Excellence**(Validity+Relevance). Best Storytelling은 게임·스토리텔링 팀 약 30팀과 겨룬다.

**3등 안에 들려면 Impact를 3에서 4로 올리면 된다.** (11/15 저녁: 7번 장 "Who it helps"가 세 사용자 묶음으로 바뀌어 슬라이드 쪽은 됐다. 남은 곳은 공식 페이지 Details의 Benefits 문단이다. 8절 참고) 나머지는 이미 상한에 가깝다. 앱을 고쳐서 오를 점수는 거의 없다.

## 5. 3등 안에 들기 위해 꼭 할 것 (이것만)

원칙: **앱은 손대지 않는다. 고치는 건 심사위원이 실제로 읽는 글뿐이다.**

1. **[필수] 자격 지키기.** 놓치면 점수와 상관없이 끝이다.
   - 개인 체크인 5번 중 4번(11/15 15:00~20:00 시간대 포함), 팀 미팅 전원 1회.
   - 데모·앱 링크를 로그인하지 않은 상태에서 팀원 한 명이 더 열어 본다(`submission.md` 남은 것).
2. **[필수] 앱 동결.** 심사위원은 GitHub Pages를 "그때 상태 그대로" 본다. 오늘도 main 푸시가 이어지고 있다.
   - 시간을 하나 정해(예: 오늘 20:00) 그 뒤로는 main에 푸시하지 않는다. 고칠 게 생기면 브랜치에만 둔다.
   - 동결 직전에 한 번 끝까지 해 보고, 콘솔 오류가 없는지 본다(11/15 오후 배포본 확인: 오류 0).
3. **[필수] Impact를 글로 메우기 — 슬라이드 한 장.** 슬라이드 링크는 고치면 바로 반영되고 다시 제출할 필요가 없다. 가장 위험이 적고 효과가 크다.
   - "누가 / 무엇을 할 수 있게 되나"를 두 사용자로 나눠 쓴다(아래 초안).
4. **[선택] Project Details의 "Benefits and impact"를 같은 내용으로 바꾸기.** 23:59 전에 고치고 **Submit for Judging을 다시 눌러야** 반영된다. 다시 제출하다 실수할 위험이 있으니, jmj가 여유 있을 때만 한다.
5. **[선택] 학습 효과를 진짜 숫자로.** 처음 보는 사람 5명에게 앱 전후로 같은 질문 하나("이 레이더 사진에서 물은 어디?")를 던져 맞힌 수를 센다. **실제로 해 본 결과만** 슬라이드에 쓴다. 못 하면 쓰지 않는다.

### 하지 않을 것

- 새 기능, 새 화면, 새 지역. 대회 전 기능은 이미 충분히 감동적이다. 바꿀수록 깨질 위험만 커진다.
- 숫자를 새로 만들거나 효과를 부풀리는 문장. Validity는 우리의 강점이다.

## 6. Impact 슬라이드·문단 초안 (영어)

> **Who uses it, and what they can do**
>
> - **Visitors, guides and teachers at the DMZ observatories** (530,223 visitors at the Third Tunnel in 2025, 77% from abroad): in a few minutes, a first-time visitor learns to read five things in any radar image. No install, no login, Korean and English.
> - **Anyone who must watch land they cannot enter, in seasons cameras cannot see:** our method needs only free NISAR GCOV and a nearby forest as reference. On the DMZ it already separates farmed land (2.1 dB) from unfarmed land (0.6–0.7 dB), and the same steps can be repeated for other closed areas.
>
> Next: test with visitors at an observatory and measure how many can read a radar image before and after.

- 숫자는 모두 `submission.md`에 이미 있는 것이다(새로 만든 숫자 없음).
- 두 번째 사용자는 "할 수 있다"가 아니라 "같은 방법을 되풀이할 수 있다"로 쓴다. 실제로 그 사용자를 만나 본 적은 없기 때문이다.

## 7. 대회 뒤에 디벨롭할 것 (효과 큰 순서)

1. 전망대 현장 시험: QR → 3분짜리 짧은 판, 앞뒤 질문으로 학습 효과 측정.
2. 출입할 수 없는 땅의 작물 계절 추적으로 쓰임새를 넓히기(표현은 지금처럼 "농경지로 보이는 땅" 수준으로 중립을 지킨다).
3. Validity 마감: 원자료(30 m) 변동 지도, 125번 궤도 추가, 두 번째 계절.
4. 다른 출입 금지 지역에 같은 틀 적용.

## 8. 공식 페이지 점검 (11/15 저녁, 실제 제출본 기준)

**처리함(11/15 17:25 다시 제출, "Project Submitted for Judging" 확인): 아래 표의 앞 두 줄을 고쳤다. Summary와 글꼴 줄은 그대로 뒀다.**

결론: **고칠 가치가 있는 건 Details 두 곳뿐이다.** 효과는 작지만, 가장 약한 기준(Impact)을 심사위원이 실제로 읽는 글에서 올린다. 고치면 23:59 전에 **Submit for Judging을 다시 누르고 "Project Submitted for Judging"이 보이는지 확인**해야 한다(jmj). 다시 제출할 여유가 없으면 고치지 않는다. 슬라이드 7번 장이 이미 같은 내용을 담고 있다.

| 곳 | 지금 | 고칠 것 | 효과 |
|---|---|---|---|
| Details · Benefits and impact | 네 줄. 누가 쓰는지 흐리고 530,223은 앞 문단에만 있음 | 아래 문단으로 바꿈(슬라이드 7번 장과 같은 세 사용자) | Impact 소폭 상승 |
| Details · What the data says | `29% north.Near Daeseong-dong` (줄바꿈 빠짐) | `north.` 뒤에 줄바꿈 | 보기만 |
| Summary | "teaches anyone to read radar", "each teaching one way" | 바꾸지 않음. 고친다면 "helps anyone read radar", "each showing one way"(단어 수 199 그대로) | 아주 작음(학습 효과 과장 줄이기) |
| Other Data · Google Fonts | 앱에서 더는 쓰지 않는 Noto Serif KR, Inter Tight, Nanum Pen Script | 그대로 둔다(출처를 빠뜨린 게 아니라 더 적었을 뿐이라 문제없다) | 없음 |

Benefits and impact 바꿀 글(새 숫자 없음, 모두 `submission.md`·슬라이드 7번 장에 있는 것):

> Benefits and impact.
>
> - Visitors and guides at the DMZ observatories: 530,223 people visited Paju's Third Tunnel in 2025, 77% from abroad, and they can only look across. Five short missions show what radar sees in that land. No install, no login, Korean and English.
> - Teachers and students: a ready-made lesson with one radar concept per mission (repeat passes, dark water, change maps, polarization, night imaging). Open source under Apache 2.0.
> - Anyone following land they cannot enter, in seasons cameras cannot see: free NISAR GCOV and a nearby forest as reference already separate farmed land (2.1 dB) from unfarmed land (0.6–0.7 dB). The same steps can be repeated for other closed areas.
> - Next: test with visitors at an observatory and count how many can read a radar image before and after.
