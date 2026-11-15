// 밤하늘 둘러보기의 밤하늘 연출(hdk). 값과 상관없는 장식이라 금빛 관측 띠 바깥에만 그린다.
//  ① 별: 화면 위쪽의 짙은 밤하늘 띠에만 뜬다(땅 위에 두면 먼지처럼 보여서). 아래로 갈수록 드물고 옅어지며, 몇 개만 천천히 깜박인다
//  ② 위성: '한 계절 재생' 중 관측이 한 번 쌓일 때마다 NISAR가 북에서 남으로 띠를 훑고 지나간다(하강 궤도).
//     실제로 띠 전체를 한 번에 찍지만, 지나가는 모습은 연출이다. 화면 아래 안내에 그렇게 적는다
import { state, subscribe, data } from '../state.js';

const cv = document.createElement('canvas'); cv.id = 'night-sky'; cv.setAttribute('aria-hidden', 'true');
const cx = cv.getContext('2d');
let stars = null, timer = 0, sweep = null, on = false;

function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const SKY = 0.24;   // 화면 높이의 위쪽 이만큼이 밤하늘(style.css 의 위쪽 그라데이션과 같은 폭)
function makeStars() {   // 화면 비율(0~1) 좌표. 위쪽일수록 촘촘하고 밝다
  if (stars) return stars;
  const r = rnd(20261115), out = [];
  for (let i = 0; i < 170; i++) {
    const v = Math.pow(r(), 1.8);   // 0(맨 위)에 몰리게
    out.push({ u: r(), v: v * SKY, size: 0.5 + r() * r() * 1.3, base: (0.2 + r() * 0.5) * (1 - v * 0.85), tw: r() < 0.18 ? 0.5 + r() * 1.4 : 0, ph: r() * 6.28 });
  }
  return (stars = out);
}
function size() {
  const d = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * d; cv.height = innerHeight * d; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  cx.setTransform(d, 0, 0, d, 0, 0);
}
function draw() {
  const m = window.__dmzMap; if (!m || !on) return;
  cx.clearRect(0, 0, innerWidth, innerHeight);
  const t = performance.now() / 1000;
  for (const s of makeStars()) {
    const p = { x: s.u * innerWidth, y: s.v * innerHeight };
    const a = s.tw ? s.base * (0.55 + 0.45 * Math.sin(t * s.tw + s.ph)) : s.base;
    cx.fillStyle = `rgba(223,232,255,${a.toFixed(3)})`;
    cx.beginPath(); cx.arc(p.x, p.y, s.size, 0, 6.283); cx.fill();
  }
  if (sweep) drawSweep(m, t);
}
// 띠의 북쪽 끝에서 남쪽 끝까지 빛줄기가 내려간다. 줄기 위에 작은 위성 하나
function drawSweep(m) {
  const k = (performance.now() - sweep.start) / sweep.ms;
  if (k >= 1) { sweep = null; return; }
  const b = data.corridor?.bounds || [[126.35, 37.57], [128.65, 38.81]];
  const top = m.project([(b[0][0] + b[1][0]) / 2, b[1][1] + 0.15]).y, bot = m.project([(b[0][0] + b[1][0]) / 2, b[0][1] - 0.15]).y;
  const y = top + (bot - top) * (k * k * (3 - 2 * k)), fade = Math.sin(Math.PI * k);
  const g = cx.createLinearGradient(0, y - 46, 0, y + 6);
  g.addColorStop(0, 'rgba(255,214,140,0)'); g.addColorStop(0.85, `rgba(255,224,170,${(0.16 * fade).toFixed(3)})`); g.addColorStop(1, `rgba(255,240,210,${(0.5 * fade).toFixed(3)})`);
  cx.fillStyle = g; cx.fillRect(0, y - 46, innerWidth, 52);
  const x = innerWidth * (0.62 - 0.08 * k);   // 하강 궤도라 남쪽으로 가며 조금씩 서쪽으로 비낀다
  cx.fillStyle = `rgba(255,247,224,${(0.95 * fade).toFixed(3)})`;
  cx.beginPath(); cx.arc(x, y - 52, 2.6, 0, 6.283); cx.fill();
  cx.fillStyle = `rgba(255,214,140,${(0.35 * fade).toFixed(3)})`;
  cx.beginPath(); cx.arc(x, y - 52, 7, 0, 6.283); cx.fill();
}
// 별 반짝임은 느린 움직임이라 초당 30번만 다시 그린다(빛줄기가 지나가는 동안만 매 프레임). 가만히 둔 화면에서 그리기 부하를 절반으로(jmj 제안, 로컬 시험)
let drawnAt = 0;
function loop() { const n = performance.now(); if (sweep || n - drawnAt >= 30) { drawnAt = n; draw(); } if (on) timer = requestAnimationFrame(loop); }
function apply() {
  const want = state.screen === 'night' && state.nightMode === 'explore';
  if (want === on) return;
  on = want; cv.hidden = !on;
  if (on) { size(); timer = requestAnimationFrame(loop); } else { cancelAnimationFrame(timer); cx.clearRect(0, 0, innerWidth, innerHeight); sweep = null; }
}
// 재생 중 관측 하나가 쌓이는 시간 안에 한 번 훑는다
export function passSweep(ms) { if (on) sweep = { start: performance.now(), ms: Math.max(1200, Math.min(3200, ms * 0.95)) }; }   // 관측 하나 사이를 거의 다 써서 천천히

export function initNightSky() {
  document.body.append(cv); cv.hidden = true;
  addEventListener('resize', () => on && size());
  subscribe((s, prev) => { if (s.screen !== prev.screen || s.nightMode !== prev.nightMode) apply(); });
  apply();
}
