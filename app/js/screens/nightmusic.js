// 밤사진 재생용 곡: 밤하늘에 어울리는 잔잔한 곡. 이 화면을 위해 새로 지은 것이고, 기존 곡이나 녹음을 쓰지 않는다.
// 북·박자도, 또렷한 주선율도 없다. 천천히 바뀌는 부드러운 화음 위에 긴 음 하나가 머물고, 별처럼 드문드문 높은 음이 울린다.
// 통과가 쌓일수록 별 소리가 조금씩 늘어난다. 이것은 연출이며, 음높이나 세기가 관측값을 뜻하지는 않는다.
// 화면·DOM 과 무관한 순수 자료다. sound.js 의 play(plan) 이 그대로 연주한다(부드러운 pad·bass·sparkle 소리만 쓴다).

export const BAR = 4;          // 한 마디의 길이(초). 화음이 4초에 한 번만 바뀐다
export const BARS = 6;         // 여섯 마디 = 24초

// 마디별 [낮은 음, 화음(미디 번호), 머무는 음 [음, 시작(초), 길이(초)]]
// 레장조의 넓은 화음: Dmaj9 → Bm11 → Gmaj7 → Asus2 → Gmaj9 → Dmaj9. 머무는 음은 한 음씩 천천히 내려온다
const SONG = [
  [38, [57, 61, 64, 66], [78, 1.0, 2.6]],
  [35, [57, 62, 64, 66], [76, 0.5, 2.8]],
  [43, [59, 62, 66, 69], [74, 1.0, 2.6]],
  [45, [57, 59, 64, 69], [76, 0.5, 2.8]],
  [43, [57, 59, 62, 66], [71, 1.0, 2.6]],
  [38, [57, 61, 64, 69], [69, 0.0, 3.6]],
];

// 씨앗이 같으면 언제나 같은 수열(재생할 때마다 같은 별이 뜬다)
function dice(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// 마디 k 에서 울리는 별의 수: 1, 1, 2, 2, 3, 3
export const starsIn = bar => 1 + Math.floor(bar / 2);

export function nightScore() {
  const events = [], rnd = dice(20261114);
  SONG.forEach(([root, chord, [note, at, len]], m) => {
    const t0 = m * BAR;
    events.push({ type: 'pad', time: t0, dur: BAR * 1.7, midis: chord, gain: .8 });       // 다음 마디까지 겹치며 스며든다
    events.push({ type: 'bass', time: t0, dur: BAR * .9, midi: root, gain: .28 });
    events.push({ type: 'pad', time: t0 + at, dur: len, midis: [note], gain: .7 });      // 머무는 음도 부드러운 패드 소리로
    for (let i = 0; i < starsIn(m); i++) {
      const when = .5 + Math.round(rnd() * 6) / 2;                                        // 0.5 ~ 3.5초, 반 초 간격
      const midi = chord[Math.floor(rnd() * chord.length)] + 24;                          // 그 마디 화음의 음을 두 옥타브 위에서
      events.push({ type: 'sparkle', time: t0 + when, dur: .3, midi, gain: .25 + .25 * rnd() });
    }
  });
  return { bpm: 60, duration: BARS * BAR, events: events.sort((a, b) => a.time - b.time) };
}

// 밤하늘 영상(film.js)용: 같은 곡을 두 번 이어 48초. 두 번째에는 별이 조금 더 많다(연출)
export function filmScore() {
  const a = nightScore(), rnd = dice(1115), extra = [];
  for (let m = 0; m < BARS; m++) {
    const chord = SONG[m][1];
    extra.push({ type: 'sparkle', time: a.duration + m * BAR + .25 + Math.round(rnd() * 6) / 2, dur: .3, midi: chord[Math.floor(rnd() * chord.length)] + 24, gain: .22 + .2 * rnd() });
  }
  const events = [...a.events, ...a.events.map(e => ({ ...e, time: e.time + a.duration })), ...extra].sort((x, y) => x.time - y.time);
  return { bpm: a.bpm, duration: a.duration * 2, events };
}

// ---- 엔딩: 밤하늘에서 들은 주제가 돌아와 완성된다. 같은 화음 위에 여기서 처음으로 가락이 얹힌다.
// 느리게(한 박 1초), 마지막은 길게 머물다 사라진다. 음악은 연출이고, 실측을 따르는 것은 춤추는 선의 높이다(dance.js).
export const ENDING_BEAT = 1;     // 엔딩의 한 박(초). 춤의 느린 출렁임이 이 박을 따른다
const CLOSE = [                   // 주제의 여섯 마디 뒤에 붙는 맺음 두 마디: 솔 → 레
  [43, [59, 62, 66, 69]],
  [38, [57, 62, 66, 69]],
];
// 가락: 마디마다 [음, 시작(초), 길이(초)]. 올라갔다가 천천히 내려와 으뜸음에 머문다
const TUNE = [
  [[69, 2, 1], [74, 3, 1]],
  [[78, 0, 2], [76, 2, 1], [74, 3, 1]],
  [[71, 0, 1.5], [74, 1.5, 1.5], [76, 3, 1]],
  [[76, 0, 2.5], [73, 2.5, 1.5]],
  [[74, 0, 1], [76, 1, 1], [78, 2, 2]],
  [[81, 0, 2], [78, 2, 1], [76, 3, 1]],
  [[74, 0, 2], [71, 2, 2]],
  [[69, 0, 1], [74, 1, 5]],
];
export function endingScore() {
  const events = [], rnd = dice(1953), bars = [...SONG.map(([root, chord]) => [root, chord]), ...CLOSE], n = bars.length;
  bars.forEach(([root, chord], m) => {
    const t0 = m * BAR, last = m === n - 1;
    events.push({ type: 'pad', time: t0, dur: BAR * (last ? 2.2 : 1.7), midis: chord, gain: .8 });
    events.push({ type: 'bass', time: t0, dur: BAR * (last ? 1.6 : .9), midi: root, gain: .3 });
    for (const [midi, at, len] of TUNE[m]) {
      events.push({ type: 'pad', time: t0 + at, dur: len * 1.15, midis: [midi], gain: .8 });        // 가락은 부드러운 소리로 노래하고
      events.push({ type: 'sparkle', time: t0 + at, dur: .3, midi: midi + 12, gain: .32 });        // 음이 시작할 때 작은 종소리가 겹친다
    }
    for (let i = 0; i < (last ? 1 : 2); i++)                                                       // 밤하늘의 별 소리가 뒤에서 이어진다
      events.push({ type: 'sparkle', time: t0 + .5 + Math.round(rnd() * 6) / 2, dur: .3, midi: chord[Math.floor(rnd() * chord.length)] + 24, gain: .16 + .14 * rnd() });
  });
  return { bpm: 60, duration: n * BAR + 3, events: events.sort((a, b) => a.time - b.time) };       // 마지막 화음이 사라질 3초를 더 둔다
}

// 조각을 받을 때: 주제의 한 마디가 짧게 울린다. n번째 조각이면 n번째 마디의 화음이고, 조각이 늘수록 목소리가 더해진다
export function pieceChime(n) {
  const k = Math.max(1, Math.min(SONG.length, n)), [root, chord] = SONG[k - 1], events = [];
  events.push({ type: 'pad', time: 0, dur: BAR * 1.2, midis: chord, gain: .75 });
  if (k >= 2) events.push({ type: 'bass', time: 0, dur: BAR * .9, midi: root, gain: .28 });
  for (let i = 0; i < k; i++) events.push({ type: 'sparkle', time: .4 + i * .45, dur: .3, midi: chord[i % chord.length] + 24 + (i >= chord.length ? 12 : 0), gain: .3 });
  return { bpm: 60, duration: BAR, events };
}
