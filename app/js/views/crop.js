// 지역의 레이더 영상에서 한 구역만 잘라 보여 주는 CSS(배경 그림).
// 큰 영상을 CSS 로 확대해 잘라 보이면서 필터까지 걸면, 화면이 움직일 때마다 큰 그림을 다시 그려 느려진다.
// 그래서 처음 한 번만 작은 그림으로 잘라 명암을 올려 두고(캔버스), 그 뒤로는 그 작은 그림을 쓴다.
import { data, set } from '../state.js';
import { pixelOf } from '../glow.js';

const sources = new Map();   // 영상 주소 → 불러오는 중인 그림
const thumbs = new Map();    // 잘라 둔 작은 그림(주소)
const making = new Set();
let redraw = 0;

const source = url => {
  if (!sources.has(url)) sources.set(url, new Promise(done => { const im = new Image(); im.onload = () => done(im); im.onerror = () => done(null); im.src = url; }));
  return sources.get(url);
};

// 잘라 낸 조각을 작은 그림으로 만든다. 명암(contrast)과 밝기(bright)는 화소 값을 직접 고친다
async function make(key, url, sx, sy, sw, sh, contrast, bright) {
  if (making.has(key)) return;
  making.add(key);
  const im = await source(url);
  if (im) {
    const k = Math.min(1, 420 / Math.max(sw, sh)), w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, w, h);
    g.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    if (contrast !== 1 || bright !== 1) {
      const px = g.getImageData(0, 0, w, h), d = px.data;
      for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = ((d[i + c] - 128) * contrast + 128) * bright;   // Uint8ClampedArray 가 0~255 로 자른다
      g.putImageData(px, 0, 0);
    }
    thumbs.set(key, cv.toDataURL('image/jpeg', .86));
    clearTimeout(redraw); redraw = setTimeout(() => set({}), 50);   // 준비된 그림으로 창을 다시 그린다(여러 장이 한꺼번에 끝나면 한 번만)
  }
  making.delete(key);
}

// bounds: [서, 남, 동, 북]. pad: 구역 둘레를 얼마나 더 포함할지(구역 크기 대비 비율). look: 명암과 밝기
export function crop(regionId, date, bounds, pad = 0, pol = 'hh', look = {}) {
  const L = data.layers.regions[regionId], [W, H] = L.size, { contrast = 1, bright = 1 } = look;
  const nw = pixelOf(L.corners, L.size, bounds[0], bounds[3]) || [0, 0], se = pixelOf(L.corners, L.size, bounds[2], bounds[1]) || [W, H];
  const w0 = se[0] - nw[0], h0 = se[1] - nw[1];
  const sx = Math.max(0, nw[0] - w0 * pad), sy = Math.max(0, nw[1] - h0 * pad), sw = Math.min(W - sx, w0 * (1 + 2 * pad)), sh = Math.min(H - sy, h0 * (1 + 2 * pad));
  const url = `data/layers/${regionId}/${date}_${pol}.webp`, key = `${url}|${sx | 0},${sy | 0},${sw | 0},${sh | 0}|${contrast},${bright}`;
  const ready = thumbs.get(key);
  if (!ready && typeof document !== 'undefined') make(key, url, sx, sy, sw, sh, contrast, bright);
  return {
    ar: sw / sh,
    // 아직 준비되지 않았으면 빈 칸으로 두었다가, 준비되면 다시 그려진다
    style: ready ? `background-image:url(${ready});background-size:100% 100%` : 'background-image:none',
  };
}
