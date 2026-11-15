// 밤하늘 둘러보기의 빛 지도(연속 관측 띠, 또는 다섯 지역 창)를 남색 밤 위의 금빛으로 다시 칠한다(hdk).
// 원래 그림(보라→노랑)의 빨강 채널이 곧 변동 폭(0 ~ scale_db 의 최댓값)이라, 그 값으로 투명도와 색을 정한다.
// 변화가 작은 땅은 투명해져 밤 지도가 비치고, 크게 변한 땅만 금빛으로 남는다. 값 자체는 바꾸지 않는다(색만 바꾼다).
// map.js 는 window.__glowUrl(파일) 이 주소를 주면 그 그림을 쓰고, 아직 없으면(null) 원래 그림을 쓴다.
import { state, data } from '../state.js';
import { regionAt, sampleDb } from '../glow.js';

const RAMP = [[0.18, [110, 52, 18]], [0.42, [212, 132, 46]], [0.68, [255, 206, 118]], [1, [255, 247, 224]]];
const LO = 0.15, HI = 0.55;   // 이 값(최댓값에 대한 비율) 아래는 투명, 위로 갈수록 진하게(숲의 잔물결은 비우고 들판만 남긴다)
const SIZE = 640;              // 다시 칠한 그림의 한 변(원본 1024). 지도를 끌 때 가볍게
const FADE = 0.3;              // 관측 띠 폭(분계선에서 half_width_km)의 바깥 절반에서 서서히 흐려진다

// 분계선까지의 거리(km): 그림마다 거친 격자에서 재고 그 사이는 보간한다(띠의 테두리와 둥근 끝이 밤 지도에 녹아들게)
let LINE = null;
function lineKm() {
  if (LINE) return LINE;
  const f = data.boundary?.features?.find(x => x.geometry?.type === 'LineString');
  const c = f ? f.geometry.coordinates : [];
  const step = Math.max(1, Math.floor(c.length / 500));
  LINE = c.filter((_, i) => i % step === 0 || i === c.length - 1);
  return LINE;
}
export function distKm(lon, lat) {   // 분계선까지의 거리(km)
  const L = lineKm(); if (L.length < 2) return 0;
  const kx = 111.32 * Math.cos(lat * Math.PI / 180), ky = 110.57;
  let best = Infinity;
  for (let i = 1; i < L.length; i++) {
    const ax = (L[i - 1][0] - lon) * kx, ay = (L[i - 1][1] - lat) * ky, bx = (L[i][0] - lon) * kx, by = (L[i][1] - lat) * ky;
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    const ex = ax + dx * t, ey = ay + dy * t, d = ex * ex + ey * ey;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
// 분계선 양 끝 너머(서쪽 한강 하구 시작점, 동쪽 해안 끝점)는 끝 방향으로 END_KM 동안 옅어지게 한다.
// 동쪽은 바다에서 끝나 납작한데 서쪽만 김포·강화 땅 위로 둥글게 뻗던 것을 양쪽 똑같이 맞춘다
const END_KM = 10;
let ENDS = null;
function ends() {   // [끝점, 선 안쪽으로 약 5 km 들어간 점에서 끝점으로 향하는 단위 방향(km 좌표)]
  if (ENDS) return ENDS;
  const L = lineKm(), C = cum(), tot = C[C.length - 1];
  const pick = (end, km) => {
    const i = end ? C.findIndex(c => c >= tot - km) : C.findIndex(c => c >= km);
    const a = L[end ? L.length - 1 : 0], b = L[Math.max(0, i)], k = 111.32 * Math.cos(a[1] * Math.PI / 180);
    const dx = (a[0] - b[0]) * k, dy = (a[1] - b[1]) * 110.57, n = Math.hypot(dx, dy) || 1;
    return { a, ux: dx / n, uy: dy / n };
  };
  return (ENDS = L.length > 2 ? [pick(false, 5), pick(true, 5)] : []);
}
function endKeep(lon, lat) {
  let keep = 1;
  for (const { a, ux, uy } of ends()) {
    const k = 111.32 * Math.cos(lat * Math.PI / 180), beyond = (lon - a[0]) * k * ux + (lat - a[1]) * 110.57 * uy;
    keep *= smooth(END_KM, 0, beyond);
  }
  return keep;
}
function fadeGrid(corners, n = 40) {   // n x n 격자의 흐림 배율(0~1)
  const H = data.corridor?.half_width_km || 22, g = new Float32Array((n + 1) * (n + 1)), [[x0, y0], [x1, y1], , [x3, y3]] = corners;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const u = i / n, v = j / n, lon = x0 + u * (x1 - x0) + v * (x3 - x0), lat = y0 + u * (y1 - y0) + v * (y3 - y0);
    g[j * (n + 1) + i] = data.corridor ? smooth(H, H * (1 - FADE), distKm(lon, lat)) * endKeep(lon, lat) : 1;
  }
  return { g, n };
}
const grids = new Map();

// 동해 해안선(위도, 그 위도에서 바다가 시작되는 경도). OpenFreeMap 바탕 지도(OpenStreetMap)의 바다 면에서 0.02도 간격으로 읽었다.
// 바다 표면은 바람과 물결로 관측마다 크게 달라져 들판보다 밝게 빛난다. 해안에서 멀어질수록 옅게 그린다(값은 그대로다).
const COAST = [[38.06,128.684],[38.08,128.68],[38.10,128.654],[38.12,128.634],[38.14,128.618],[38.16,128.61],[38.18,128.614],[38.20,128.598],[38.22,128.596],[38.24,128.578],[38.26,128.562],[38.28,128.554],[38.30,128.55],[38.32,128.532],[38.34,128.52],[38.36,128.51],[38.38,128.506],[38.40,128.482],[38.42,128.468],[38.44,128.456],[38.46,128.458],[38.48,128.442],[38.50,128.428],[38.52,128.42],[38.54,128.409],[38.56,128.405],[38.58,128.385],[38.60,128.369],[38.62,128.359],[38.64,128.363],[38.66,128.339],[38.68,128.361],[38.70,128.331],[38.71,128.323],[38.72,128.205],[38.74,128.199],[38.76,128.181],[38.78,128.161],[38.80,128.135],[38.82,128.123],[38.84,128.091],[38.86,128.005]];
function coastLon(lat) {
  if (lat < COAST[0][0] || lat > COAST[COAST.length - 1][0]) return Infinity;
  for (let i = 1; i < COAST.length; i++) if (lat <= COAST[i][0]) {
    const [a, la] = COAST[i - 1], [b, lb] = COAST[i];
    return la + (lb - la) * (lat - a) / (b - a);
  }
  return Infinity;
}
const SEA_OUT = 0.06;   // 해안선에서 바다 쪽으로 이만큼(경도, 약 5 km) 가는 동안 서서히 옅어진다. 띠의 다른 끝처럼 둥글게 사라지게
const seaKeep = (lon, lat) => smooth(SEA_OUT, 0, lon - coastLon(lat));
const mercY = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const latOf = y => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI;
const cache = new Map(), pending = new Map();

const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
function ramp(v) {
  if (v <= RAMP[0][0]) return RAMP[0][1];
  for (let i = 1; i < RAMP.length; i++) if (v <= RAMP[i][0]) {
    const [a, ca] = RAMP[i - 1], [b, cb] = RAMP[i], k = (v - a) / (b - a);
    return ca.map((c, j) => c + (cb[j] - c) * k);
  }
  return RAMP[RAMP.length - 1][1];
}
const regions = () => (data.corridor || data.glow)?.regions || {};
const LUT = { a: new Float64Array(256), c: new Uint8ClampedArray(768) };
for (let r = 0; r < 256; r++) { const v = r / 255, col = ramp(v); LUT.a[r] = smooth(LO, HI, v); LUT.c.set(col, r * 3); }

async function recolor(file) {
  const id = Object.keys(regions()).find(k => { const r = regions()[k]; return r.color === file || r.frames.includes(file); });
  if (!grids.has(id)) grids.set(id, fadeGrid(regions()[id].corners));
  const { g, n } = grids.get(id);
  const im = new Image();
  await new Promise((ok, no) => { im.onload = ok; im.onerror = no; im.src = `data/${file}`; });   // decode() 는 화면이 가려지면 끝나지 않을 때가 있다
  const w = Math.min(SIZE, im.naturalWidth), h = Math.round(w * im.naturalHeight / im.naturalWidth);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h);
  const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
  const [[lon0, lat0], [lon1]] = regions()[id].corners, lat3 = regions()[id].corners[3][1];
  const coast = Math.max(lon0, lon1) > 128 ? Array.from({ length: h }, (_, py) => latOf(mercY(lat0) + (py + 0.5) / h * (mercY(lat3) - mercY(lat0)))) : null;   // 동쪽 끝 타일만 바다를 지운다
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) { d[i + 3] = 0; continue; }
    const px = (i >> 2) % w, py = Math.floor((i >> 2) / w), gu = px / (w - 1) * n, gv = py / (h - 1) * n;
    const i0 = Math.min(n - 1, Math.floor(gu)), j0 = Math.min(n - 1, Math.floor(gv)), fu = gu - i0, fv = gv - j0, N = n + 1;
    const fade = (g[j0 * N + i0] * (1 - fu) + g[j0 * N + i0 + 1] * fu) * (1 - fv) + (g[(j0 + 1) * N + i0] * (1 - fu) + g[(j0 + 1) * N + i0 + 1] * fu) * fv;
    const sea = coast ? seaKeep(lon0 + (px + 0.5) / w * (lon1 - lon0), coast[py]) : 1;
    const r = d[i], a = LUT.a[r] * fade * sea;   // 빨강 값은 256가지뿐이라 색과 투명도를 표에서 읽는다(결과는 같다)
    if (a <= 0.004) { d[i + 3] = 0; continue; }
    d[i] = LUT.c[r * 3]; d[i + 1] = LUT.c[r * 3 + 1]; d[i + 2] = LUT.c[r * 3 + 2]; d[i + 3] = Math.round(a * 255);
  }
  x.putImageData(img, 0, 0);
  // 그림을 주소로 바꾸는 일(webp 압축)은 화면을 멈추지 않게 뒤에서 한다. 실패하면 예전처럼 바로 만든다
  const blob = await new Promise(ok => c.toBlob(ok, 'image/webp', 0.9));
  return blob ? URL.createObjectURL(blob) : c.toDataURL('image/webp', 0.9);
}

// 지도에 걸린 빛 그림이 다시 칠한 그림인지 맞춘다. 다 칠해졌을 때, 그리고 지도가 다 그려질 때마다(idle) 확인해
// 원래 그림(보라·노랑)이 한 칸이라도 남지 않게 한다(지도 쪽 갱신과 엇갈리거나 늦게 들어온 경우까지)
function syncGlow() {
  const m = window.__dmzMap; if (!m || state.screen !== 'night') return;   // 빛은 밤하늘에서만 보인다
  for (const [id, g] of Object.entries(regions())) {
    const src = m.getSource(`glow-${id}`); if (!src) continue;
    const k = state.nightFrame, now = k == null ? g.color : g.frames[Math.min(k, g.frames.length - 1)];
    const want = cache.get(now);
    if (want && src.url !== want) src.updateImage({ url: want, coordinates: g.corners });
    else if (!want) glowUrl(now);   // 아직 안 칠했으면 칠하기 시작한다
  }
}
let watching = false;
function watch() {
  const m = window.__dmzMap; if (!m || watching) return;
  watching = true; m.on('idle', syncGlow);
}
const tries = new Map();
function glowUrl(file) {
  const u = cache.get(file); if (u) return u;
  watch();
  if (!pending.has(file)) pending.set(file, recolor(file).then(url => { cache.set(file, url); syncGlow(); }).catch(() => {
    // 불러오기가 한 번 실패해도(네트워크 등) 원래 그림으로 영영 남지 않게 잠시 뒤 다시 칠한다(세 번까지)
    pending.delete(file); const n = (tries.get(file) || 0) + 1; tries.set(file, n);
    if (n < 3) setTimeout(() => glowUrl(file), 1500 * n);
  }));
  return null;
}
window.__glowUrl = glowUrl;

// ---- 누른 자리의 값: value 영상(무손실, 빨강 = 0 ~ scale_db 최댓값)을 화소값 그대로 읽는다(land.js 와 같은 방식)
let values = null, loadingValues = null;
function loadValues() {
  loadingValues ||= (async () => {
    const out = {};
    for (const [id, r] of Object.entries(regions())) {
      const bmp = await createImageBitmap(await (await fetch(`data/${r.value}`)).blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      const c = Object.assign(document.createElement('canvas'), { width: bmp.width, height: bmp.height });
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bmp, 0, 0);
      out[id] = g.getImageData(0, 0, bmp.width, bmp.height);
    }
    values = out;
  })().catch(e => { console.error(e); loadingValues = null; });
  return loadingValues;
}
// 분계선을 따라 서쪽 끝에서 잰 거리(km). tools/make_section.py 와 같은 방식
let CUM = null;
function cum() {
  if (CUM) return CUM;
  const L = lineKm(); CUM = [0];
  for (let i = 1; i < L.length; i++) {
    const k = 111.32 * Math.cos((L[i][1] + L[i - 1][1]) / 2 * Math.PI / 180);
    CUM.push(CUM[i - 1] + Math.hypot((L[i][0] - L[i - 1][0]) * k, (L[i][1] - L[i - 1][1]) * 110.57));
  }
  return CUM;
}
// 분계선에서 어느 쪽으로 몇 km, 선을 따라 어디쯤. 선은 서쪽에서 동쪽으로 그려져 있어 진행 방향의 왼쪽이 북쪽이다
function sideOf(lon, lat) {
  const L = lineKm(), C = cum(), kx = 111.32 * Math.cos(lat * Math.PI / 180), ky = 110.57;
  let best = Infinity, cross = 0, along = 0;
  for (let i = 1; i < L.length; i++) {
    const ax = (L[i - 1][0] - lon) * kx, ay = (L[i - 1][1] - lat) * ky, bx = (L[i][0] - lon) * kx, by = (L[i][1] - lat) * ky;
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    const ex = ax + dx * t, ey = ay + dy * t, d = ex * ex + ey * ey;
    if (d < best) { best = d; cross = dx * (-ay) - dy * (-ax); along = C[i - 1] + t * (C[i] - C[i - 1]); }
  }
  return { km: Math.sqrt(best), north: cross > 0, along };
}
// { db, top, sea, km, north } 또는 관측 띠 밖이면 { out: true }. 값을 아직 못 읽었으면 읽은 뒤 돌려준다
export async function valueAt(lon, lat) {
  const set = data.corridor || data.glow; if (!set) return { out: true };
  await loadValues(); if (!values) return { out: true };
  const hit = regionAt(set, lon, lat);
  if (!hit) return { out: true };
  const db = sampleDb(values[hit.region], hit.x, hit.y, set.scale_db), s = sideOf(lon, lat);
  if (db == null) return { out: true };
  return { db, top: db >= set.scale_db[1] - 1e-6, sea: lon > coastLon(lat), out: data.corridor ? s.km > set.half_width_km : false, ...s };
}

// ---- 남북 단면: 누른 곳 앞뒤 10 km 구간에서, 분계선과의 거리(2 km 칸)마다 '크게 흔들린 땅'의 비율(section.json)
let section = null;
const loadSection = () => (section ||= fetch('data/section.json').then(r => r.json()).catch(() => null));
const SPAN = 2;   // 앞뒤로 더할 칸 수(5 km x 2 = 10 km)
export async function sectionAt(lon, lat) {
  const S = await loadSection(); if (!S) return null;
  const { along } = sideOf(lon, lat), na = S.total.length;
  const ia = Math.max(0, Math.min(na - 1, Math.floor(along / S.along_km)));
  return pool(S, Math.max(0, ia - SPAN), Math.min(na - 1, ia + SPAN));
}
export async function places() { const S = await loadSection(); return S?.places || []; }   // 고요한 띠 안의 예외(대성동)
export async function sectionAll() {   // 띠 전체(분계선 248 km)를 모은 단면
  const S = await loadSection(); if (!S) return null;
  return pool(S, 0, S.total.length - 1);
}
function pool(S, a0, a1) {
  const nd = S.total[0].length, tot = new Array(nd).fill(0), hit = new Array(nd).fill(0);
  for (let a = a0; a <= a1; a++) for (let j = 0; j < nd; j++) { tot[j] += S.total[a][j]; hit[j] += S.strong[a][j]; }
  const share = tot.map((n, j) => n >= 30 ? hit[j] / n : null);   // 화소가 너무 적은 칸(바다 끝 등)은 비운다
  const at = km => Math.floor((km - S.dist_from_km) / S.dist_km);
  const part = (a, b) => { let n = 0, h = 0; for (let j = at(a); j < at(b); j++) if (j >= 0 && j < nd) { n += tot[j]; h += hit[j]; } return n >= 100 ? h / n : null; };
  const near = part(-2, 2), south = part(-10, -2), north = part(2, 10);   // 분계선 양쪽 2 km(대략 DMZ 폭) / 그 바깥 8 km
  let kind = 'none';
  if (near == null || south == null || north == null) kind = 'thin';
  else if (Math.max(south, north) < 0.08) kind = 'flat';
  else if (near < 0.6 * Math.min(south, north)) kind = 'valley';
  else if (near < 0.6 * Math.max(south, north)) kind = south > north ? 'southOnly' : 'northOnly';
  return { share, from: S.dist_from_km, step: S.dist_km, strongDb: S.strong_db, kind, near, south, north };
}

// 한 계절 재생에 쓰는 그림들도 미리 칠해 둔다(둘러보기에 들어올 때 한 번, 차례로)
let warmed = false;
export async function prewarmGlow() {
  if (warmed) return; warmed = true;
  const files = [];
  for (const g of Object.values(regions())) { files.push(g.color); for (const f of g.frames) files.push(f); }
  // 한 장 칠할 때마다 화면이 쉴 틈을 준다(끌기·확대가 끊기지 않게)
  const rest = () => new Promise(ok => { const t = setTimeout(ok, 250); if (window.requestIdleCallback) requestIdleCallback(() => { clearTimeout(t); ok(); }, { timeout: 200 }); });
  for (const f of files) { glowUrl(f); await pending.get(f); await rest(); }
}
