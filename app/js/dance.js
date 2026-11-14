// 춤추는 DMZ 선: 군사분계선을 지도 화면에 투영해 그리고, 조각을 모은 구간만 기준선에서 벗어나게 한다.
// 벗어나는 높이 = 그 지역 주 구역의, 지금 고른 날짜의 신호 변화(calc.heights). 땅이 실제로 움직인 것(지표 변위)이 아니다.
import { state, subscribe, data } from './state.js';
import { STOPS, centerOf } from './stops.js';
import { heights, heightAt } from './calc.js';

const HEIGHT_PX = 22;   // 높이 1(다섯 지역에서 가장 큰 변화)이 화면에서 차지하는 픽셀

export function initDance(map) {
  const host = map.getContainer(), canvas = document.createElement('canvas');
  canvas.id = 'dance'; canvas.setAttribute('aria-hidden', 'true'); host.append(canvas);
  const ctx = canvas.getContext('2d'), calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ids = STOPS.map(s => s.id), lon = STOPS.map(s => centerOf(s)[0]);
  const H = heights(data.zones, ids, data.passes.length);
  const line = data.boundary.features[0].geometry.coordinates;
  const shown = ids.map(() => 0);
  let pts = [], dirty = true, raf = 0, W = 0, Hh = 0;

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
    pts = raw.map((p, j) => {
      const a = raw[Math.max(0, j - 3)], b = raw[Math.min(raw.length - 1, j + 3)], d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      // 서→동으로 걸을 때의 왼쪽(대체로 북쪽)을 + 로 삼는다. 점마다 뒤집지 않아야 세로 구간에서 선이 꺾이지 않는다
      const nx = (b.y - a.y) / d, ny = -(b.x - a.x) / d;
      return { x: p.x, y: p.y, nx, ny, ...between(p.lon) };
    });
    dirty = false;
  }

  function draw() {
    raf = 0;
    if (dirty) project();
    ctx.clearRect(0, 0, W, Hh);
    let moving = false;
    ids.forEach((id, i) => {
      const target = state.fragments.includes(id) ? heightAt(H[id], state.cycle) : 0, d = target - shown[i];
      shown[i] += Math.abs(d) < .003 ? d : d * (calm.matches ? .08 : .2);
      if (Math.abs(target - shown[i]) > .003) moving = true;
    });
    if (state.fragments.length) {
      ctx.beginPath();
      let pen = false;
      for (const p of pts) {
        const lit = state.fragments.includes(ids[p.w < .5 ? p.i : Math.min(ids.length - 1, p.i + 1)]);
        if (!lit) { pen = false; continue; }
        const h = shown[p.i] + ((shown[p.i + 1] ?? shown[p.i]) - shown[p.i]) * p.w, x = p.x + p.nx * h * HEIGHT_PX, y = p.y + p.ny * h * HEIGHT_PX;
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true;
      }
      ctx.strokeStyle = '#ffe1a2'; ctx.lineWidth = 2.6; ctx.shadowColor = '#ebc178'; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
    }
    if (moving) request();
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(draw); };
  map.on('move', () => { dirty = true; request(); });
  map.on('resize', () => { dirty = true; request(); });
  subscribe(request); request();
}
