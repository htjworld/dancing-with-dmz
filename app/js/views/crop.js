// 지역의 레이더 영상에서 한 구역만 잘라 보여 주는 CSS(배경 그림의 크기와 위치). 파주 '필름 고르기'와 같은 방식이다.
import { data } from '../state.js';
import { pixelOf } from '../glow.js';

// bounds: [서, 남, 동, 북]. pad: 구역 둘레를 얼마나 더 포함할지(구역 크기 대비 비율)
export function crop(regionId, date, bounds, pad = 0, pol = 'hh') {
  const L = data.layers.regions[regionId], [W, H] = L.size;
  const nw = pixelOf(L.corners, L.size, bounds[0], bounds[3]) || [0, 0], se = pixelOf(L.corners, L.size, bounds[2], bounds[1]) || [W, H];
  const w0 = se[0] - nw[0], h0 = se[1] - nw[1];
  const sx = Math.max(0, nw[0] - w0 * pad), sy = Math.max(0, nw[1] - h0 * pad), sw = Math.min(W - sx, w0 * (1 + 2 * pad)), sh = Math.min(H - sy, h0 * (1 + 2 * pad));
  return {
    ar: sw / sh,
    style: `background-image:url('data/layers/${regionId}/${date}_${pol}.webp');background-size:${(W / sw * 100).toFixed(1)}% ${(H / sh * 100).toFixed(1)}%;background-position:${(sx / Math.max(1, W - sw) * 100).toFixed(1)}% ${(sy / Math.max(1, H - sh) * 100).toFixed(1)}%`,
  };
}
