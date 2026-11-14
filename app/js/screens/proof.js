// 근거 패널: 밤사진에서 지역을 고르면 열린다. 그 지역 구역들의 '숲 대비' 계절 곡선, 변동 폭, 한계 문구, 미션 진입.
// 계산은 js/evidence.js(htj)가 하고 여기서는 그리기만 한다. 숫자를 손으로 적지 않는다.
import { state, set, subscribe, data, fact } from '../state.js';
import { evidence } from '../evidence.js';
import { t, dateText, zoneName } from '../i18n.js';

const el = document.getElementById('proof');
// 선마다 다른 색. 순서는 evidence() 가 주는 남 → DMZ → 북이다. 같은 자리(예: 파주의 DMZ 안 두 구역)에 둘이 있어도 구분된다
const PALETTE = ['#ffe1a2', '#9fd0ff', '#ffa66b', '#8ff7b9'];
const colorOf = (e, l) => PALETTE[e.lines.indexOf(l) % PALETTE.length];
const W = 320, H = 180, L = 30, R = 10, T = 12, B = 22;

function chart(e) {
  const n = e.dates.length, all = e.lines.flatMap(l => l.values).filter(v => v != null);
  const lim = Math.max(2, Math.ceil(Math.max(...all.map(Math.abs), 0)));
  const x = k => L + (W - L - R) * k / (n - 1), y = v => T + (H - T - B) * (lim - v) / (2 * lim);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('proof.chartLabel')}">`;
  for (const v of [-lim, 0, lim]) s += `<line class="grid${v ? '' : ' zero'}" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${L - 4}" y="${y(v) + 3}" text-anchor="end">${v > 0 ? '+' : ''}${v}</text>`;
  // 자료가 없는 통과(모든 선이 비는 칸)와, 모든 구역이 함께 변한 통과를 옅게 표시한다
  for (let k = 0; k < n; k++) {
    const gap = e.lines.every(l => l.values[k] == null);
    if (gap) s += `<rect class="rest" x="${x(k) - 7}" y="${T}" width="14" height="${H - T - B}"/>`;
    else if (e.excluded.includes(k)) s += `<line class="shared" x1="${x(k)}" x2="${x(k)}" y1="${T}" y2="${H - B}"/>`;
  }
  s += `<text class="tick" x="${x(0)}" y="${H - 6}">${dateText(e.dates[0])}</text><text class="tick" x="${x(n - 1)}" y="${H - 6}" text-anchor="end">${dateText(e.dates[n - 1])}</text>`;
  for (const l of e.lines) {
    let d = '', pen = false;
    l.values.forEach((v, k) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(k).toFixed(1)} ${y(v).toFixed(1)}`; pen = true; });
    s += `<path d="${d}" stroke="${colorOf(e, l)}"/>`;
    l.values.forEach((v, k) => { if (v != null) s += `<circle cx="${x(k).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2" style="fill:${colorOf(e, l)}"/>`; });
  }
  return s + '</svg>';
}

function render() {
  const id = state.evidenceAt;
  el.hidden = !(id && state.screen === 'night');
  if (el.hidden) return;
  const e = evidence(data.zones, id, { landcover: data.landcover, rain: data.rain });
  // 구역 이름은 자료의 한국어 이름을 쓰고, 영어 화면에서는 분계선 기준 위치로 부른다
  const label = l => zoneName(data.zones.find(z => z.id === l.zoneId)) ?? l.name;
  // 토지피복: 비율이 큰 순서로 둘까지(5% 이상만)
  const cover = l => (l.cover ? Object.entries(l.cover).filter(([, v]) => v >= 5).sort((a, b) => b[1] - a[1]).slice(0, 2)
    .map(([k, v]) => `${t('cover.' + k)} ${v.toFixed(0)}%`).join(' · ') : '');
  const anyCover = e.lines.some(l => l.cover);
  // 함께 변한 통과와 그 직전 3일 강수
  const shared = (e.shared || []).map(x => (x.rain_mm_3day == null ? t('proof.rainUnknown', { day: dateText(x.date) })
    : t('proof.rain', { day: dateText(x.date), mm: x.rain_mm_3day < 10 ? x.rain_mm_3day.toFixed(1) : x.rain_mm_3day.toFixed(0) }))).join(', ');
  el.innerHTML = `
    <button type="button" class="close" data-close aria-label="${t('proof.close')}">×</button>
    <p class="eye">${t('region.' + id)} · ${t('proof.eye')}</p>
    <h2>${t('proof.title')}</h2>
    ${chart(e)}
    <ul class="ranges">${e.lines.map(l => `<li><i style="background:${colorOf(e, l)}"></i><span>${label(l)}<small>${t('place.' + l.place)}${cover(l) ? `<br>${cover(l)}` : ''}</small></span><b>${e.ranges[l.zoneId] ?? '–'} dB</b></li>`).join('')}</ul>
    <p class="fine">${t('proof.rangeNote')}${anyCover ? ' ' + t('proof.coverNote') : ''}</p>
    ${e.excluded.length ? `<p class="fine">${t('proof.sharedNote')} ${shared ? t('proof.shared', { list: shared }) : ''}</p>` : ''}
    <ul class="caveats">${e.caveats.map(k => `<li>${t('caveat.' + k, { passes: fact('passes'), prov: fact('passes_provisional') })}</li>`).join('')}</ul>
    <button type="button" class="next" data-mission>${t('proof.mission', { region: t('region.' + id) })}</button>`;
}

export function initProof() {
  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return set({ evidenceAt: null });
    if (e.target.closest('[data-mission]')) set({ screen: 'mission', stop: state.evidenceAt });
  });
  subscribe((s, prev) => { if (s.evidenceAt !== prev.evidenceAt || s.screen !== prev.screen || s.lang !== prev.lang) render(); });
  render();
}
