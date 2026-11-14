// 오프닝 — 구름 문지르기. 7월의 광학 위성 영상(구름)을 문지르면 같은 달의 NISAR 레이더 영상이 드러난다.
// 두 영상은 같은 범위(opening.json 의 corners)라서 같은 틀에 포개 놓고 위 영상만 지운다. 마우스·터치·키보드 모두 된다.
import { state, set, subscribe, data, fact } from '../state.js';
import { t, dateText } from '../i18n.js';
import { startFilm } from './film.js';

const el = document.getElementById('opening');
const GRID = [48, 41];          // 얼마나 걷었는지 세는 거친 격자
const ENOUGH = 0.3;             // 이만큼 걷으면 다음으로 넘어가는 단추가 나온다
const BRUSH = 0.07;             // 붓의 반지름(영상 너비에 대한 비율)
let seen = null, cleared = 0, revealed = false, canvas = null, ctx = null, last = null;

const o = () => data.opening;

function mark(u, v) {
  const [gw, gh] = GRID, r = BRUSH * gw;
  for (let y = Math.max(0, Math.floor(v * gh - r)); y <= Math.min(gh - 1, Math.ceil(v * gh + r)); y++)
    for (let x = Math.max(0, Math.floor(u * gw - r)); x <= Math.min(gw - 1, Math.ceil(u * gw + r)); x++)
      if ((x - u * gw) ** 2 + (y - v * gh) ** 2 <= r * r && !seen[y * gw + x]) { seen[y * gw + x] = 1; cleared++; }
}
function rub(e) {
  const b = canvas.getBoundingClientRect(), u = (e.clientX - b.left) / b.width, v = (e.clientY - b.top) / b.height;
  const x = u * canvas.width, y = v * canvas.height;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = BRUSH * 2 * canvas.width; ctx.lineCap = ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(last ? last[0] : x, last ? last[1] : y); ctx.lineTo(x + .01, y + .01); ctx.stroke();
  last = [x, y]; mark(u, v);
  if (!revealed && cleared / seen.length >= ENOUGH) reveal(false);
}
// 다 걷어 보여 준다(단추·키보드용). 문질러서 넘은 경우에는 남은 구름을 그대로 둔다.
function reveal(all) {
  revealed = true; touched();
  if (all) canvas.classList.add('gone');
  text();
}

function text() {
  const d = o();
  el.querySelector('.words').innerHTML = revealed
    ? `<p class="eye">${t('opening.eyeRadar', { date: dateText(d.radar.date) })}</p>
       <h2>${t('opening.titleRadar')}</h2>
       <p class="fact">${t('night.fact', { n: fact('july_clear_optical'), looks: fact('july_optical_looks') })}</p>
       <p class="fine">${t('caveat.cloud_window')}</p>
       <div class="acts"><button type="button" class="primary" data-enter>${t('opening.enter')}</button></div>`
    : `<p class="eye">${t('opening.eyeOptical', { date: dateText(d.optical.date) })}</p>
       <h2>${t('opening.titleOptical')}</h2>
       <p>${t('opening.hint', { pct: Math.round(d.optical.window_cloud_pct ?? d.optical.cloud_pct) })}</p>
       <div class="acts"><button type="button" data-reveal>${t('opening.reveal')}</button><button type="button" class="quiet" data-enter>${t('opening.skip')}</button></div>`;
}

// ---- 문지르기 안내: 손 모양이 구름 위를 한 번 쓸어 아래의 레이더를 살짝 드러내 보인 뒤, 그 자리에서 좌우로 흔들린다.
// 사용자가 직접 문지르기 시작하면 사라진다. 시범으로 지운 자리는 '얼마나 걷었나'에 세지 않는다.
let demoTimer = 0;
function touched() {
  clearInterval(demoTimer); demoTimer = 0;
  el.querySelector('.frame')?.classList.add('touched');
}
function demo() {
  const hint = el.querySelector('.rub-hint'), hand = el.querySelector('.rub-hand');
  if (!hint || !hand) return;
  const place = (u, v) => { hand.style.left = `${u * 100}%`; hand.style.top = `${v * 100}%`; };
  const path = k => [.3 + .4 * k, .5 + .05 * Math.sin(k * Math.PI * 2)];   // 가운데를 왼쪽에서 오른쪽으로, 살짝 물결치며
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { place(.5, .5); hint.classList.add('idle'); return; }
  const t0 = performance.now(), DUR = 1500; let prev = null;
  clearInterval(demoTimer);
  demoTimer = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0 - 500) / DUR);   // 0.5초 기다렸다가 시작한다
    if (k < 0) return place(...path(0));
    const [u, v] = path(k), x = u * canvas.width, y = v * canvas.height;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = BRUSH * 1.3 * canvas.width; ctx.lineCap = ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(prev ? prev[0] : x, prev ? prev[1] : y); ctx.lineTo(x + .01, y + .01); ctx.stroke();
    prev = [x, y]; place(u, v);
    if (k >= 1) { clearInterval(demoTimer); demoTimer = 0; place(.5, .5); hint.classList.add('idle'); }   // 끝나면 가운데에서 좌우로 흔들리며 기다린다
  }, 30);
}

function build() {
  const d = o(), [gw, gh] = GRID;
  seen = new Uint8Array(gw * gh); cleared = 0; revealed = false; last = null;
  el.innerHTML = `
    <div class="sheet">
      <div class="frame">
        <img class="radar" src="data/${d.radar.file}" alt="${t('opening.altRadar')}">
        <canvas width="1184" height="1019" aria-label="${t('opening.altOptical')}"></canvas>
        <div class="rub-hint" aria-hidden="true"><i class="rub-hand"></i><span class="rub-label">${t('opening.rub')}</span></div>
      </div>
      <div class="words" aria-live="polite"></div>
    </div>`;
  canvas = el.querySelector('canvas'); ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(img, 0, 0); demo(); };
  img.src = `data/${d.optical.file}`;
  let down = false;
  canvas.addEventListener('pointerdown', e => { touched(); down = true; last = null; try { canvas.setPointerCapture(e.pointerId); } catch { /* 붙잡을 수 없는 포인터여도 문지르기는 된다 */ } rub(e); });
  canvas.addEventListener('pointermove', e => { if (down) rub(e); });
  const up = () => { down = false; last = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  text();
}

export function initOpening() {
  if (!o()) return;
  el.addEventListener('click', e => {
    if (e.target.closest('[data-reveal]')) return reveal(true);
    if (e.target.closest('[data-enter]')) startFilm();   // 누른 순간이라 소리를 낼 수 있다. 밤하늘 영상이 시작된다
  });
  subscribe((s, prev) => {
    if (s.screen === 'opening' && (prev.screen !== 'opening' || s.lang !== prev.lang)) build();
  });
  if (state.screen === 'opening') build();
}
