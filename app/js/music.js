// 악보: 전통 민요 아리랑의 가락(주선율)에 반주 다섯 층을 얹은 편곡. 화면·소리와 무관한 순수 자료다.
// 3박자, 128 BPM, 16마디(48박 = 22.5초). 주선율은 고정이고, 반주 다섯 층을 지역이 하나씩 맡는다.
export const BPM = 128, BEAT = 60 / BPM, BARS = 16, BEATS = BARS * 3;
export const LAYER_OF = { paju: 'kick', yeoncheon: 'hat', cheorwon: 'bass', hwacheon: 'pad', yanggu: 'sparkle' };
export const LAYER_NAME = { kick: '킥', hat: '하이햇', bass: '베이스', pad: '패드', sparkle: '반짝임' };

const N = { D4: 62, E4: 64, G4: 67, A4: 69, B4: 71, D5: 74 };   // 솔 음계(레 미 솔 라 시)
// 마디별 [음, 박] 목록. 아리랑 아리랑 아라리요 / 아리랑 고개로 넘어간다 / 나를 버리고 가시는 님은 / 십리도 못 가서 발병 난다
const A1 = [['D4', 1.5], ['E4', .5], ['D4', .5], ['E4', .5]], A2 = [['G4', 1.5], ['A4', .5], ['G4', .5], ['A4', .5]];
const A3 = [['B4', 1], ['A4', .5], ['B4', .5], ['A4', .5], ['G4', .5]], A4 = [['E4', 1.5], ['D4', .5], ['E4', 1]];
const B2 = [['B4', .5], ['A4', .5], ['G4', .5], ['E4', .5], ['D4', .5], ['E4', .5]], B3 = [['G4', 1.5], ['A4', .5], ['G4', 1]], B4 = [['G4', 3]];
const C1 = [['D5', 2], ['D5', 1]], C2 = [['D5', 1], ['B4', 1], ['A4', 1]];
const MELODY = [A1, A2, A3, A4, A2, B2, B3, B4, C1, C2, A3, A4, A2, B2, B3, B4];
// 마디별 화음의 밑음(미디 번호)과 3화음
const CHORDS = [[43, [67, 71, 74]], [43, [67, 71, 74]], [40, [64, 67, 71]], [40, [64, 67, 71]], [43, [67, 71, 74]], [40, [64, 67, 71]], [38, [62, 66, 69]], [43, [67, 71, 74]]];

export function score() {
  const events = [];
  MELODY.forEach((bar, m) => {
    let t = m * 3;
    for (const [note, len] of bar) { events.push({ type: 'lead', time: t * BEAT, dur: len * BEAT * .92, midi: N[note] }); t += len; }
    const [root, triad] = CHORDS[m % CHORDS.length], t0 = m * 3;
    events.push({ type: 'kick', time: t0 * BEAT, dur: .25 });                                       // 마디의 첫 박
    if (m % 2) events.push({ type: 'kick', time: (t0 + 2.5) * BEAT, dur: .2 });                     // 두 마디마다 당김음
    for (let h = 0; h < 6; h++) events.push({ type: 'hat', time: (t0 + h * .5) * BEAT, dur: .05, accent: h % 2 === 0 });
    events.push({ type: 'hat', time: (t0 + 2) * BEAT, dur: .12, snare: true });                     // 셋째 박의 스네어
    for (const b of [0, 1.5, 2]) events.push({ type: 'bass', time: (t0 + b) * BEAT, dur: BEAT * (b ? .45 : 1.3), midi: root + (b === 2 ? 7 : 0) });
    events.push({ type: 'pad', time: t0 * BEAT, dur: 3 * BEAT, midis: triad });
    triad.forEach((n, i) => events.push({ type: 'sparkle', time: (t0 + i + .5) * BEAT, dur: .3, midi: n + 12 }));
  });
  return { bpm: BPM, duration: BEATS * BEAT, events: events.sort((a, b) => a.time - b.time) };
}

// 조각 미리 듣기: 모은 지역이 맡은 층만 처음 beats 박(기본 8박 = 3.75초). 주선율은 다섯 조각을 모은 뒤(피날레)에만 나온다.
export function layersPreview(ids, beats = 8) {
  const types = ids.map(id => LAYER_OF[id]).filter(Boolean), full = score();
  return { bpm: BPM, duration: beats * BEAT, events: full.events.filter(e => types.includes(e.type) && e.time < beats * BEAT - 1e-9) };
}
