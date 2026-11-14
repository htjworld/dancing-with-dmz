// 계절 변동 지도(glow.json)를 읽는 순수 계산. 화면·DOM 과 무관하다.
// corners = [좌상, 우상, 우하, 좌하] (영상 바깥 모서리의 경위도), size = [너비, 높이] 화소
import { cycleAt } from './rhythm.js';

// 경위도 -> 영상 화소 [x, y]. 영상 밖이면 null. 좌상·우상·좌하 세 모서리로 정한 아핀 변환의 역.
export function pixelOf(corners, size, lng, lat, projection) {
  if (projection === 'EPSG:3857') {
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) >= 90) return null;
    // 연속 관측 띠는 Web Mercator 격자다. 위도를 선형 보간하면 지도와 화소가 어긋난다.
    const y = latitude => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360)) * 180 / Math.PI;
    corners = corners.map(([x, latitude]) => [x, y(latitude)]);
    lat = y(lat);
  }
  const [[x0, y0], [x1, y1], , [x3, y3]] = corners, [w, h] = size;
  const ax = x1 - x0, bx = x3 - x0, ay = y1 - y0, by = y3 - y0, det = ax * by - bx * ay;
  if (!det) return null;
  const dx = lng - x0, dy = lat - y0;
  const u = (dx * by - bx * dy) / det, v = (ax * dy - dx * ay) / det;
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
  return [Math.floor(u * w) || 0, Math.floor(v * h) || 0];   // || 0: -0 을 0 으로
}

// value 영상의 한 화소 -> dB. imageData 는 canvas getImageData 결과({ data, width, height }). 자료 없음(알파 0)이면 null.
export function sampleDb(imageData, x, y, scaleDb) {
  if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) return null;
  const i = (y * imageData.width + x) * 4;
  if (imageData.data[i + 3] === 0) return null;
  const [lo, hi] = scaleDb;
  return lo + (imageData.data[i] / 255) * (hi - lo);
}

// 경위도가 들어 있는 지역과 그 화소. 어느 지역에도 없으면 null.
export function regionAt(glow, lng, lat) {
  for (const [region, r] of Object.entries(glow.regions)) {
    const p = pixelOf(r.corners, r.size, lng, lat, r.projection || glow.projection);
    if (p) return { region, x: p[0], y: p[1] };
  }
  return null;
}

// 재생 진행도(0~1) -> 보여 줄 프레임 번호(0 ~ nFrames-1)
export const frameAt = (progress, nFrames) => cycleAt(progress, nFrames);
