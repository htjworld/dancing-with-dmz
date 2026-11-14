// 밤사진 재생용 곡: 밤하늘에 어울리는 잔잔한 곡. 이 화면을 위해 새로 지은 것이고, 기존 곡이나 녹음을 쓰지 않는다.
// 북·박자 없이 느린 화음(패드)과 낮은 음, 느린 가락, 그리고 별처럼 드문드문 울리는 높은 음으로만 짠다.
// 통과가 쌓일수록 별 소리가 늘어난다. 이것은 연출이며, 음높이나 세기가 관측값을 뜻하지는 않는다.
// 화면·DOM 과 무관한 순수 자료다. sound.js 의 play(plan) 이 그대로 연주한다.

export const BAR = 3;          // 한 마디의 길이(초). 60 BPM, 3박
export const BARS = 8;         // 여덟 마디 = 24초

// 솔 음계(레 미 솔 라 시). 땅 연주(landsound.js)와 같은 음계라 함께 울려도 어울린다
const STARS = [74, 76, 79, 81, 83, 86, 88, 91];
// 마디별 [낮은 음, 화음]. 솔 → 미단조 → 도 → 레, 두 번째 줄은 솔로 돌아와 쉰다
const CHORDS = [
  [43, [55, 62, 67, 71]], [40, [52, 59, 64, 67]], [36, [55, 60, 64, 67]], [38, [54, 57, 62, 66]],
  [43, [55, 62, 67, 71]], [40, [52, 59, 64, 67]], [36, [55, 60, 64, 67]], [43, [55, 59, 62, 67]],
];
// 느린 가락: 마디마다 [음, 시작 박(0~3), 길이(박)]. 길게 머물고 많이 쉰다
const MELODY = [
  [[71, 0, 2]], [[67, 0.5, 2]], [[64, 0, 1.5], [67, 1.5, 1.5]], [[69, 0, 2.5]],
  [[74, 0, 2]], [[71, 0.5, 2]], [[67, 0, 1.5], [64, 1.5, 1.5]], [[67, 0, 3]],
];

// 씨앗이 같으면 언제나 같은 수열(재생할 때마다 같은 별이 뜬다)
function dice(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// 마디 k 에서 울리는 별의 수: 첫 마디 1개에서 마지막 마디 6개까지 고르게 늘어난다
export const starsIn = bar => 1 + Math.round(5 * bar / (BARS - 1));

export function nightScore() {
  const events = [], rnd = dice(20261114);
  CHORDS.forEach(([root, chord], m) => {
    const t0 = m * BAR;
    events.push({ type: 'pad', time: t0, dur: BAR * 1.6, midis: chord, gain: .9 });          // 다음 마디까지 겹쳐 이어진다
    events.push({ type: 'bass', time: t0, dur: BAR * .95, midi: root, gain: .45 });
    for (const [midi, at, len] of MELODY[m]) events.push({ type: 'lead', time: t0 + at, dur: len * .95, midi, gain: .32 });
    for (let i = 0; i < starsIn(m); i++) {
      const at = Math.round(rnd() * 11) / 4;                                                  // 16분음표 격자 위의 아무 곳(0 ~ 2.75초)
      events.push({ type: 'sparkle', time: t0 + at, dur: .3, midi: STARS[Math.floor(rnd() * STARS.length)], gain: .5 + .4 * rnd() });
    }
  });
  return { bpm: 60, duration: BARS * BAR, events: events.sort((a, b) => a.time - b.time) };
}
