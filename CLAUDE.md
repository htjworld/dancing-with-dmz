# Dancing with DMZ — 트래커

NASA Space Apps 2026 · Dancing with the SARs · 대회 2026-11-14 ~ 11-15

## 진행 중
- [ ] 전원: 원격 주소 바꾸기 `git remote set-url origin https://github.com/htjworld/dancing-with-dmz.git` — khs (hdk·jmj 완료) · `plan.md` 9절
- [ ] 제출 준비 체크리스트(영어 Summary, Use of SI 공개, LICENSE, Submit for Judging) — 전원 · `plan.md` 10절
- [ ] 제출 문구 검토: `submission.md` 초안(Summary 168단어, Details, Use of SI, Data, References) — 전원 · `submission.md`
- [ ] 기획 확정: jmj 결정 초안 확인 (htj·jmj·hdk 동의함, hdk 의견 `brainstorming/decision_hdk.md`) → 최종 `decision.md` — khs(김현석) · `brainstorming/decision_jmj.md`
- [ ] 스토리 디벨롭안(후렴 "보이지 않는 땅을, 보고 있었다", 멈춘 선 → 춤추는 선) 검토, 디자인을 오프닝부터 hdk가 맡는 소유권 확인 — jmj·전원 · `brainstorming/story_hdk.md`, `plan.md` 5절
- [ ] 팀 전체 피드백 1회 (11/15 13:00~14:00) → 반영 → 18:00 동결 → J7 데모 → 23:00 제출 — 전원 · `plan.md` 진행 방식
- [ ] 막힌 일(H7 토큰, 운영진 문의, 결정 확정) — 각 담당 · `todo.md`
- [ ] 데이터: 더 긴 띠, 함께 변한 날 원인, 원자료 캐시 공유 — khs · `plan.md` 4절
- [ ] 대회 전 작업 사용 규정 확인 — 담당 미정 · `brainstorming/decision_jmj.md`

## 결정
- (아직 없음. `decision.md`가 "확정"이 되면 한 줄씩 들어온다)

## 완료
- [x] **제출 완료(11/15 11:59, Project Submitted for Judging)**: Summary·Details·NASA Data 4건·Other Data 15건·데모 링크(미리캔버스 7장). 띠 단면 숫자와 하강 궤도 표기를 다시 확인함 — jmj · `submission.md`
- [x] 게임 위쪽 단추 줄 자리: 미션 창이 보이면 그 왼쪽, 엔딩·결과 카드처럼 창이 숨으면 오른쪽 위 구석(실제 단추 폭으로 간격 계산) — hdk · `screens/night.js`
- [x] 게임 화면 톤 맞추기와 문구 정리: 밤 지도·남색 창·Pretendard, 미션 n. 제목과 첫 카드 목표 한 줄, 조각 수 n / 5, '← 처음으로'(영상 끝 제목 장면으로), 미션 시작 문구, 결과 카드 가독성, 전 화면 줄바꿈, 기본 언어 영어, 영상 장면 줄 영어 — hdk · `style.css`, `main.js`·`i18n.js`(jmj 확인 요청은 `plan.md` 보드), `film.js`, `night.js`, `state.js`, `index.html`
- [x] README를 현재 앱 흐름·제출 양식에 맞춰 개정(다섯 단계, SI 사용 고지에 Higgsfield 영상, 팀 NASSAFY, 라이선스, 화면 캡처 3장). 궤도 방향 표기와 띠 단면 숫자는 htj 확인 전이라 뺌 — jmj · `README.md`, `demo/screens/`
- [x] `LICENSE` 추가(Apache License 2.0), 제출 원고 개정: Summary 199단어(누구나 레이더를 읽게 한다는 점을 앞에), Details에 효과·창의성 문단, 궤도 방향 표현 삭제 — jmj · `LICENSE`, `submission.md`, `demo/slides.md`
- [x] 제출 원고를 현재 앱 흐름에 맞춰 다시 채움(Use of SI에 Higgsfield 생성 영상 공개), 7장 슬라이드 원고 — jmj · `submission.md`, `demo/slides.md`
- [x] 소개 영상 오른쪽 아래에 "SI-generated video" 표시(생성 영상 표시 규정) — jmj · `app/js/main.js`, `i18n.js`, `style.css`
- [x] 밤하늘 빛 한 칸이 원래 색(보라·노랑)으로 남던 문제: 지도가 다 그려질 때마다 다시 칠한 그림으로 맞추고, 불러오기 실패 시 다시 칠함 — hdk · `screens/nightglow.js`
- [x] 근거 창 개편(지역 단추): 카드 없이 오른쪽 어둠 위 결론 제목·선 끝 이름표·금빛/회청 색, 지도에 같은 색 구역 테두리와 이름표, 지역을 고르면 왼쪽 글은 제목만, 왼쪽·아래 가장자리 어둠 — hdk · `screens/proof.js`(jmj 확인 요청), `night.js`, `style.css`, `i18n.js`
- [x] 밤하늘 둘러보기 3판: 밤 지도 + 금빛 빛(분계선에서 멀어질수록·띠 끝·바다 위 옅게, 물 면은 빛 위로), 카드 없는 글·아래 조작 줄, 띠 전체 단면 그래프(분계선 2 km 안 10% / 남 15% / 북 29%), 누르면 그 구간 단면, 대성동 예외 표시, 자료와 한계 패널. 영상: 건너뛰기는 제목 장면에서 멈춤, 장면 이동 때 앞 자막 지우기. 단추 이름 '밤하늘 둘러보기' — hdk · `screens/night.js`, `nightglow.js`, `film.js`, `style.css`, `i18n.js`, `tools/make_section.py`, `data/section.json` (map.js 두 줄 jmj 확인 요청, 숫자 출처 htj 확인 요청은 `plan.md` 보드)
- [x] 오프닝 → 밤하늘 잇기와 밤하늘 2차: 오프닝을 밤하늘 톤(은하수·뷰파인더·자막형 글)으로, 레이더 사진이 점으로 풀리며 지구로 멀어지는 도입, 영상 단축(제목까지 약 12초 줄임), 멈춤·장면 점프·구석 건너뛰기, 영상 중 바탕 지도 밤하늘 톤, 끝에 춤추는 제목. 은하수 그림의 창 크기 0 오류 수정 — hdk · `screens/opening.js`(jmj 확인 요청), `film.js`, `globe.js`, `style.css`, `i18n.js`
- [x] 연속 관측 띠 구현: 양쪽 22km, 11개 관측일·인접 22장면 원자료 추출, 경계선·재생·땅 연주 연결 및 검수 — khs · `interface.md` 2-1a
- [x] 밤하늘 영상 1차 초안: 점 지구본(은하수 배경, 위성이 비추며 돌고 DMZ로 확대) → 물결 선(다섯 지역 가로줄이 관측마다 실제 값으로 흔들림, 금빛 = 크게 흔들린 곳), 눈금 11칸, 자막 한·영, 음악 96초로 이어 붙임 — hdk · `app/js/screens/film.js`, `globe.js`, `tools/make_ridges.py` (jmj·htj 확인 요청은 `plan.md` 5절)
- [x] 게임 개편: 한 지역을 소개 카드 → 놀기 → 결과 카드 세 박자로. 파주 필름 고르기, 연천 강 따라 긋기, 철원 전후 사진 견주기, 화천 커튼 밀기, 양구 끌어서 가장 많이 변한 곳 찾기. 조각 받는 순간 연출, 팝업 디자인 '밤하늘의 선', 지도 위 선 다시 그리기, 결과 카드(한 줄 결론·막대·관련 영상 자리·? 단추), 문구 다듬기 — jmj · `app/js/views/**`, `screens/gamemap.js`, `main.js`, `dance.js`, `map.js`, `stops.js`, `i18n.js`, `style.css`
- [x] 엔딩·조각 소리: 밤하늘 주제가 엔딩에서 가락을 얹어 완성(35초), 조각을 받을 때 주제 한 마디 — jmj · `app/js/screens/nightmusic.js`
- [x] 스토리안(`brainstorming/story_hdk.md`) 1~3순위 반영: 구름 첫 줄, 밤하늘 영상 자막(반전·멈춘 선), 조각마다 레이더 읽는 법, 엔딩 자막과 구름 회상 — jmj · `app/js/i18n.js`, `screens/film.js`, `dance.js`
- [x] 오프닝 문지르기 안내: 손 모양이 한 번 쓸어 레이더를 드러내 보이고 좌우로 흔들리며 기다린다. 직접 문지르면 사라짐 — jmj · `app/js/screens/opening.js`
- [x] htj 요청 처리: 근거 패널에 토지피복·강수 표시, 구역 한계 문구 수정. 밤하늘 영상의 한계 자막은 NISAR 소개 문구로 교체 — jmj · `screens/proof.js`, `i18n.js`
- [x] 밤하늘 개편: 설명 창 대신 나레이션 자막과 함께 스스로 흐르는 48초 영상(파주→양구로 DMZ를 따라 이동, 통과가 쌓이며 빛남), 끝나면 게임으로. 기존 설명 창은 '직접 둘러보기'로 남김 — jmj · `app/js/screens/film.js`
- [x] 저장소 이관(htjworld), 공개 전환, GitHub Pages(Actions) 배포: https://htjworld.github.io/dancing-with-dmz/ — htj · `plan.md` 9절
- [x] 미션 화면 아래의 조각 줄과 악기 이름(킥·하이햇 등) 제거. 피날레 단추는 양구 미션 창 안으로 — jmj · `app/js/main.js`, `views/yanggu.js`
- [x] 미션 날짜 선택: 다섯 지역 모두 날짜 단추 대신 슬라이더(자료 없는 7/29 제외). 파주는 밝기 숫자·그래프를 두 날을 모두 맞힌 뒤에 공개 — jmj · `app/js/screens/dateslider.js`, `views/paju.js`
- [x] 방향 점검(공식 심사 기준): 유지, 약점은 Impact·Validity 마감 — htj · `brainstorming/direction_check_htj.md`
- [x] CI/CD 파이프라인: 모든 push 테스트, main은 테스트 통과 시 Pages 배포 — htj · `.github/workflows/deploy.yml`
- [x] 토지피복 대조(ESA WorldCover: 철원 논 78.7%·북쪽 82.9% 경작지, DMZ 안 0.6%), 함께 변한 날 강수(8/22 39 mm, 10/21 0.2 mm) — htj · `interface.md` 2-4, 3
- [x] J6 한·영 전환: 모든 화면(오프닝, 밤사진, 땅 연주, 근거, 다섯 미션, 피날레 자막, 구역 이름표)이 영어로 나온다. `?lang=en` — jmj · `app/js/i18n.js`
- [x] 요청 처리: 창 안 구름 측정(`hls_window.py`), 오프닝 `window_cloud_pct`, 7월 근거로 좁힘 — htj · `plan.md` 5절
- [x] MVP3 프론트: J4 땅 연주(지도를 쓸면 소리, 고요한 땅은 쉼), J5 근거 패널(숲 대비 곡선, 변동 폭, 한계 문구, 미션 진입) — jmj · `plan.md` 4절
- [x] MVP2 프론트: J2 구름 문지르기 오프닝, J3 밤사진 한 계절 재생(밤하늘에 어울리는 잔잔한 곡, `app/js/screens/nightmusic.js`) — jmj · `plan.md` 4절
- [x] MVP1 밤사진 한 장: J1 밤사진 화면(변동 지도 레이어, 흰 분계선, 설명 창, i18n 틀) — jmj · `plan.md` 4절
- [x] 로직·데이터 H1~H6: facts, glow(+프레임), opening, glow·landsound, evidence + 테스트 — htj · `interface.md`
- [x] 브레인스토밍 4인 + 3단계 정리 + 결정 초안 — 전원 · `brainstorming/`
- [x] 앱 1차: 다섯 지역 미션 + 반주 + 피날레 춤 — `app/`
- [x] 참고 자료: 챌린지 원문, 2025 수상작, 직전 SAR 챌린지 — `ref/`
- [x] 브레인스토밍 템플릿 — `brainstorming/`

## 이 파일 쓰는 규칙 (Claude)
- 한 항목 = 한 줄: `- [ ] 할 일 — 담당 · 근거 파일`. 설명은 근거 파일에 쓰고 여기엔 쓰지 않는다.
- 작업을 시작하거나 끝내거나 담당이 바뀌면 이 파일을 바로 고친다. 끝난 항목은 `[x]`로 바꿔 "완료"로 옮긴다.
- `brainstorming/decision.md`가 생기거나 바뀌면: "결정"에 타깃·필요성·문제점·해결방안·노리는 상을 한 줄씩 적고, 기획 항목을 "완료"로 옮기고, 결정에서 나온 다음 할 일을 "진행 중"에 한 줄씩 추가한다.
- 기획 방법은 `brainstorming_method.md`, 근거 자료는 `ref/README.md`를 본다.
- 진행은 "4절 전부 만들기 → 전체 피드백 1회 → 수정"이다. 중간 피드백으로 멈추지 않는다.
- 구현은 `plan.md`를 따른다: 자기 소유 파일만 고치고(1절), 데이터·함수는 `interface.md`에 있는 것만 쓰고, 푸시 전에 fetch → rebase → `npm test` → push(6절).
