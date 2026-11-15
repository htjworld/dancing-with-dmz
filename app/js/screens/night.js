// 밤사진 화면: 계절 변동 지도 위에 얹는 설명 창과 '한 계절 재생'. 지도 레이어는 map.js 가 맡는다.
// 숫자는 facts.json(fact())과 glow.json 에서만 가져온다.
import { state, set, subscribe, data, fact } from '../state.js';
import { t, dateText } from '../i18n.js';
import { nightScore } from './nightmusic.js';
import { frameAt } from '../glow.js';
import { play, stop } from '../sound.js';
import { nightMap } from './film.js';
import { prewarmGlow, valueAt, sectionAt, sectionAll, places } from './nightglow.js';
import { regionZones } from './proof.js';
import { initNightSky, passSweep } from './nightsky.js';

const el = document.getElementById('night');
const ORDER = ['paju', 'yeoncheon', 'cheorwon', 'hwacheon', 'yanggu'];
const CAVEATS = ['signal_not_cause', 'forest_relative'];   // 이 화면에서 보여 주는 한계 문구(plan.md 2-4절 키)
let at = 'cheorwon';   // 지도에서 보고 있는 곳. map.js 의 처음 범위와 같다
let timer = 0, startedAt = 0, duration = 0, preloaded = false;
let pick = null, whole = null;   // whole: 띠 전체 단면(처음 한 번 읽는다)   // 누른 자리에 띄운 작은 글(maplibregl.Popup)

const nFrames = () => Object.values((data.corridor || data.glow)?.regions || {})[0]?.frames?.length || 0;

// ---- 한 계절 재생: 곡의 처음~끝이 첫 통과~마지막 통과다. 통과가 쌓일수록 들판이 빛나고 별 소리가 늘어난다.
function preload() {
  if (preloaded) return; preloaded = true;
  for (const g of Object.values((data.corridor || data.glow).regions)) for (const f of g.frames) { const im = new Image(); im.src = `data/${f}`; }
}
export function stopSeason() {
  if (!timer) return;
  clearInterval(timer); timer = 0; stop();
  set({ nightFrame: null });
}
export function playSeason() {
  const n = nFrames();
  if (!n) return;
  stopSeason(); preload();
  // 밤사진에는 이 화면을 위해 지은 잔잔한 곡을 쓴다(nightmusic.js). 미션의 조각과 피날레 음악은 music.js 가 맡는다
  const plan = nightScore();
  startedAt = play(plan); duration = plan.duration * 1000;
  const tick = () => {
    const p = (performance.now() - startedAt) / duration;
    if (p >= 1) { clearInterval(timer); timer = 0; return set({ nightFrame: null }); }   // 끝나면 완성된 한 장으로 돌아간다
    const k = frameAt(Math.max(0, p), n);
    if (k !== state.nightFrame) { set({ nightFrame: k }); passSweep(duration / n); }   // 관측이 하나 쌓일 때마다 위성이 지나간다(연출)
  };
  timer = setInterval(tick, 80);
  set({ nightFrame: 0 }); passSweep(duration / n);
}

// 아이콘(그림 문자 대신 SVG): 재생, 멈춤, 땅 연주(소리 물결)
const ICON = {
  play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>',
  stop: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2.5" y="1.5" width="2.4" height="9" rx=".6" fill="currentColor"/><rect x="7.1" y="1.5" width="2.4" height="9" rx=".6" fill="currentColor"/></svg>',
  land: '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 6h2M4 3v6M7 1v10M10 3.5v5M13 5v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>',
};

// 문장과 쉼표에서 줄을 바꾼다(낱말 하나가 다음 줄로 밀려나지 않게). 좁은 화면에서는 그 안에서 다시 접힌다
const brk = s => s.replace(state.lang === 'ko' ? /([.!?,;]) /g : /([.!?]) /g, '$1<br>');   // 영어는 문장에서만

// 둘러보기: 카드 없이 글은 왼쪽 위, 조작은 영상과 같은 아래 줄(재생·땅 연주 + 지역 이름), 게임으로 가는 단추는 오른쪽 아래
function render() {
  document.querySelectorAll('.ex-mark span[data-ex]').forEach(e => { e.textContent = t('night.ex.' + e.dataset.ex); });   // 언어를 바꾸면 지도 위 이름도
  const [lo, hi] = (data.corridor || data.glow)?.scale_db || [0, 0];
  const regions = ORDER.filter(id => data.glow?.regions?.[id]);
  const k = state.nightFrame, dates = (data.corridor || data.glow)?.dates || [];
  const when = k == null ? '' : t('night.playing', { k: k + 2, n: dates.length, from: dateText(dates[0]), to: dateText(dates[k + 1]) });
  const note = state.landPlay ? t('land.hint') : k != null ? `${t('night.musicNote')} ${t('night.satNote')}` : t('night.pickHint');
  el.classList.toggle('zoomed', !!state.evidenceAt);   // 지역 근거 창이 열려 있으면 왼쪽은 제목만(내용은 오른쪽 창이 맡는다)
  el.innerHTML = `
    <div class="scrim" aria-hidden="true"></div>
    <div class="words">
      <h2>${t('night.title').replace(/<br>/g, ' ')}</h2>
      <p class="lead">${brk(t('night.body'))}</p>
      ${whole ? `<figure class="whole">${chart(whole, null, 380, 92)}
        <p class="axis"><span>${t('night.sec.south')}</span><span>${t('night.sec.line')}</span><span>${t('night.sec.north')}</span></p>
        <figcaption>${brk(t('night.sec.whole', pct(whole)))}</figcaption></figure>` : ''}
    </div>
    <div class="legend">
      <div class="scale" role="img" aria-label="${t('night.scaleAria')}"></div>
      <span>${t('night.scaleLow', { lo })}</span><span>${t('night.scaleHigh', { hi })}</span>
      <details class="notes"><summary>${t('night.notes')}</summary>
        <p>${t('night.sec.what2', { db: whole ? whole.strongDb.toFixed(2) : '' })}</p>
        <p>${t('night.compare', { paddy: fact('cheorwon_paddy_db'), dmz: fact('cheorwon_dmz_db') })} ${t('night.pairNote')}</p>
        <p>${t('night.fact', { n: fact('july_clear_optical'), looks: fact('july_optical_looks') })}</p>
        ${data.corridor ? `<p>${t('night.corridor', { km: data.corridor.half_width_km })}</p>` : ''}
        <p>${t('night.sea')}</p>
        ${CAVEATS.map(c => `<p>${t('caveat.' + c)}</p>`).join('')}
        <p>${t('night.pick')}</p>
      </details>
    </div>
    <div class="dock">
      ${note || when ? `<p class="dock-note">${when ? `<b>${when}</b> ` : ''}${note}</p>` : ''}
      <div class="row">
        ${nFrames() ? `<button type="button" class="ic" data-play aria-pressed="${k != null}" aria-label="${t(k == null ? 'night.play' : 'night.stop')}">${k == null ? ICON.play : ICON.stop}</button>` : ''}
        <button type="button" class="ic" data-land aria-pressed="${state.landPlay}" aria-label="${t('land.toggle')}">${ICON.land}</button>
        <span class="sep" aria-hidden="true"></span>
        ${regions.map(id => `<button type="button" class="tab" data-go="${id}" aria-pressed="${at === id}">${t('region.' + id)}</button>`).join('')}
        <button type="button" class="tab" data-go="all" aria-pressed="${at === 'all'}">${t('night.all')}</button>
      </div>
    </div>
    <div class="exit">
      <button type="button" class="ghost" data-film>${t('film.replay')}</button>
      <button type="button" class="next" data-next>${t('night.next')}</button>
    </div>`;
}

// 단면 막대: 왼쪽이 남, 오른쪽이 북, 가운데 흰 줄이 분계선. 막대 높이 = 그 거리에서 크게 흔들린 땅의 비율
const pct = s => ({ near: Math.round((s.near ?? 0) * 100), south: Math.round((s.south ?? 0) * 100), north: Math.round((s.north ?? 0) * 100) });
function chart(sec, here, W = 264, H = 74) {
  const n = sec.share.length, bw = W / n, top = Math.max(0.3, ...sec.share.filter(x => x != null));
  const x = km => (km - sec.from) / (sec.step * n) * W;
  const bars = sec.share.map((s, j) => {
    if (s == null) return '';
    const km = sec.from + (j + 0.5) * sec.step, h = Math.max(1, s / top * (H - 14)), near = Math.abs(km) < 2;
    return `<rect x="${(j * bw + 1).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" class="${near ? 'near' : ''}"><title>${Math.round(s * 100)}%</title></rect>`;
  }).join('');
  const hx = here == null ? null : Math.max(3, Math.min(W - 3, x(here)));
  return `<svg class="sec" viewBox="0 0 ${W} ${H}" style="width:${W}px;height:${H}px" role="img" aria-label="${t('night.sec.aria', pct(sec))}">
    ${bars}<line x1="${x(0)}" x2="${x(0)}" y1="0" y2="${H}" class="mdl"/>${hx == null ? '' : `<path d="M${hx - 4} 0h8l-4 6z" class="here"/>`}</svg>`;
}

// 지도를 누르면 그 자리의 한 계절 변동 폭과 분계선에서의 거리를 보여 준다(값은 corridor 의 value 영상 그대로)
const closePick = () => { pick?.remove(); pick = null; };
async function showPick(lng, lat) {
  const m = window.__dmzMap; if (!m || typeof maplibregl === 'undefined') return;
  const v = await valueAt(lng, lat);
  if (state.screen !== 'night' || state.nightMode !== 'explore' || state.landPlay) return;
  if (v.out || v.sea) return closePick();   // 관측 띠 밖이나 바다를 누르면 아무것도 띄우지 않는다
  const sec = await sectionAt(lng, lat);
  if (state.screen !== 'night' || state.nightMode !== 'explore' || state.landPlay) return;
  const side = t(v.north ? 'night.north' : 'night.south'), km = v.km < 0.1 ? '0.1' : v.km.toFixed(1);
  const html = sec ? `<b>${t('night.sec.' + sec.kind)}</b>${chart(sec, v.north ? v.km : -v.km)}
      <p class="axis"><span>${t('night.sec.south')}</span><span>${t('night.sec.line')}</span><span>${t('night.sec.north')}</span></p>
      <p class="fine">${t('night.sec.what', { db: sec.strongDb.toFixed(2) })}</p>
      <p class="fine">${t('night.sec.here', { db: v.db.toFixed(1) + (v.top ? t('night.pickOver') : ''), side, km })}</p>`
    : `<b>${v.db.toFixed(1)} dB</b><span>${t('night.pickDb')}</span><span>${t('night.pickSide', { side, km })}</span>`;
  closePick();
  pick = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'glow-pick', offset: 10, maxWidth: '300px' })
    .setLngLat([lng, lat]).setHTML(html).addTo(m);
}

// 둘러보기에서는 바다·강의 물 면을 빛 위로 올린다. 띠의 양쪽 끝(서해·한강 하구, 동해)이 똑같이 해안선을 따라 끝난다
// 물 위의 빛은 물결로 늘 달라져 이야기와 상관없다. 화면을 떠나면 원래 순서로 되돌린다(게임 화면은 그대로)
let waterNext = null;   // [물 층 id, 원래 바로 다음 층 id]
function waterOnTop(on) {
  const m = window.__dmzMap; if (!m) return;
  let st; try { st = m.getStyle(); } catch { st = null; }
  if (!st?.layers) { m.once('idle', () => waterOnTop(on)); return; }   // 바탕 지도가 아직 안 들어왔으면 다 그린 뒤에
  const ids = st.layers.map(l => l.id), glows = ids.filter(i => i.startsWith('glow-'));
  if (on && !waterNext && glows.length) {
    const water = st.layers.filter(l => l.type === 'fill' && l['source-layer'] === 'water').map(l => l.id);
    waterNext = water.map(w => [w, ids[ids.indexOf(w) + 1]]);
    const before = ids[ids.indexOf(glows[glows.length - 1]) + 1];   // 마지막 빛 층 바로 위(분계선·표식은 그 위에 남는다)
    for (const w of water) m.moveLayer(w, before);
  } else if (!on && waterNext) {
    for (const [w, next] of waterNext.slice().reverse()) if (m.getLayer(w)) m.moveLayer(w, next && m.getLayer(next) ? next : undefined);
    waterNext = null;
  }
}

// 지역 근거 창이 열려 있으면 그 지역 구역들을 지도에 곡선과 같은 색 테두리와 이름표로 그린다(어느 땅의 곡선인지 보이게)
let evTags = [];
function evZones() {
  const m = window.__dmzMap; if (!m || typeof maplibregl === 'undefined') return;
  const on = state.screen === 'night' && state.nightMode === 'explore' && state.evidenceAt;
  let ready = false; try { ready = !!m.getStyle()?.layers; } catch { ready = false; }
  if (!ready) { if (on) m.once('idle', evZones); return; }   // 바탕 지도가 아직 안 들어왔으면 다 그린 뒤에
  const zs = on ? regionZones(state.evidenceAt) : [];
  const fc = { type: 'FeatureCollection', features: zs.map(z => ({ type: 'Feature', properties: { color: z.color }, geometry: { type: 'Polygon', coordinates: [z.polygon] } })) };
  if (!m.getSource('ev-zones')) {
    if (!zs.length) return;
    m.addSource('ev-zones', { type: 'geojson', data: fc });
    m.addLayer({ id: 'ev-zones-line', type: 'line', source: 'ev-zones', paint: { 'line-color': ['get', 'color'], 'line-width': 1.4, 'line-opacity': 0.95 } });   // 얇은 한 줄(어두운 테두리를 깔면 이중선처럼 보인다)
  } else m.getSource('ev-zones').setData(fc);
  evTags.forEach(k => k.remove());
  const west = z => Math.min(...z.polygon.map(p => p[0])), rank = zs.map(z => zs.filter(q => west(q) < west(z)).length);
  evTags = zs.map((z, i) => {
    const el = document.createElement('span'); el.className = 'ev-tag'; el.style.borderLeftColor = z.color; el.textContent = z.label;
    const xs = z.polygon.map(p => p[0]), ys = z.polygon.map(p => p[1]), up = rank[i] % 2 === 0;   // 서쪽부터 번갈아 위·아래 모서리에(이웃 구역끼리 겹치지 않게)
    return new maplibregl.Marker({ element: el, anchor: up ? 'bottom-left' : 'top-left', offset: [0, up ? -3 : 3] })
      .setLngLat([Math.min(...xs), up ? Math.max(...ys) : Math.min(...ys)]).addTo(m);
  });
}

// 게임 화면의 레이더 영상 테두리: 흰 빛 번짐 대신 얇은 선 하나(map.js 의 층 모양만 바꾼다. 켜고 끄기는 map.js 가 그대로 맡는다)
function gameTone() {
  const m = window.__dmzMap; if (!m) return;
  let ready = false; try { ready = !!m.getStyle()?.layers; } catch { ready = false; }
  if (!ready) { m.once('idle', gameTone); return; }
  if (m.getLayer('radar-frame-glow')) m.setPaintProperty('radar-frame-glow', 'line-opacity', 0);
  if (m.getLayer('radar-frame-line')) { m.setPaintProperty('radar-frame-line', 'line-color', '#c9d2e8'); m.setPaintProperty('radar-frame-line', 'line-opacity', 0.45); m.setPaintProperty('radar-frame-line', 'line-width', 1); }
}

// 게임 화면 위쪽 단추 줄([처음으로][English][소리]): 오른쪽 미션 창이 보이면 그 왼쪽에, 엔딩처럼 창이 숨으면 오른쪽 위 구석에
// 실제 단추 폭을 재서 10px 간격으로 붙인다(언어마다 글자 폭이 달라서). 게임 밖에서는 손대지 않는다(CSS 가 맡는다)
function placeTopButtons() {
  const ids = ['sound', 'lang', 'to-night'], els = ids.map(id => document.getElementById(id));
  if (state.screen !== 'mission') { els.forEach(e => e && (e.style.right = '')); return; }
  const panel = document.getElementById('panel'), shown = panel && getComputedStyle(panel).display !== 'none' && panel.getBoundingClientRect().width > 0
    && !document.body.classList.contains('finale') && document.body.dataset.beat !== 'result' && innerWidth > 900;
  let right = shown ? innerWidth - panel.getBoundingClientRect().left + 10 : 16;
  for (const e of els) {
    if (!e || getComputedStyle(e).display === 'none') continue;
    e.style.right = `${Math.round(right)}px`;
    right += e.getBoundingClientRect().width + 10;
  }
}

// 고요한 띠 안의 예외: 지도에 작은 점과 이름, 누르면 설명(숫자는 section.json 의 places, tools/make_section.py)
let marks = null;
async function placeMarks() {
  const m = window.__dmzMap; if (marks || !m || typeof maplibregl === 'undefined') return;
  marks = [];
  for (const p of await places()) {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'ex-mark';
    el.innerHTML = `<i></i><span data-ex="${p.id}">${t('night.ex.' + p.id)}</span>`;
    el.addEventListener('click', e => { e.stopPropagation(); showPlace(p); });
    marks.push(new maplibregl.Marker({ element: el, anchor: 'left', offset: [-6, 0] }).setLngLat(p.lonlat).addTo(m));
  }
}
function showPlace(p) {
  const m = window.__dmzMap; if (!m) return;
  const pc = x => Math.round(x * 100);
  closePick();
  pick = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'glow-pick', offset: 12, maxWidth: '300px' })
    .setLngLat(p.lonlat).setHTML(`<b>${t('night.ex.title')}</b><span>${t('night.ex.place')}</span>
      <p class="body">${t('night.ex.body', { r: p.r_km, share: pc(p.share), west: pc(p.west_share), west_km: p.west_km ?? 35 })}</p>
      <p class="fine">${t('night.ex.limit', { db: whole ? whole.strongDb.toFixed(2) : '0.66' })}</p>`).addTo(m);   // 출처 링크는 뺐다(팀 피드백, 11/15). 출처는 README·팀 페이지에 둔다
}

export function initNight() {
  initNightSky();   // 띠 바깥의 별, 재생 때 지나가는 위성
  subscribe(() => requestAnimationFrame(placeTopButtons)); addEventListener('resize', placeTopButtons);   // 화면·언어·엔딩이 바뀔 때마다 단추 줄 자리를 다시 잰다
  if (data.corridor) at = 'all';
  sectionAll().then(s => { whole = s; if (s) render(); });
  document.addEventListener('dmz-map-click', e => {
    if (state.screen !== 'night' || state.nightMode !== 'explore' || state.landPlay) return;
    showPick(e.detail.lng, e.detail.lat);
  });
  el.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) {
      at = go.dataset.go; closePick();
      set({ evidenceAt: at === 'all' ? null : at });   // 지역을 고르면 그 지역의 근거 패널이 열린다
      document.dispatchEvent(new CustomEvent('dmz-night-go', { detail: { id: at } }));
      return render();
    }
    if (e.target.closest('[data-play]')) return state.nightFrame == null ? playSeason() : stopSeason();
    if (e.target.closest('[data-land]')) return set({ landPlay: !state.landPlay });
    if (e.target.closest('[data-next]')) return set({ screen: 'mission' });
    if (e.target.closest('[data-film]')) { stopSeason(); return document.dispatchEvent(new Event('dmz-film')); }
  });
  subscribe((s, prev) => {
    const ex = s.screen === 'night' && s.nightMode === 'explore', was = prev.screen === 'night' && prev.nightMode === 'explore';
    if (ex && !was) {
      nightMap(true); prewarmGlow(); placeMarks(); waterOnTop(true);
      // 들어올 때는 영상·게임에서 보던 확대 그대로가 아니라 띠 전체가 보이게(지역 근거 창도 닫는다)
      at = data.corridor ? 'all' : at; if (s.evidenceAt) set({ evidenceAt: null });
      document.dispatchEvent(new CustomEvent('dmz-night-go', { detail: { id: at, duration: 1200 } }));
      render();
    }
    if (!ex && was) waterOnTop(false);
    if (s.evidenceAt !== prev.evidenceAt || ex !== was || s.lang !== prev.lang) evZones();
    if (!ex || s.landPlay) closePick();
    if (ex) { const m = window.__dmzMap; if (m?.getLayer('corridor-edges')) m.setLayoutProperty('corridor-edges', 'visibility', 'none'); }   // 관측 범위 점선은 둘러보기에서 숨긴다(빛이 분계선에서 멀어질수록 옅어져 경계를 대신한다)
    // 바탕 지도의 밤 톤은 게임(미션)에서도 이어 간다. 영상으로 가면 영상이 맡고, 그 밖(오프닝 등)으로 갈 때만 되돌린다
    if (!ex && was && !(s.screen === 'night' && s.nightMode === 'film') && s.screen !== 'mission') nightMap(false);
    if (s.screen === 'mission' && prev.screen !== 'mission') { nightMap(true); gameTone(); }
    if ((s.screen !== 'night' || s.nightMode !== 'explore') && timer) stopSeason();   // 화면이나 모드를 떠나면 재생을 멈춘다
    if (s.screen !== prev.screen || s.lang !== prev.lang || s.nightFrame !== prev.nightFrame || s.landPlay !== prev.landPlay || s.evidenceAt !== prev.evidenceAt) render();
  });
  render();
}
