// 소리: 악보(music.js)의 음을 Web Audio 로 합성한다. 녹음된 음원은 쓰지 않는다.
// 음마다 붙은 gain(rhythm.applyRhythm) 이 그 층의 세기다. gain 이 0 인 음은 내지 않는다.
let ctx = null, master = null, noise = null, live = [];
export let soundOn = true;
// 소리 끄기는 곡을 멈추지 않고 볼륨만 0으로 내린다. 곡은 그대로 흐르므로 다시 켜면 그 자리부터 들린다
const VOL = .5;
export const setSound = on => {
  soundOn = on;
  if (!ctx) return;
  if (on && ctx.state === 'suspended') ctx.resume().catch(() => {});
  master.gain.setTargetAtTime(on ? VOL : 0, ctx.currentTime, .03);
};

function ensure() {
  if (ctx) return true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = soundOn ? VOL : 0;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  } catch { ctx = null; return false; }   // 소리를 낼 수 없는 환경에서도 미션과 춤은 그대로 간다
}
// 오디오 장치는 처음 열 때 느린 노트북에서 0.2초쯤 멈춘다. 첫 터치(오프닝 문지르기·단추)에 미리 열어, 영상이 시작되는 순간 멈칫하지 않게 한다
globalThis.addEventListener?.('pointerdown', ensure, { once: true, capture: true });
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

function env(t, dur, peak, attack = .005) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + .02, dur));
  g.connect(master); return g;
}
function osc(type, freq, t, dur, out, detune = 0) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
  o.connect(out); o.start(t); o.stop(t + dur + .05); live.push(o); return o;
}
function hiss(t, dur, out, type, freq) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(); s.buffer = noise; f.type = type; f.frequency.value = freq;
  s.connect(f); f.connect(out); s.start(t); s.stop(t + dur + .05); live.push(s);
}

const VOICE = {
  kick(e, t, k) { const g = env(t, .28, .95 * k), o = osc('sine', 130, t, .28, g); o.frequency.exponentialRampToValueAtTime(42, t + .16); },
  hat(e, t, k) { e.snare ? hiss(t, .14, env(t, .14, .34 * k), 'bandpass', 1900) : hiss(t, .05, env(t, .05, (e.accent ? .2 : .11) * k), 'highpass', 7500); },
  bass(e, t, k) { const g = env(t, e.dur, .42 * k, .01), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.connect(g); osc('sawtooth', hz(e.midi), t, e.dur, f); },
  pad(e, t, k) { const g = env(t, e.dur, .11 * k, .35); for (const m of e.midis) { osc('triangle', hz(m), t, e.dur, g, -6); osc('sine', hz(m), t, e.dur, g, 7); } },
  sparkle(e, t, k) { osc('sine', hz(e.midi), t, .3, env(t, .3, .16 * k, .003)); },
  lead(e, t, k) { const g = env(t, e.dur, .3 * k, .02); osc('triangle', hz(e.midi), t, e.dur, g); osc('square', hz(e.midi), t, e.dur, env(t, e.dur, .05 * k, .02)); },
};

// plan = { duration, events:[{ type, time, gain, ... }] }. 시작한 시각(performance.now 기준 ms)을 돌려준다. 소리가 꺼져 있어도 곡은 볼륨 0으로 흐른다.
export function play(plan) {
  stop();
  const startedAt = performance.now() + 80;
  if (!ensure()) return startedAt;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const t0 = ctx.currentTime + .08;
  for (const e of plan.events) { const k = e.gain ?? 1; if (k > 0 && VOICE[e.type]) VOICE[e.type](e, t0 + e.time, k); }
  return startedAt;
}
// 짧은 음 하나. play() 와 달리 울리고 있는 곡을 멈추지 않는다(땅 연주용).
export function blip(freq, gain = .25, dur = .28) {
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const t = ctx.currentTime + .01, g = env(t, dur, gain, .004);
  osc('triangle', freq, t, dur, g); osc('sine', freq * 2, t, dur * .6, env(t, dur * .6, gain * .25, .004));
}
export function stop() {
  for (const n of live) { try { n.stop(); } catch { /* 이미 끝난 음 */ } }
  live = [];
}
