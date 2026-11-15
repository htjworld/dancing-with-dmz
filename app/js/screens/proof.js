// 근거 패널: 밤사진에서 지역을 고르면 열린다. 그 지역 구역들의 '숲 대비' 계절 곡선, 변동 폭, 한계 문구, 미션 진입.
// 계산은 js/evidence.js(htj)가 하고 여기서는 그리기만 한다. 숫자를 손으로 적지 않는다.
import { state, set, subscribe, data, fact } from '../state.js';
import { evidence } from '../evidence.js';
import { t, dateText, zoneName } from '../i18n.js';
import { STOPS } from '../stops.js';

// 미션은 순서대로 연다(게임 안 지역 줄과 같은 규칙): 앞 지역 조각을 다 받은 곳만 바로 들어가고, 아니면 다음 차례 지역으로 보낸다
function missionTarget(id) {
  const i = STOPS.findIndex(x => x.id === id);
  if (i < 0 || STOPS.slice(0, i).every(x => state.fragments.includes(x.id))) return id;
  return STOPS.find(x => !state.fragments.includes(x.id)).id;
}

const el = document.getElementById('proof');
// 선 색은 밤하늘 둘러보기와 같은 뜻으로 칠한다(hdk): 그 지역에서 변동 폭이 가장 작은 땅 = 고요한 회청색,
// 나머지는 흔들린 금빛(분계선 북쪽은 구분되게 호박색). 색은 변동 폭(e.ranges)의 순위로만 정하고 값은 바꾸지 않는다
const STILL = '#8fa0c8', GOLD = '#ffd68c', AMBER = '#e9a650', PALE = '#f3e6c4';   // PALE: 같은 색이 겹칠 때 두 번째 선
function colorOf(e, l) {
  const r = x => e.ranges[x.zoneId] ?? Infinity, min = Math.min(...e.lines.map(r));
  const base = x => (r(x) === min ? STILL : x.place === 'north' ? AMBER : GOLD);
  const c = base(l), i = e.lines.indexOf(l);
  return c !== STILL && e.lines.slice(0, i).some(x => base(x) === c) ? PALE : c;
}
// 곡선: 상자·격자 없이 0 기준선만. 선 밑에 어두운 테두리를 깔아 금빛 지도 위에서도 뜨게 하고, 이름과 변동 폭은 선 끝에 바로 붙인다
const W = 400, H = 270, L = 4, R = 150, T = 22, B = 24;
function wrap(text, max = 11) {   // 긴 이름은 두 줄로(띄어쓰기에서 자른다)
  if (text.length <= max) return [text];
  const sp = [...text.matchAll(/ /g)].map(m => m.index), mid = text.length / 2;
  const at = sp.sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid))[0];
  return at == null ? [text] : [text.slice(0, at), text.slice(at + 1)];
}
function chart(e, label) {
  const n = e.dates.length, all = e.lines.flatMap(l => l.values).filter(v => v != null);
  const lo = Math.min(-0.5, ...all) - 0.2, hi = Math.max(0.5, ...all) + 0.2;
  const x = k => L + (W - L - R) * k / (n - 1), y = v => T + (H - T - B) * (hi - v) / (hi - lo);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('proof.chartLabel')}">`;
  s += `<line class="zero" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  for (let k = 0; k < n; k++) if (e.lines.every(l => l.values[k] == null))   // 자료가 없는 통과
    s += `<line class="gap" x1="${x(k)}" x2="${x(k)}" y1="${T}" y2="${H - B}"/><text class="tick" x="${x(k)}" y="${T - 8}" text-anchor="middle">${t('proof.gap', { day: dateText(e.dates[k]) })}</text>`;
  s += `<text class="tick" x="${x(0)}" y="${H - 6}">${dateText(e.dates[0])}</text><text class="tick" x="${x(n - 1)}" y="${H - 6}" text-anchor="end">${dateText(e.dates[n - 1])}</text>`;
  const last = l => { for (let k = n - 1; k >= 0; k--) if (l.values[k] != null) return k; return 0; };
  for (const l of e.lines) {
    let d = '', pen = false;
    l.values.forEach((v, k) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(k).toFixed(1)} ${y(v).toFixed(1)}`; pen = true; });
    const c = colorOf(e, l), k = last(l);
    s += `<path class="halo" d="${d}"/><path d="${d}" stroke="${c}" stroke-width="${c === STILL ? 2.2 : 2.8}"/><circle cx="${x(k).toFixed(1)}" cy="${y(l.values[k]).toFixed(1)}" r="3.4" fill="${c}"/>`;
  }
  // 이름표: 마지막 값 높이에서 시작해 겹치면 아래로 민다(두 줄 이름은 칸을 더 쓴다)
  const tags = e.lines.map(l => ({ l, y: y(l.values[last(l)]), lines: wrap(label(l)) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < tags.length; i++) { const need = 22 + 14 * tags[i - 1].lines.length; if (tags[i].y - tags[i - 1].y < need) tags[i].y = tags[i - 1].y + need; }
  for (const g of tags) {
    const c = colorOf(e, g.l), k = last(g.l), tx = x(n - 1) + 14;
    s += `<line x1="${x(k) + 4}" x2="${tx - 3}" y1="${y(g.l.values[k])}" y2="${g.y}" stroke="${c}" stroke-opacity=".5"/>`;
    s += `<text class="db" x="${tx}" y="${g.y + 2}" fill="${c}">${e.ranges[g.l.zoneId] ?? '–'} dB</text>`;
    g.lines.forEach((ln, i) => { s += `<text class="nm" x="${tx}" y="${g.y + 18 + i * 14}">${ln}</text>`; });
  }
  return s + '</svg>';
}

// 값만 보고 정하는 결론 제목(단면 팝업과 같은 생각): 모두 작으면 고요, DMZ 안이 바깥의 절반 이하면 골짜기,
// DMZ 안에서도 경작지(토지피복 50% 이상)가 크게 흔들리면 그 사실. 아니면 지역 이름과 땅 수만
function headline(e) {
  const rg = l => e.ranges[l.zoneId] ?? 0, max = Math.max(...e.lines.map(rg));
  const inside = e.lines.filter(l => l.place === 'dmz'), outside = e.lines.filter(l => l.place !== 'dmz');
  if (max < 0.8) return t('proof.h.flat');
  const farmIn = inside.find(l => (l.cover?.cropland ?? 0) >= 50 && rg(l) >= 2 * Math.min(...inside.map(rg)) && inside.length > 1);
  if (farmIn) return t('proof.h.farmIn');
  if (inside.length && outside.length && Math.max(...inside.map(rg)) * 2 <= Math.min(...outside.map(rg))) return t('proof.h.valley');
  return null;
}

// 지도에 그릴 구역 테두리(night.js 가 쓴다): 곡선과 같은 색
export function regionZones(id) {
  if (!id) return [];
  const e = evidence(data.zones, id, { landcover: data.landcover, rain: data.rain });
  return e.lines.map(l => { const z = data.zones.find(q => q.id === l.zoneId); return z?.polygon && { polygon: z.polygon, color: colorOf(e, l), label: zoneName(z) ?? l.name }; }).filter(Boolean);
}

function render() {
  const id = state.evidenceAt;
  el.hidden = !(id && state.screen === 'night');
  if (el.hidden) return;
  const e = evidence(data.zones, id, { landcover: data.landcover, rain: data.rain });
  // 구역 이름은 자료의 한국어 이름을 쓰고, 영어 화면에서는 분계선 기준 위치로 부른다
  const label = l => zoneName(data.zones.find(z => z.id === l.zoneId)) ?? l.name;
  const cover = l => {   // 비율이 큰 순서로 둘까지(5% 이상만). 가운뎃점 대신 '와/and'로 잇는다
    const top = l.cover ? Object.entries(l.cover).filter(([, v]) => v >= 5).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${t('cover.' + k)} ${v.toFixed(0)}%`) : [];
    return top.length === 2 ? t('proof.cover', { a: top[0], b: top[1] }) : top[0] || '';
  };
  const where = l => t('place.' + l.place).split(' · ')[0];   // '분계선 북쪽 · 경작지로 보이는 곳'은 이름에 이미 들어 있어 앞부분만
  const anyCover = e.lines.some(l => l.cover);
  // 함께 변한 통과와 그 직전 3일 강수
  const shared = (e.shared || []).map(x => (x.rain_mm_3day == null ? t('proof.rainUnknown', { day: dateText(x.date) })
    : t('proof.rain', { day: dateText(x.date), mm: x.rain_mm_3day < 10 ? x.rain_mm_3day.toFixed(1) : x.rain_mm_3day.toFixed(0) }))).join(', ');
  const h = headline(e), region = t('region.' + id);
  const go = missionTarget(id), locked = go !== id;
  // 카드 없이 오른쪽 가장자리의 어둠 위에: 어디 → 결론 → 곡선(선 끝 이름) → 한 줄 설명 → 자료와 한계 · 미션
  el.innerHTML = `
    <button type="button" class="close" data-close>${t('common.close')}</button>
    ${h ? `<p class="where">${t('proof.where', { region, n: e.lines.length })}</p>` : ''}
    <h2>${h ?? t('proof.titleN', { region, n: e.lines.length })}</h2>
    ${chart(e, label)}
    <p class="foot">${t('proof.foot')}</p>
    ${locked ? `<p class="lock">${t('proof.locked', { region })}</p>` : ''}
    <div class="row">
      <details class="more"><summary>${t('night.notes')}</summary>
        ${e.lines.map(l => `<p><b>${label(l)}</b>: ${where(l)}${cover(l) ? `, ${cover(l)}` : ''}</p>`).join('')}
        ${anyCover ? `<p>${t('proof.coverNote')}</p>` : ''}
        ${e.excluded.length && shared ? `<p>${t('proof.shared', { list: shared })}</p>` : ''}
        ${e.caveats.map(k => `<p>${t('caveat.' + k, { passes: fact('passes'), prov: fact('passes_provisional') })}</p>`).join('')}
      </details>
      <button type="button" class="next" data-mission>${locked ? t('proof.missionNext', { region: t('region.' + go) }) : t('proof.mission', { region }).replace(/\s*→\s*$/, '')}</button>
    </div>`;
}

export function initProof() {
  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return set({ evidenceAt: null });
    if (e.target.closest('[data-mission]')) set({ screen: 'mission', stop: missionTarget(state.evidenceAt) });
  });
  subscribe((s, prev) => { if (s.evidenceAt !== prev.evidenceAt || s.screen !== prev.screen || s.lang !== prev.lang) render(); });
  render();
}
