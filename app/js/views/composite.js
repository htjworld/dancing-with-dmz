// 두 날짜의 레이더 영상을 색으로 겹친 '변화 지도'. 변하지 않은 곳은 회색으로 남고, 기준 날짜보다 밝아진 곳은 주황, 어두워진 곳은 파랑이 된다.
// 레이더 영상 분석에서 흔히 쓰는 방식(여러 시기의 영상을 색 채널에 나눠 넣어 겹쳐 보기)을 단순하게 옮겼다.
// 한 번 만든 그림은 기억해 두고 다시 쓴다. 준비되면 상태를 건드려 지도가 새 그림을 가져가게 한다.
import { set } from '../state.js';

const pixels = new Map();   // 영상 주소 → 화소(밝기와 투명도)를 불러오는 중인 약속
const made = new Map();     // '기준|날짜' → 만들어 둔 그림 주소
const making = new Set();
const GAIN = 2.2;           // 밝기 차이를 색으로 얼마나 세게 옮길지
let redraw = 0;

const load = url => {
  if (!pixels.has(url)) pixels.set(url, new Promise(done => {
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
      done(g.getImageData(0, 0, cv.width, cv.height));
    };
    im.onerror = () => done(null); im.src = url;
  }));
  return pixels.get(url);
};

async function make(key, baseUrl, url) {
  if (making.has(key)) return;
  making.add(key);
  const [a, b] = await Promise.all([load(baseUrl), load(url)]);
  if (a && b && a.width === b.width && a.height === b.height) {
    const out = new ImageData(a.width, a.height), A = a.data, B = b.data, O = out.data;
    for (let i = 0; i < O.length; i += 4) {
      const d = (B[i] - A[i]) * GAIN, m = (A[i] + B[i]) / 2;
      O[i] = m + d; O[i + 1] = m + d * .18; O[i + 2] = m - d;   // 밝아지면 주황, 어두워지면 파랑(0~255 는 배열이 알아서 자른다)
      O[i + 3] = Math.min(A[i + 3], B[i + 3]);
    }
    const cv = document.createElement('canvas'); cv.width = a.width; cv.height = a.height;
    cv.getContext('2d').putImageData(out, 0, 0);
    const blob = await new Promise(done => cv.toBlob(done, 'image/webp', .9));
    if (blob) { made.set(key, URL.createObjectURL(blob)); clearTimeout(redraw); redraw = setTimeout(() => set({}), 30); }
  }
  making.delete(key);
}

// 준비돼 있으면 그림 주소, 아니면 null(만들기 시작하고, 다 되면 지도가 다시 묻는다)
export function compositeUrl(regionId, baseDate, date, pol = 'hh') {
  const key = `${regionId}|${baseDate}|${date}|${pol}`, ready = made.get(key);
  if (!ready && typeof document !== 'undefined') make(key, `data/layers/${regionId}/${baseDate}_${pol}.webp`, `data/layers/${regionId}/${date}_${pol}.webp`);
  return ready || null;
}
