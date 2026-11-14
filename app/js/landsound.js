// 땅 연주: 지도를 쓸면 그 자리의 계절 변동 폭(dB)이 음이 된다. 많이 변한 땅은 높고 크게, 고요한 땅은 쉼.
import { blip } from './sound.js';

// 아리랑과 같은 솔 음계(레 미 솔 라 시)를 두 옥타브. 낮은 음 = 조금 변한 땅, 높은 음 = 많이 변한 땅
const SCALE = [62, 64, 67, 69, 71, 74, 76, 79, 81, 83];
export const REST_BELOW = 0.25;   // 눈금(scaleDb)의 25% 아래는 쉼. 숲·DMZ 안(약 0.3 dB / 1.5 dB = 0.2)이 여기에 든다
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

// dB -> { midi, freq, gain } 또는 null(쉼)
export function noteFor(db, scaleDb) {
  if (db == null || !Number.isFinite(db)) return null;
  const [lo, hi] = scaleDb, s = Math.max(0, Math.min(1, (db - lo) / (hi - lo)));
  if (s < REST_BELOW) return null;
  const k = Math.min(SCALE.length - 1, Math.floor(((s - REST_BELOW) / (1 - REST_BELOW)) * SCALE.length));
  return { midi: SCALE[k], freq: hz(SCALE[k]), gain: 0.12 + 0.3 * s };
}

// 포인터가 움직일 때마다 불러도 된다. 같은 음은 0.15초, 다른 음은 0.07초 안에 다시 울리지 않는다.
let last = { midi: null, at: -Infinity };
export function touch(db, scaleDb, now = performance.now()) {
  const n = noteFor(db, scaleDb);
  if (!n) { last = { midi: null, at: last.at }; return null; }
  if (now - last.at < (n.midi === last.midi ? 150 : 70)) return null;
  last = { midi: n.midi, at: now };
  blip(n.freq, n.gain);
  return n;
}
