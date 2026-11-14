# Dancing with DMZ — 트래커

NASA Space Apps 2026 · Dancing with the SARs · 대회 2026-11-14 ~ 11-15

## 진행 중
- [ ] 기획 확정: jmj 결정 초안 확인 (htj·jmj 동의함) → 최종 `decision.md` — hdk(황도경), khs(김현석) · `brainstorming/decision_jmj.md`
- [ ] MVP2~4 프론트 J2~J7 — jmj · `plan.md` 4절
- [ ] H7(여유): 상승 궤도 125·긴 띠·원자료 판, 그리고 MVP 피드백 반영 — htj · `plan.md` 4·5절
- [ ] 데이터: 더 긴 띠, 함께 변한 날 원인, 원자료 캐시 공유 — khs · `plan.md` 4절
- [ ] 대회 전 작업 사용 규정 확인 — 담당 미정 · `brainstorming/decision_jmj.md`

## 결정
- (아직 없음. `decision.md`가 "확정"이 되면 한 줄씩 들어온다)

## 완료
- [x] MVP1 밤사진 한 장: J1 밤사진 화면(변동 지도 레이어, 흰 분계선, 설명 창, i18n 틀) — jmj · `plan.md` 4절
- [x] 로직·데이터 H1~H6: facts, glow(+프레임), opening, glow·landsound, evidence + 테스트 — htj · `interface.md`
- [x] 브레인스토밍 4인 + 3단계 정리 + 결정 초안 — 전원 · `brainstorming/`
- [x] 앱 1차: 다섯 지역 미션 + 아리랑 반주 + 피날레 춤 — `app/`
- [x] 참고 자료: 챌린지 원문, 2025 수상작, 직전 SAR 챌린지 — `ref/`
- [x] 브레인스토밍 템플릿 — `brainstorming/`

## 이 파일 쓰는 규칙 (Claude)
- 한 항목 = 한 줄: `- [ ] 할 일 — 담당 · 근거 파일`. 설명은 근거 파일에 쓰고 여기엔 쓰지 않는다.
- 작업을 시작하거나 끝내거나 담당이 바뀌면 이 파일을 바로 고친다. 끝난 항목은 `[x]`로 바꿔 "완료"로 옮긴다.
- `brainstorming/decision.md`가 생기거나 바뀌면: "결정"에 타깃·필요성·문제점·해결방안·노리는 상을 한 줄씩 적고, 기획 항목을 "완료"로 옮기고, 결정에서 나온 다음 할 일을 "진행 중"에 한 줄씩 추가한다.
- 기획 방법은 `brainstorming_method.md`, 근거 자료는 `ref/README.md`를 본다.
- 구현은 `plan.md`를 따른다: 자기 소유 파일만 고치고(1절), 데이터·함수는 `interface.md`에 있는 것만 쓰고, 푸시 전에 fetch → rebase → `npm test` → push(6절).
