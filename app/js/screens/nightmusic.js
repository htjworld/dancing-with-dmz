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
