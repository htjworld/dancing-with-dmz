// 춤추는 DMZ 선: 군사분계선을 지도 화면에 투영해 그리고, 조각을 모은 구간을 기준선에서 벗어나게 한다.
// 움직임은 네 겹이다.
//   ① 높이   = 그 지역 주 구역의, 그 시점의 신호 변화(실측)
//   ② 멈춤   = 자료가 없는 통과(실측)
//   ③ 점프   = 모든 땅이 함께 오른 날(실측)
//   ④ 출렁임 = 박자에 맞춘 작은 파동(연출). 피날레에서만 나온다.
// 어느 것도 땅이 실제로 움직인 것(지표 변위)이 아니다.
import { state, subscribe, data, pass, rainAt } from './state.js';
import { STOPS, centerOf } from './stops.js';
import { heights, heightAt, togetherDays, change } from './calc.js';
import { heightAtProgress, isRestAt, jumpAt, cycleAt } from './rhythm.js';
import { BEAT } from './music.js';
import { t, dateText } from './i18n.js';

const HEIGHT_PX = 22, JUMP_PX = 16, WOBBLE_PX = 4;   // 높이 1(다섯 지역에서 가장 큰 변화)·점프·출렁임이 화면에서 차지하는 픽셀

export function initDance(map) {
  const host = map.getContainer(), canvas = document.createElement('canvas');
  canvas.id = 'dance'; canvas.setAttribute('aria-hidden', 'true'); host.append(canvas);
  const ticker = document.getElementById('ticker');
  const ctx = canvas.getContext('2d'), calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ids = STOPS.map(s => s.id), lon = STOPS.map(s => centerOf(s)[0]), n = data.passes.length;
  const H = heights(data.zones, ids, n);
  const scale = Math.max(...ids.flatMap(id => data.passes.map(p => Math.abs(change(data.zones.find(z => z.region === id && z.role === 'main'), p.cycle) ?? 0))));
  const forest = data.zones.find(z => z.id === 'cheorwon-forest');
  const Hforest = data.passes.map(p => { const v = change(forest, p.cycle); return v == null ? null : v / scale; });   // 철원의 숲: 논이 숲에서 벗어나는 것이 보이게 옅게 함께 그린다
  const together = togetherDays(data.zones).map(d => d.cycle);
  const line = data.boundary.features[0].geometry.coordinates;
  const shown = ids.map(() => 0);
  let shownForest = 0, pts = [], dirty = true, raf = 0, W = 0, Hh = 0, tickerCycle = -1;

  // 선 위의 점이 어느 두 지역 사이에 있는지(지역 중심을 조절점으로 삼아 높이를 부드럽게 잇는다)
  const between = l => {
    if (l <= lon[0]) return { i: 0, w: 0 };
    for (let i = 0; i < lon.length - 1; i++) if (l <= lon[i + 1]) return { i, w: (l - lon[i]) / (lon[i + 1] - lon[i]) };
    return { i: lon.length - 1, w: 0 };
  };

  function project() {
    W = host.clientWidth; Hh = host.clientHeight; const dpr = devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const raw = line.map(([x, y]) => ({ ...map.project([x, y]), lon: x }));
    let dist = 0;
    pts = raw.map((p, j) => {
      if (j) dist += Math.hypot(p.x - raw[j - 1].x, p.y - raw[j - 1].y);
      const a = raw[Math.max(0, j - 3)], b = raw[Math.min(raw.length - 1, j + 3)], d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      // 서→동으로 걸을 때의 왼쪽(대체로 북쪽)을 + 로 삼는다. 점마다 뒤집지 않아야 세로 구간에서 선이 꺾이지 않는다
      return { x: p.x, y: p.y, nx: (b.y - a.y) / d, ny: -(b.x - a.x) / d, d: dist, ...between(p.lon) };
    });
    dirty = false;
  }

  function caption(prog) {
    const c = cycleAt(prog, n);
    if (c === tickerCycle) return;
    tickerCycle = c;
    const p = pass(c), rain = rainAt('cheorwon', c);
    let text = dateText(p.date);
    if (p.rest) text += t('dance.rest');
    else if (together.includes(c)) text += t('dance.together') + (rain == null ? '' : rain >= 10 ? t('dance.rain', { mm: rain.toFixed(0) }) : t('dance.dry'));
    ticker.textContent = text;
  }

  function draw(now) {
    raf = 0;
    if (dirty) project();
    ctx.clearRect(0, 0, W, Hh);
    const play = state.playing, elapsed = play ? (now - play.at) / 1000 : 0, active = play && elapsed >= 0 && elapsed < play.duration;
    const finale = active && play.mode === 'finale', preview = active && play.mode === 'preview';
    const prog = active ? Math.max(0, elapsed / play.duration) : state.cycle / n + 1e-6;
    const lit = id => finale || state.fragments.includes(id);
    let moving = false;
    ids.forEach((id, i) => {
      // 미리 듣기 동안에는 듣는 구간만 한 계절을 한 번 훑고, 그 밖에는 타임라인에서 고른 날짜의 높이를 따른다
      const sweep = finale || (preview && play.ids.includes(id));
      const target = !lit(id) ? 0 : sweep ? heightAtProgress(H[id], prog) : heightAt(H[id], state.cycle), d = target - shown[i];
      shown[i] += Math.abs(d) < .003 ? d : d * (calm.matches ? .08 : .25);
      if (Math.abs(target - shown[i]) > .003) moving = true;
    });
    const ghost = finale || state.fragments.includes('cheorwon');
    const fTarget = !ghost ? 0 : finale ? heightAtProgress(Hforest, prog) : heightAt(Hforest, state.cycle);
    shownForest += (fTarget - shownForest) * (calm.matches ? .08 : .25);
    if (Math.abs(fTarget - shownForest) > .003) moving = true;

    const rest = finale && isRestAt(H[ids[0]], prog), jump = finale && !calm.matches ? jumpAt(together, prog, n) : 0;
    const wobble = finale && !calm.matches && !rest, beats = elapsed / BEAT;
    if (finale) caption(prog);
    ticker.hidden = !finale;
    if (!finale) tickerCycle = -1;

    if (ghost) {   // 철원 구간의 숲 선
      ctx.beginPath(); let pen = false;
      for (const p of pts) {
        if ((p.w < .5 ? p.i : p.i + 1) !== 2) { pen = false; continue; }
        const off = shownForest * HEIGHT_PX + jump * JUMP_PX, x = p.x + p.nx * off, y = p.y + p.ny * off;
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
      }
      ctx.strokeStyle = 'rgba(160,240,190,.7)'; ctx.lineWidth = 1.3; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (finale || state.fragments.length) {
      ctx.beginPath(); let pen = false;
      for (const p of pts) {
        const near = p.w < .5 ? p.i : Math.min(ids.length - 1, p.i + 1);
        if (!lit(ids[near])) { pen = false; continue; }
        const h = shown[p.i] + ((shown[p.i + 1] ?? shown[p.i]) - shown[p.i]) * p.w, slow = near === 3 ? .5 : 1;   // 화천은 반 박자의 느린 왈츠
        const beat = wobble ? Math.sin(p.d * .045 - beats * Math.PI * slow) * WOBBLE_PX : 0;                       // 박자에 맞춘 기본 출렁임(연출)
        const off = h * HEIGHT_PX + jump * JUMP_PX + beat, x = p.x + p.nx * off, y = p.y + p.ny * off;
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
      }
      ctx.strokeStyle = '#ffe1a2'; ctx.lineWidth = finale ? 3 : 2.6; ctx.lineJoin = 'round'; ctx.shadowColor = '#ebc178'; ctx.shadowBlur = finale ? 20 : 14; ctx.stroke(); ctx.shadowBlur = 0;
    }
    if (active || moving) request();
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(draw); };
  map.on('move', () => { dirty = true; request(); });
  map.on('resize', () => { dirty = true; request(); });
  // 언어가 바뀌면 자막을 지금 언어로 다시 쓴다
  subscribe((s, prev) => { if (s.lang !== prev.lang) tickerCycle = -1; request(); }); request();
}
