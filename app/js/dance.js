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
import { ENDING_BEAT as BEAT } from './screens/nightmusic.js';   // 엔딩 곡의 느린 박(1초)
import { t, dateText } from './i18n.js';
import { fact } from './state.js';
import { STOPS as ALL, label } from './stops.js';
import { sunElev, sky } from './views/yanggu.js';

const STAR = 4;      // 엔딩의 마지막 장면(초): 선이 다섯 별을 잇는 별자리로 남는다
const SWEEP = .6;    // 한 통과의 시간 가운데 위성이 서쪽에서 동쪽으로 훑는 데 쓰는 몫
const GATHER = 10;   // 엔딩의 첫 장면(초): 선이 서쪽부터 한 구간씩 켜지며, 그 지역에서 배운 레이더의 특징이 한 줄씩 나온다
const HEIGHT_PX = 22, JUMP_PX = 16, WOBBLE_PX = 4;   // 높이 1(다섯 지역에서 가장 큰 변화)·점프·출렁임이 화면에서 차지하는 픽셀

export function initDance(map) {
  const host = map.getContainer(), canvas = document.createElement('canvas');
  canvas.id = 'dance'; canvas.setAttribute('aria-hidden', 'true'); host.append(canvas);
  const ticker = document.getElementById('ticker');
  const dusk = document.createElement('div'); dusk.id = 'ending-sky'; dusk.setAttribute('aria-hidden', 'true'); host.insertBefore(dusk, canvas);
  const ctx = canvas.getContext('2d'), calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ids = STOPS.map(s => s.id), lon = STOPS.map(s => centerOf(s)[0]), n = data.passes.length;
  const H = heights(data.zones, ids, n);
  const scale = Math.max(...ids.flatMap(id => data.passes.map(p => Math.abs(change(data.zones.find(z => z.region === id && z.role === 'main'), p.cycle) ?? 0))));
  const forest = data.zones.find(z => z.id === 'cheorwon-forest');
  const Hforest = data.passes.map(p => { const v = change(forest, p.cycle); return v == null ? null : v / scale; });   // 철원의 숲: 논이 숲에서 벗어나는 것이 보이게 옅게 함께 그린다
  const together = togetherDays(data.zones).map(d => d.cycle);
  const line = data.boundary.features[0].geometry.coordinates;
  const shown = ids.map(() => 0);
  let shownForest = 0, pts = [], stars = [], dirty = true, raf = 0, W = 0, Hh = 0, tickerCycle = -1, zoomK = 1;

  // 선 위의 점이 어느 두 지역 사이에 있는지(지역 중심을 조절점으로 삼아 높이를 부드럽게 잇는다)
  const between = l => {
    if (l <= lon[0]) return { i: 0, w: 0 };
    for (let i = 0; i < lon.length - 1; i++) if (l <= lon[i + 1]) return { i, w: (l - lon[i]) / (lon[i + 1] - lon[i]) };
    return { i: lon.length - 1, w: 0 };
  };

  function project() {
    W = host.clientWidth; Hh = host.clientHeight; const dpr = Math.min(1.5, devicePixelRatio || 1);   // 빛나는 선은 1.5배면 충분하다(큰 화면에서 그리는 값을 줄인다)
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const raw = line.map(([x, y]) => ({ ...map.project([x, y]), lon: x }));
    let dist = 0;
    pts = raw.map((p, j) => {
      if (j) dist += Math.hypot(p.x - raw[j - 1].x, p.y - raw[j - 1].y);
      const a = raw[Math.max(0, j - 12)], b = raw[Math.min(raw.length - 1, j + 12)], d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      // 서→동으로 걸을 때의 왼쪽(대체로 북쪽)을 + 로 삼는다. 점마다 뒤집지 않아야 세로 구간에서 선이 꺾이지 않는다
      return { x: p.x, y: p.y, nx: (b.y - a.y) / d, ny: -(b.x - a.x) / d, d: dist, ...between(p.lon) };
    });
    // 지도를 멀리서 볼수록 선이 분계선에서 덜 떠오르게 한다(화면 픽셀로 고정하면 멀리서는 딴 곳을 지나는 것처럼 보인다)
    zoomK = Math.max(.28, Math.min(1.1, 2 ** (map.getZoom() - 10.5)));
    stars = lon.map(l => raw.reduce((best, q, j) => (Math.abs(q.lon - l) < Math.abs(raw[best].lon - l) ? j : best), 0));
    dirty = false;
  }

  // 엔딩 나레이션: 통과 순서에 맞춰 한 문장씩. 자료 없는 통과 → '단 하루', 그 뒤 → '보고 있었다', 끝 무렵 구름으로 돌아갔다가 후렴
  const endLine = document.getElementById('ending-line'), cloud = document.getElementById('ending-cloud');
  const restCycle = data.passes.find(p => p.rest)?.cycle ?? -1;
  let lineKey = null;
  // 구름으로 돌아가는 문장에는 자료의 숫자를 넣는다(7월 광학 19번 중 맑은 날 0번, 레이더 12번 중 11번)
  const vars = () => ({ looks: fact('july_optical_looks'), clear: fact('july_clear_optical'), passes: fact('passes'), total: data.passes.length });
  function say(key, html) {
    const id = html ? `${key}|${html}` : key;
    if (id === lineKey) return;
    lineKey = id;
    endLine.innerHTML = key ? `<span>${html || t(key, vars())}</span>` : '';
    const back = key === 'ending.cloud' && data.opening?.optical?.file;   // 오프닝의 7월 구름으로 잠깐 돌아간다
    if (back) { const img = cloud.querySelector('img'); img.src = `data/${data.opening.optical.file}`; img.alt = t('ending.cloudAlt'); }
    cloud.hidden = !back;
  }
  const lineFor = c => (restCycle < 0 ? (c < n - 2 ? 'ending.start' : 'ending.last')
    : c < restCycle ? 'ending.start' : c === restCycle ? 'ending.rest' : c <= restCycle + 3 ? 'ending.resume' : c <= n - 3 ? 'ending.cloud' : 'ending.last');

  function caption(prog) {
    const c = cycleAt(prog, n);
    say(lineFor(c));
    if (c === tickerCycle) return;
    tickerCycle = c;
    // 날짜를 글로 읽어 주지 않는다. 한 계절의 통과를 점으로 늘어놓고, 지금 지나는 점만 밝힌다. 자료가 없는 통과는 빈 고리로 남는다
    if (!ticker.dataset.built || ticker.dataset.built !== state.lang) {
      ticker.dataset.built = state.lang;
      ticker.innerHTML = `<span>${dateText(data.passes[0].date)}</span><span class="dots">${data.passes.map(p => `<i class="${p.rest ? 'rest' : ''}"></i>`).join('')}</span><span>${dateText(data.passes[n - 1].date)}</span>`;
      ticker.setAttribute('aria-hidden', 'true');
    }
    [...ticker.querySelectorAll('.dots i')].forEach((d, k) => { d.classList.toggle('on', k <= c); d.classList.toggle('now', k === c); });
  }

  function draw(now) {
    raf = 0;
    if (dirty) project();
    ctx.clearRect(0, 0, W, Hh);
    const play = state.playing, elapsed = play ? (now - play.at) / 1000 : 0, active = play && elapsed >= 0 && elapsed < play.duration;
    const finale = active && play.mode === 'finale', preview = active && play.mode === 'preview';
    // 엔딩은 두 토막이다: 처음 GATHER 초는 모으기(선이 서쪽부터 켜진다), 그 뒤가 한 계절을 훑는 춤
    const gather = finale && elapsed < GATHER, gathered = finale ? Math.min(ids.length - 1, Math.floor(elapsed / (GATHER / ids.length))) : -1;
    // 마지막 STAR 초는 별자리 장면이다. 그 앞까지가 한 계절을 훑는 춤
    const starK = finale ? Math.max(0, Math.min(1, (elapsed - (play.duration - STAR)) / 1.6)) : 0, dancing = finale && !gather;
    const prog = finale ? Math.max(0, Math.min(.9999, (elapsed - GATHER) / (play.duration - GATHER - STAR))) : active ? Math.max(0, elapsed / play.duration) : state.cycle / n + 1e-6;
    const lit = id => (finale ? ids.indexOf(id) <= gathered : state.fragments.includes(id));
    let moving = false;
    ids.forEach((id, i) => {
      // 미리 듣기 동안에는 듣는 구간만 한 계절을 한 번 훑고, 그 밖에는 타임라인에서 고른 날짜의 높이를 따른다
      const sweep = finale || (preview && play.ids.includes(id));
      const target = !lit(id) || gather ? 0 : sweep ? heightAtProgress(H[id], prog) : heightAt(H[id], state.cycle), d = target - shown[i];
      shown[i] += Math.abs(d) < .003 ? d : d * (calm.matches ? .08 : .25);
      if (Math.abs(target - shown[i]) > .003) moving = true;
    });
    const ghost = finale || state.fragments.includes('cheorwon');
    const fTarget = !ghost || gather ? 0 : finale ? heightAtProgress(Hforest, prog) : heightAt(Hforest, state.cycle);
    shownForest += (fTarget - shownForest) * (calm.matches ? .08 : .25);
    if (Math.abs(fTarget - shownForest) > .003) moving = true;

    const rest = finale && !gather && isRestAt(H[ids[0]], prog), jump = finale && !gather && !calm.matches ? jumpAt(together, prog, n) : 0;
    const wobble = finale && !gather && !calm.matches && !rest, beats = elapsed / BEAT;
    const k = finale ? Math.max(zoomK, .85) : active ? Math.max(zoomK, .5) : zoomK;   // 춤추는 동안에는 멀리서도 움직임이 보여야 한다
    if (gather) {   // 모으기: 그 지역에서 배운 특징 한 줄
      const st = ALL[gathered];
      say('gather', `<small>${label(st, 'name').split(' ')[0]}</small>${t(`${st.id}.feature`)}`);
    } else if (finale) caption(prog);
    ticker.hidden = !finale || gather || starK > 0;
    // 하늘(연출): 춤추는 동안 그 통과가 찍힌 저녁 7시 25분의 하늘. 여름에는 노을빛, 가을에는 밤
    const skyOn = finale && !gather;
    if (skyOn) { const c = cycleAt(prog, n), e = sunElev(c) ?? 0; if (dusk.dataset.c !== String(c)) { dusk.dataset.c = c; dusk.style.background = sky(e); dusk.classList.toggle('night', e < -6); } }
    dusk.classList.toggle('on', skyOn);
    if (!finale) { tickerCycle = -1; say(null); }   // 엔딩이 끝나면 자막을 걷는다. 후렴은 끝난 뒤의 요약 카드에 남는다

    if (ghost) {   // 철원 구간의 숲 선
      ctx.beginPath(); let pen = false;
      for (const p of pts) {
        if ((p.w < .5 ? p.i : p.i + 1) !== 2) { pen = false; continue; }
        const off = (shownForest * HEIGHT_PX + jump * JUMP_PX) * k, x = p.x + p.nx * off, y = p.y + p.ny * off;
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
      }
      ctx.strokeStyle = 'rgba(160,240,190,.7)'; ctx.lineWidth = 1.3; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
    }
    // 위성이 훑는 자리(0 = 서쪽 끝, 1 = 동쪽 끝). 자료가 없는 통과에는 위성이 지나가지 않고 선이 그대로 멈춘다
    let cNow = 0, cPrev = 0, sweepU = 2;
    if (dancing) { const pos = prog * n, c = Math.min(n - 1, Math.floor(pos)); cNow = c; cPrev = Math.max(0, c - 1); sweepU = H[ids[0]][c] == null ? -1 : (pos - c) / SWEEP; }
    const total = pts.length ? pts[pts.length - 1].d || 1 : 1;
    // 모으기 동안 선이 구간째 뚝뚝 켜지지 않고, 서쪽 끝에서 동쪽 끝까지 한 줄기로 스르르 자라난다(hdk). 끝은 부드럽게 번진다
    const gk = gather ? Math.min(1, elapsed / (GATHER * .92)) : 1, revealD = total * gk * gk * (3 - 2 * gk);
    const hOf = (p, c) => { const a = heightAt(H[ids[p.i]], c), b = heightAt(H[ids[Math.min(ids.length - 1, p.i + 1)]], c); return a + (b - a) * p.w; };
    if (finale || state.fragments.length) {
      // 이어진 구간마다 점을 모은다: 분계선 위의 자리(bx, by)와 거기서 떠오른 자리(x, y)
      const runs = []; let run = null;
      for (const p of pts) {
        const near = p.w < .5 ? p.i : Math.min(ids.length - 1, p.i + 1);
        if (gather ? p.d > revealD : !lit(ids[near])) { run = null; continue; }
        let h = shown[p.i] + ((shown[p.i + 1] ?? shown[p.i]) - shown[p.i]) * p.w; const slow = near === 3 ? .5 : 1;
        if (dancing) {   // 위성이 지나간 서쪽은 오늘의 높이, 아직 안 지나간 동쪽은 지난번의 높이
          const m = Math.max(0, Math.min(1, (sweepU * 1.06 - p.d / total) / .07)), ease = m * m * (3 - 2 * m);
          h = hOf(p, cPrev) + (hOf(p, cNow) - hOf(p, cPrev)) * ease;
        }   // 화천은 반 박자의 느린 왈츠
        const beat = wobble ? Math.sin(p.d * .045 - beats * Math.PI * slow) * WOBBLE_PX : 0;                       // 박자에 맞춘 기본 출렁임(연출)
        const off = (h * HEIGHT_PX + jump * JUMP_PX + beat) * k * (1 - starK);   // 별자리 장면에서는 선이 분계선 위로 내려앉는다
        if (!run) runs.push(run = []);
        run.push({ x: p.x + p.nx * off, y: p.y + p.ny * off, bx: p.x, by: p.y, d: p.d });
      }
      // 점 사이를 둥글게 잇는다(꺾인 자리가 모나지 않게)
      const trace = (r, kx, ky, move) => {
        if (move) ctx.moveTo(r[0][kx], r[0][ky]);
        for (let j = 1; j < r.length - 1; j++) ctx.quadraticCurveTo(r[j][kx], r[j][ky], (r[j][kx] + r[j + 1][kx]) / 2, (r[j][ky] + r[j + 1][ky]) / 2);
        ctx.lineTo(r[r.length - 1][kx], r[r.length - 1][ky]);
      };
      ctx.lineJoin = ctx.lineCap = 'round';
      ctx.globalAlpha = 1 - starK * .72;
      for (const r of runs) {
        if (r.length < 3) continue;
        const first = r[0], last = r[r.length - 1];
        // 양 끝은 스르르 사라진다(뚝 끊기지 않게)
        const fade = (rgb, alpha) => { const g = ctx.createLinearGradient(first.bx, first.by, last.bx, last.by);
          g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(.05, `rgba(${rgb},${alpha})`); g.addColorStop(.95, `rgba(${rgb},${alpha})`); g.addColorStop(1, `rgba(${rgb},0)`); return g; };
        // ① 빛의 띠: 멈춘 분계선(점선)과 떠오른 선 사이를 옅게 채운다. 선이 어긋난 것이 아니라 분계선에서 떠오른 것으로 읽히게 한다
        ctx.beginPath(); trace(r, 'x', 'y', true);
        for (let j = r.length - 1; j >= 0; j--) ctx.lineTo(r[j].bx, r[j].by);
        ctx.closePath(); ctx.fillStyle = fade('255,225,162', finale ? .2 : .13); ctx.fill();
        // ② 번지는 빛 두 겹
        ctx.beginPath(); trace(r, 'x', 'y', true); ctx.strokeStyle = fade('255,214,140', .1); ctx.lineWidth = finale ? 18 : 13; ctx.stroke();
        ctx.beginPath(); trace(r, 'x', 'y', true); ctx.strokeStyle = fade('255,225,162', .3); ctx.lineWidth = finale ? 7 : 5.5; ctx.stroke();
        ctx.beginPath(); trace(r, 'x', 'y', true); ctx.strokeStyle = fade('255,236,190', .35); ctx.lineWidth = finale ? 4 : 3.2; ctx.stroke();
        // ③ 가운데 밝은 줄기
        ctx.beginPath(); trace(r, 'x', 'y', true); ctx.strokeStyle = fade('255,246,224', 1); ctx.lineWidth = finale ? 2.2 : 1.8;
        ctx.stroke();
        // ④ 선 위의 별빛: 소리가 나는 동안에만 반짝인다(연출)
        if (active && !calm.matches) {
          for (let j = 6; j < r.length - 6; j += 9) {
            const tw = Math.sin(elapsed * 2.4 + r[j].d * .21);
            if (tw < .35) continue;
            ctx.beginPath(); ctx.arc(r[j].x, r[j].y - 5 - tw * 4, .7 + tw * 1.1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,250,235,${(tw * .9).toFixed(2)})`; ctx.fill();
          }
        }
      }
    }
    ctx.globalAlpha = 1;
    // 별자리: 다섯 지역의 자리에 별이 뜨고 그 사이가 이어진다
    if (starK > 0 && stars.length === ids.length && pts.length) {
      const sp = stars.map(j => pts[j]);
      ctx.globalAlpha = starK;
      ctx.beginPath(); sp.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.strokeStyle = 'rgba(255,225,162,.8)'; ctx.lineWidth = 1.4; ctx.stroke();
      // 별에는 글자를 달지 않는다. 이 장면에서는 화면 아래의 마지막 문장 하나만 말한다
      sp.forEach(q => {
        ctx.beginPath(); ctx.arc(q.x, q.y, 11, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,225,162,.18)'; ctx.fill();
        ctx.beginPath(); ctx.arc(q.x, q.y, 3.6, 0, Math.PI * 2); ctx.fillStyle = '#fff6e0'; ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    dusk.classList.toggle('deep', starK > 0);
    document.body.classList.toggle('ending-stars', starK > 0);   // 별자리 장면에서는 지도 위의 지역 구슬과 이름을 걷는다(별과 겹친다)
    if (active || moving) request();
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(draw); };
  // 지도가 움직이는 그 프레임에 바로 다시 그린다(다음 프레임으로 미루면 확대·축소 중에 선이 한 박자 늦게 따라온다)
  const now = () => { dirty = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } draw(performance.now()); };
  map.on('move', now);
  map.on('resize', now);
  addEventListener('resize', () => { dirty = true; request(); });
  // 언어가 바뀌면 자막을 지금 언어로 다시 쓴다
  subscribe((s, prev) => { if (s.lang !== prev.lang) { tickerCycle = -1; const k = lineKey; lineKey = null; say(k); } request(); }); request();
}
