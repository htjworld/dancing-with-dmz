// 파주 장단 · 시간의 눈: 논이 가장 어두웠던 날과 가장 밝았던 날을 찾는다.
import { state, set, data, zone, pass, rainAt, addKey, mdK } from '../state.js';
import { level, change, refOf, togetherDays } from '../calc.js';
import { extremeDays, judgeExtreme, missionReady } from '../missions.js';

const ZONE = 'paju-dmz_farm';
const fmt = v => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1)}`;

// 정답이 아닌 날에서 시작한다(첫 화면이 답을 알려 주지 않게)
export function startCycle() {
  const e = extremeDays(data.zones, ZONE), answers = new Set([...e.dark, ...e.bright, e.brightForest]);
  return data.passes.find(p => !p.rest && !answers.has(p.cycle))?.cycle ?? 0;
}

// 넘겨 본 날에만 점이 찍히는 밝기 선
function chart() {
  const z = zone(ZONE), n = data.passes.length, W = 300, H = 150, L = 34, R = 8, T = 12, B = 22;
  const all = z.observations.map(o => o.hh_db).filter(v => v != null), lo = Math.min(...all) - .4, hi = Math.max(...all) + .4;
  const x = c => L + (W - L - R) * c / (n - 1), y = v => T + (H - T - B) * (hi - v) / (hi - lo);
  const seen = [...new Set(state.visited)].sort((a, b) => a - b).filter(c => level(z, c) != null);
  const path = seen.map((c, i) => `${i ? 'L' : 'M'}${x(c).toFixed(1)},${y(level(z, c)).toFixed(1)}`).join('');
  const rest = data.passes.filter(p => p.rest).map(p => `<rect x="${x(p.cycle) - 9}" y="${T}" width="18" height="${H - T - B}" class="rest"/>`).join('');
  const dots = seen.map(c => `<circle cx="${x(c)}" cy="${y(level(z, c))}" r="${c === state.cycle ? 5.5 : 3.2}" class="${c === state.cycle ? 'now' : ''}"/>`).join('');
  const flag = (k, label) => state.marks[k] == null ? '' : `<text x="${x(state.marks[k])}" y="${y(level(z, state.marks[k])) + (k === 'dark' ? 16 : -9)}" class="flag">${label}</text>`;
  const ticks = [Math.ceil(lo), Math.floor(hi)].map(v => `<text x="${L - 5}" y="${y(v) + 4}" class="tick" text-anchor="end">${v}</text><line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/>`).join('');
  const ends = `<text x="${L}" y="${H - 5}" class="tick">${mdK(data.passes[0].date)}</text><text x="${W - R}" y="${H - 5}" class="tick" text-anchor="end">${mdK(data.passes[n - 1].date)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="DMZ 안 경작지의 날짜별 레이더 밝기. 넘겨 본 날에만 점이 찍힙니다.">
    ${rest}${ticks}${ends}<path d="${path}" class="line"/>${dots}${flag('dark', '어두움')}${flag('bright', '밝음')}
    <text x="${L}" y="9" class="tick">밝기 (HH, dB)</text></svg>`;
}

function mark(want) {
  const together = togetherDays(data.zones).map(t => t.cycle);
  const j = judgeExtreme(data.zones, ZONE, state.cycle, want, together), e = extremeDays(data.zones, ZONE), day = mdK(pass(state.cycle).date);
  let text;
  if (j.reason === 'rest') text = '이날은 자료가 없습니다. 위성이 이 통과를 남기지 않았습니다.';
  else if (!j.ok) text = want === 'dark' ? '이날보다 더 어두운 날이 있습니다. 다른 날짜도 넘겨 보세요.' : '이날보다 더 밝은 날이 있습니다. 다른 날짜도 넘겨 보세요.';
  else if (want === 'dark') {
    const others = e.dark.filter(c => c !== state.cycle).map(c => mdK(pass(c).date));
    text = `맞습니다. ${day}이 가장 어두웠습니다.` + (others.length ? ` ${others.join(', ')}도 거의 같은 밝기였습니다.` : '') +
      ' 물을 댄 논은 전파를 다른 방향으로 튕겨 보내 어둡게 보일 수 있습니다(가능한 설명).';
  } else if (j.reason === 'forest') {
    text = `인정합니다. 원본 값으로는 ${e.bright.map(c => mdK(pass(c).date)).join(', ')}이 가장 밝지만, 숲의 변화를 빼고 보면 ${day}이 가장 밝습니다.`;
  } else {
    const rain = rainAt('paju', state.cycle);
    text = `맞습니다. ${day}이 가장 밝았습니다.`;
    if (j.reason === 'together') text += ` 다만 이날은 모든 땅이 함께 밝아진 날입니다${rain != null && rain >= 10 ? `(직전 3일 비 ${rain.toFixed(0)} mm)` : ''}.` +
      (e.brightForest !== state.cycle ? ` 숲의 변화를 빼고 보면 ${mdK(pass(e.brightForest).date)}이 가장 밝습니다.` : '');
  }
  set(j.ok ? { note: { ok: true, text }, marks: { ...state.marks, [want]: state.cycle }, seen: addKey('paju', want) } : { note: { ok: false, text } });
}

function discovery() {
  const z = zone(ZONE), ref = refOf(data.zones, z);
  const range = r => { const v = r.observations.map(o => change(r, o.cycle)).filter(x => x != null); return Math.max(...v) - Math.min(...v); };
  return `<div class="found"><h3>이 지역에서 본 것</h3>
    <p>이 경작지의 밝기는 한 계절 동안 ${range(z).toFixed(1)} dB를 오르내렸습니다. 같은 기간 옆 숲은 ${range(ref).toFixed(1)} dB였습니다.</p>
    <p>가능한 설명: 물을 댄 논은 어둡고, 벼가 자라면 전파가 더 많이 되돌아와 밝아질 수 있습니다. 이 자료만으로 원인을 확정할 수는 없습니다.</p>
    <p class="fine">이 구역은 팀이 레이더 영상에서 고른 사각형이며, 대성동의 특정 논으로 확인된 것이 아닙니다.</p></div>`;
}

export function render() {
  const seen = state.seen.paju || [], ready = missionReady('paju', seen), got = state.fragments.includes('paju');
  const o = level(zone(ZONE), state.cycle), p = pass(state.cycle);
  const today = p.rest ? `${mdK(p.date)} · 자료 없음` : `${mdK(p.date)} · ${fmt(o)} dB`;
  const step = k => `<li class="${seen.includes(k) ? 'done' : ''}">${seen.includes(k) ? '✓' : '○'} ${k === 'dark' ? '가장 어두운 날' : '가장 밝은 날'}${state.marks[k] != null ? ` · ${mdK(pass(state.marks[k]).date)}` : ''}</li>`;
  return `${chart()}
    <p class="today">지금 보는 날: <b>${today}</b></p>
    <ul class="steps">${step('dark')}${step('bright')}</ul>
    ${ready ? '' : `<div class="acts">
      <button type="button" data-act="mark-dark" ${seen.includes('dark') ? 'disabled' : ''}>이 날이 가장 어둡다</button>
      <button type="button" data-act="mark-bright" ${seen.includes('bright') ? 'disabled' : ''}>이 날이 가장 밝다</button></div>
      <p class="hint">아래 날짜를 눌러 넘기면 그날의 점이 찍힙니다.</p>`}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${state.note.text}</p>` : ''}
    ${ready ? discovery() : ''}
    ${ready && !got ? '<button type="button" class="primary" data-act="take">♪ 파주 조각 받기</button>' : ''}
    ${got ? `<p class="note ok">파주 조각(킥)을 받았습니다. 날짜를 넘기면 이 구간의 선이 그날의 신호 변화만큼 움직입니다.</p>
      <p class="fine">선의 높이는 레이더 신호의 변화입니다. 땅이 실제로 움직인 것이 아닙니다.</p>
      <button type="button" class="primary" data-act="next">다음: 연천 임진강 →</button>` : ''}`;
}

export function act(name) {
  if (name === 'mark-dark') mark('dark');
  else if (name === 'mark-bright') mark('bright');
  else if (name === 'take' && missionReady('paju', state.seen.paju)) set({ fragments: [...state.fragments, 'paju'], note: null });
  else if (name === 'next') set({ stop: 'yeoncheon', note: null });
}
