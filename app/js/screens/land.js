// 땅 연주: 밤사진 지도 위를 쓸면 그 자리의 계절 변동 폭이 음이 된다. 많이 변한 땅은 높고 크게, 고요한 땅(숲, DMZ 안)에서는 쉰다.
// 값은 glow.json 의 value 영상에서 읽는다(interface.md 4-3). 켜져 있는 동안에는 지도가 끌려가지 않게 한다.
import { state, set, subscribe, data } from '../state.js';
import { regionAt, sampleDb } from '../glow.js';
import { touch, noteFor } from '../landsound.js';
import { t } from '../i18n.js';

let pixels = null, loading = null;

// value 영상을 화소값 그대로 읽는다(색 보정과 알파 곱하기를 끈다)
function loadPixels() {
  loading ||= (async () => {
    const out = {};
    for (const [id, r] of Object.entries((data.corridor || data.glow).regions)) {
      const blob = await (await fetch(`data/${r.value}`)).blob();
      const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      const c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(bmp.width, bmp.height)
        : Object.assign(document.createElement('canvas'), { width: bmp.width, height: bmp.height });
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(bmp, 0, 0);
      out[id] = g.getImageData(0, 0, bmp.width, bmp.height);
    }
    pixels = out;
  })().catch(e => { console.error(e); loading = null; });
  return loading;
}

export function initLand(map) {
  const read = document.getElementById('land-read');
  const on = () => state.landPlay && state.screen === 'night';
  const hide = () => { read.hidden = true; };

  function move(e) {
    if (!on() || !pixels || !e.lngLat) return;
    const dataset = data.corridor || data.glow;
    const scale = dataset.scale_db, hit = regionAt(dataset, e.lngLat.lng, e.lngLat.lat);
    const db = hit ? sampleDb(pixels[hit.region], hit.x, hit.y, scale) : null;
    if (db == null) return hide();   // 영상 밖이거나 자료가 없는 곳
    touch(db, scale);
    const still = !noteFor(db, scale), top = db >= scale[1] - 1e-6;
    read.hidden = false;
    read.className = still ? 'still' : '';
    read.textContent = t(still ? 'land.still' : top ? 'land.top' : 'land.note', { db: db.toFixed(1) });
    read.style.transform = `translate(${Math.round(e.point.x + 14)}px, ${Math.round(e.point.y - 34)}px)`;
  }
  map.on('mousemove', move); map.on('touchstart', move); map.on('touchmove', move);
  map.on('mouseout', hide); map.on('touchend', hide);

  const apply = () => {
    const active = on();
    if (active) { loadPixels(); map.dragPan.disable(); } else { map.dragPan.enable(); hide(); }
    map.getCanvas().style.cursor = active ? 'crosshair' : '';
  };
  subscribe((s, prev) => {
    if (s.landPlay !== prev.landPlay || s.screen !== prev.screen) apply();
    if (s.screen !== 'night' && s.landPlay) set({ landPlay: false });   // 밤사진을 떠나면 끈다
  });
  apply();
}
