// 지도 위의 구역 표시: 네모 상자 대신, 색연필로 둘러 그린 것 같은 고리.
// 구역은 팀이 레이더 영상에서 고른 사각형이다. 고리는 그 사각형을 둘러싼 손그림이고, 계산은 사각형 안에서 한다(그 사실은 결과 카드의 ? 에 적혀 있다).
import { state, subscribe, data } from '../state.js';
import { missionReady } from '../missions.js';


const NS = 'http://www.w3.org/2000/svg';
// 지도에 표시하는 구역: 그 미션에서 실제로 보는 땅만. 나머지 구역(숲 기준 등)은 계산에는 쓰지만 지도에는 그리지 않는다
// 이름은 지도 위에서 읽히도록 짧게 쓴다([한국어, 영어]). 온전한 이름과 단서는 미션 안내와 결과 카드의 ? 에 있다
const SHOWN = {
  paju: { 'paju-dmz_farm': ['경작지', 'Farmland'] },
  yeoncheon: {},
  hwacheon: { 'hwacheon-dmz': ['DMZ 안 숲', 'DMZ forest'], 'hwacheon-north': ['북쪽 땅', 'North'] },
  yanggu: {},
};
export const INK = { main: '#ffd76a', cmp: '#8fc4ff', ref: '#9df0b5' };   // 구역의 역할별 색연필 색

// 씨앗이 같으면 늘 같은 모양이 나오는 난수(지도를 움직여도 고리의 생김새가 바뀌지 않게)
function rng(text) {
  let h = 2166136261;
  for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// 화면 좌표의 네 모서리(q)를 둘러싸는 손그림 고리의 길(path). 한 바퀴를 조금 넘겨 그려서 끝이 처음과 살짝 어긋난다
export function loopPath(q, seed) {
  const xs = q.map(p => p.x), ys = q.map(p => p.y), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const rx = (Math.max(...xs) - Math.min(...xs)) / 2 * 1.2 + 7, ry = (Math.max(...ys) - Math.min(...ys)) / 2 * 1.26 + 7;
  const r = rng(seed), n = 26, a0 = r() * Math.PI * 2, turn = Math.PI * 2 + .5, tilt = (r() - .5) * .16, pts = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n, a = a0 + turn * k, grow = .97 + k * .07, wob = 1 + (r() - .5) * .07;   // 조금씩 벌어지며 흔들린다
    const x = Math.cos(a) * rx * grow * wob, y = Math.sin(a) * ry * grow * wob;
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) d += `Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${((pts[i][0] + pts[i + 1][0]) / 2).toFixed(1)},${((pts[i][1] + pts[i + 1][1]) / 2).toFixed(1)}`;
  return { d, cx, cy, rx, ry };
}

// 구역 표시(hdk, 11/15): 색연필 고리 대신 위성 뷰파인더처럼 네 모서리의 짧고 가는 꺾쇠. 오프닝의 뷰파인더와 같은 모양이다.
// 함께 쓰는 spotSvg 가 구역 바깥을 부드럽게 눌러 볼 땅만 떠오르게 한다. 판정·계산은 그대로 사각형 안에서 한다.
// 돌려주는 cx·cy·rx·ry 는 꺾쇠 상자의 가운데와 반폭이고(이름 자리·누르는 자리), box 는 상자 네 변이다
export function loopSvg(q, seed, color, draw = false) {
  const xs = q.map(p => p.x), ys = q.map(p => p.y), x0 = Math.min(...xs) - 4, x1 = Math.max(...xs) + 4, y0 = Math.min(...ys) - 4, y1 = Math.max(...ys) + 4;
  const L = Math.max(6, Math.min(14, (x1 - x0) / 4, (y1 - y0) / 3));
  const d = [`M${x0} ${y0 + L}V${y0}H${x0 + L}`, `M${x1 - L} ${y0}H${x1}V${y0 + L}`, `M${x0} ${y1 - L}V${y1}H${x0 + L}`, `M${x1 - L} ${y1}H${x1}V${y1 - L}`]
    .map(s => s.replace(/-?\d+\.\d+/g, n => (+n).toFixed(1))).join('');
  return { d, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2, box: [x0, y0, x1, y1],
    html: `<path d="${d}" class="af-halo"/><path d="${d}" class="af${draw ? ' draw' : ''}" style="--af:${color}"/>` };
}
// 구역 바깥을 살짝 어둡게: 상자 자리만 뚫린 덮개. 가장자리는 흐리게 번진다(id 는 그림마다 달라야 한다)
export function spotSvg(id, boxes) {
  if (!boxes.length) return '';
  return `<defs><filter id="${id}-b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter>
    <mask id="${id}-m"><rect x="0" y="0" width="100%" height="100%" fill="#fff"/><g filter="url(#${id}-b)">${boxes.map(([x0, y0, x1, y1]) => `<rect x="${(x0 - 4).toFixed(1)}" y="${(y0 - 4).toFixed(1)}" width="${(x1 - x0 + 8).toFixed(1)}" height="${(y1 - y0 + 8).toFixed(1)}" rx="12" fill="#000"/>`).join('')}</g></mask></defs>
    <rect class="spot" x="0" y="0" width="100%" height="100%" mask="url(#${id}-m)"/>`;
}

// 색연필의 거친 결을 내는 필터(한 번만 넣는다)
export const PENCIL = `<defs><filter id="pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;

export function initZones(map) {
  const host = map.getContainer(), svg = document.createElementNS(NS, 'svg');
  svg.id = 'ink'; svg.setAttribute('aria-hidden', 'true');
  host.append(svg);
  let shownKey = '', shownAt = '';
  // 미션을 푸는 동안에만 그린다(레이더 영상이 켜져 있을 때). 철원은 이름을 가린 두 땅을 따로 그리므로 여기서는 쉰다
  const zonesNow = () => {
    const s = state;
    if (s.screen !== 'mission' || s.stop === 'cheorwon' || !s.introSeen.includes(s.stop) || missionReady(s.stop, s.seen[s.stop])) return [];
    return data.zones.filter(z => z.region === s.stop && SHOWN[s.stop]?.[z.id]);
  };
  const paint = () => {
    const zs = zonesNow(), key = `${state.stop}|${zs.length}|${state.lang}`, fresh = key !== shownKey;   // 새로 나타날 때만 그려지는 움직임을 준다
    // 지도도 구역도 그대로면 다시 그리지 않는다(커튼을 밀거나 강을 긋는 동안 상태가 자주 바뀐다)
    const c = map.getCenter(), at = `${key}|${c.lng.toFixed(5)},${c.lat.toFixed(5)},${map.getZoom().toFixed(3)},${host.clientWidth}x${host.clientHeight}`;
    if (at === shownAt) return;
    shownAt = at; shownKey = key;
    // 이름이 서로, 또는 다른 고리와 겹치지 않는 자리를 고른다: 고리의 위 → 아래 → 오른쪽 → 왼쪽 순서로 놓아 본다
    const SIZE = 12.5, loops = zs.map(z => {
      const b = z.bounds, q = [[b[0], b[3]], [b[2], b[3]], [b[2], b[1]], [b[0], b[1]]].map(c => map.project(c));
      return { z, color: '#fff', L: loopSvg(q, z.id, '#fff', fresh) };
    });
    const hit = (p, r) => p.x0 < r.x1 && p.x1 > r.x0 && p.y0 < r.y1 && p.y1 > r.y0, placed = [];
    const ring = o => ({ x0: o.L.cx - o.L.rx, x1: o.L.cx + o.L.rx, y0: o.L.cy - o.L.ry, y1: o.L.cy + o.L.ry });
    const labels = loops.map(o => {
      const name = SHOWN[o.z.region][o.z.id][state.lang === 'en' ? 1 : 0], w = [...name].reduce((n, ch) => n + (ch.charCodeAt(0) > 255 ? .95 : .58), 0) * SIZE, { cy } = o.L, [bx0, by0, bx1, by1] = o.L.box;
      const spots = [[bx0 + 1, by0 - 7, 'start'], [bx0 + 1, by1 + SIZE + 4, 'start'], [bx1 + 8, cy + SIZE * .35, 'start'], [bx0 - 8, cy + SIZE * .35, 'end']];   // 이름은 왼쪽 위 꺾쇠 바로 위부터
      const box = ([x, y, anchor]) => { const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x; return { x0, x1: x0 + w, y0: y - SIZE, y1: y + 4 }; };
      const free = spots.find(sp => { const r = box(sp); return r.y0 > 66 && r.x0 > 4 && !placed.some(p => hit(p, r)) && !loops.some(other => other !== o && hit(ring(other), r)); }) || spots[0];
      placed.push(box(free));
      return `<text x="${free[0].toFixed(1)}" y="${free[1].toFixed(1)}" text-anchor="${free[2]}" style="fill:${o.color};font-size:${SIZE}px" class="${fresh ? 'draw' : ''}">${name}</text>`;
    });
    svg.innerHTML = zs.length ? spotSvg('ink-spot', loops.map(o => o.L.box)) + loops.map(o => o.L.html).join('') + labels.join('') : '';
  };
  map.on('move', paint); map.on('resize', paint);
  subscribe(paint); paint();
}
