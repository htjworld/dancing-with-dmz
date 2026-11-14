# Dancing with DMZ — 트래커

NASA Space Apps 2026 · Dancing with the SARs · 대회 2026-11-14 ~ 11-15

## 진행 중
- [ ] 전원: 원격 주소 바꾸기 `git remote set-url origin https://github.com/htjworld/dancing-with-dmz.git` — jmj, hdk, khs · `plan.md` 9절
- [ ] 제출 준비 체크리스트(영어 Summary, Use of SI 공개, LICENSE, Submit for Judging) — 전원 · `plan.md` 10절
- [ ] 제출 문구 검토: `submission.md` 초안(Summary 168단어, Details, Use of SI, Data, References) — 전원 · `submission.md`
- [ ] 기획 확정: jmj 결정 초안 확인 (htj·jmj·hdk 동의함, hdk 의견 `brainstorming/decision_hdk.md`) → 최종 `decision.md` — khs(김현석) · `brainstorming/decision_jmj.md`
- [ ] 팀 전체 피드백 1회 (11/15 13:00~14:00) → 반영 → 18:00 동결 → J7 데모 → 23:00 제출 — 전원 · `plan.md` 진행 방식
- [ ] 막힌 일(H7 토큰, 운영진 문의, 결정 확정) — 각 담당 · `todo.md`
- [ ] 데이터: 더 긴 띠, 함께 변한 날 원인, 원자료 캐시 공유 — khs · `plan.md` 4절
- [ ] 대회 전 작업 사용 규정 확인 — 담당 미정 · `brainstorming/decision_jmj.md`

## 결정
- (아직 없음. `decision.md`가 "확정"이 되면 한 줄씩 들어온다)

## 완료
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
