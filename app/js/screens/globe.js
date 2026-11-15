// 밤하늘 영상의 도입(점 지구본): 땅을 점으로 찍은 밤의 지구, 지구 뒤로 깔린 은하수, 둘레를 도는 점선 궤도 고리와 위성.
// 위성이 지나가는 아래의 땅 점이 잠깐 밝아졌다 사그라든다(= 스스로 쏜 전파로 비춤). 같은 길을 몇 번 돌고, 천천히 DMZ로 내려가
// 지도의 첫 화면과 같은 축척·위치에서 끝난다. 궤도 고리의 높이, 비추는 폭, 도는 속도, 은하수는 설명·분위기용 연출이다.
// 지구본 점 자료(data/globe_dots.json)는 Natural Earth 110m 땅에서 고른 점이다.
// 은하수 그림(오프닝과 지구본 도입이 같은 하늘을 쓴다). 화면보다 1.3배 큰 캔버스를 돌려준다. 씨앗이 같아 언제나 같은 모습이다
export function paintSky(W, H, r = devicePixelRatio || 1) {
  W = Math.max(W, 16); H = Math.max(H, 16);   // 창 크기가 아직 0이면(숨은 탭 등) 작게라도 그린다
  const w = Math.ceil(W * 1.3), h = Math.ceil(H * 1.3);
  const sky = document.createElement('canvas'); sky.width = w * r; sky.height = h * r;
  const s = sky.getContext('2d'); s.setTransform(r, 0, 0, r, 0, 0);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += rnd(); return (u - 2) / 0.58; };
  // 띠의 중심선(살짝 휘어짐)과 그 법선
  const along = k => [w * (-0.05 + 1.1 * k), h * (0.95 - 0.86 * k) + Math.sin(k * 4.4 + 0.6) * h * 0.06];
  const width = k => h * (0.07 + 0.05 * Math.exp(-((k - 0.5) ** 2) / 0.05));
  const norm = k => { const [x0, y0] = along(k - 0.002), [x1, y1] = along(k + 0.002), L = Math.hypot(x1 - x0, y1 - y0); return [-(y1 - y0) / L, (x1 - x0) / L]; };
  // 1) 아주 옅고 가는 빛(띠의 결만 살짝)
  s.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const k = rnd(), [x, y] = along(k), rad = width(k) * (0.6 + rnd() * 0.5);
    const warm = Math.exp(-((k - 0.52) ** 2) / 0.02);
    const gr = s.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${warm > 0.4 ? '255,214,190' : '170,180,255'},${0.018 + 0.02 * warm})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    s.fillStyle = gr; s.beginPath(); s.arc(x, y, rad, 0, 7); s.fill();
  }
  // 2) 별 알갱이: 띠 안쪽에 촘촘히(가우스 분포), 바깥에 드물게
  for (let i = 0; i < 9000; i++) {
    const k = rnd(), [x, y] = along(k), [nx, ny] = norm(k), d = gauss() * width(k) * 0.55;
    const px = x + nx * d + (rnd() - 0.5) * 6, py = y + ny * d + (rnd() - 0.5) * 6;
    const a = 0.08 + rnd() ** 3 * 0.55, rr = 0.25 + rnd() ** 4 * 0.6;
    s.fillStyle = `rgba(${rnd() < 0.15 ? '255,225,200' : '215,225,255'},${a})`; s.fillRect(px, py, rr * 2, rr * 2);
  }
  for (let i = 0; i < 900; i++) { s.fillStyle = `rgba(215,225,255,${0.05 + rnd() * 0.18})`; s.fillRect(rnd() * w, rnd() * h, 0.7, 0.7); }
  // 3) 먼지 결: 띠 가운데를 따라 가늘게 끊어지는 어두운 줄
  s.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 160; i++) {
    const k = 0.15 + rnd() * 0.75, [x, y] = along(k), [nx, ny] = norm(k), off = (gauss() * 0.18 + 0.05) * width(k);
    const rad = width(k) * (0.08 + rnd() * 0.14);
    const gr = s.createRadialGradient(x + nx * off, y + ny * off, 0, x + nx * off, y + ny * off, rad);
    gr.addColorStop(0, 'rgba(6,12,28,0.55)'); gr.addColorStop(1, 'rgba(6,12,28,0)');
    s.fillStyle = gr; s.beginPath(); s.arc(x + nx * off, y + ny * off, rad, 0, 7); s.fill();
  }
  // 4) 밝은 별 몇 개
  for (let i = 0; i < 26; i++) {
    const x = rnd() * w, y = rnd() * h, a = 0.5 + rnd() * 0.4;
    s.fillStyle = `rgba(240,244,255,${a})`; s.beginPath(); s.arc(x, y, 0.8 + rnd() * 0.5, 0, 7); s.fill();
  }
  return sky;
}

export function createIntro() {
  const LEN = 15.5;
  const K = [127.46, 38.17], RAD = Math.PI / 180;
  const ORBIT_R = 1.12, BEAM = 4.2 * RAD;           // 궤도 고리 반지름(지구=1, 과장), 비추는 폭(반각)
  const cv = document.createElement('canvas');
  cv.id = 'film-globe';
  document.body.appendChild(cv);
  const cx = cv.getContext('2d');
  let lastCap = '', target = null;
  // 도착 단계(오프닝에서 이어질 때): 레이더 사진이 놓였던 화면 자리에서 시작해, 사진을 지구 위 그 자리에 붙인 채 카메라가 위로 빠져나간다
  // 비교용: ?tr=dots(사진이 점으로 풀려 한반도 점에 섞인다) | ?tr=scan(빛줄기가 사진을 훑고, 그 줄기 끝의 위성으로 올라간다)
  const TR = new URLSearchParams(location.search).get('tr') === 'scan' ? 'scan' : 'dots';
  const ARR = TR === 'scan' ? 4.4 : 4.4, HOLD = TR === 'scan' ? 1.3 : 0.7;   // 도착 단계 길이, 멀어지기 전에 머무는 시간
  let from = null, photo = null, pdots = [], prevT = Infinity;
  const pending = () => from || window.__introFrom;
  function prepare() {
    const f = window.__introFrom; window.__introFrom = null; from = null; photo = null; pdots = [];
    if (!f) return;
    from = f;
    const im = f.img;   // 오프닝에 이미 떠 있던 사진(이미 불러와져 있어 첫 장면부터 바로 그린다)
    {   // 오프닝과 같은 가장자리 흐림(타원 마스크)을 입힌 사진
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0);
      x.globalCompositeOperation = 'destination-in';
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, '#000'); g.addColorStop(0.62, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.setTransform(c.width * 0.72, 0, 0, c.height * 0.72, c.width / 2, c.height / 2);
      x.fillStyle = g; x.fillRect(-1.5, -1.5, 3, 3);
      photo = c;
    }
    if (TR === 'dots') {   // 사진을 밝기대로 작은 점으로 바꿔 둔다(지구본과 같은 점 그림체). 가장자리 흐림도 같은 타원으로
      const NX = 52, NY = Math.round(NX * im.naturalHeight / im.naturalWidth);   // 적고 고르게(지구본 점과 같은 간격감)
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const c = document.createElement('canvas'); c.width = NX; c.height = NY;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, NX, NY);
      const d = x.getImageData(0, 0, NX, NY).data, C = f.corners;
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const k = (j * NX + i) * 4;
        const u = (i + .5) / NX, v = (j + .5) / NY;
        const r = Math.hypot((u - .5) / .72, (v - .5) / .72), m = 1 - smooth(0.55, 0.95, r);
        const b = (d[k] + d[k + 1] + d[k + 2]) / 765 * m;
        if (b < 0.42) continue;   // 밝은 곳만 남긴다
        const lon = C[0][0] + u * (C[1][0] - C[0][0]) + v * (C[3][0] - C[0][0]), lat = C[0][1] + u * (C[1][1] - C[0][1]) + v * (C[3][1] - C[0][1]);
        pdots.push({ v: vec(lon, lat), b, lit: -9, at: Math.min(1, r) * 0.65 + rnd() * 0.35 });   // at: 풀리는 순서(0 가운데 ~ 1 가장자리)
      }
    }
  }
  let W = 0, H = 0, land = [], korea = [], dmzDots = [], dmzLines = [], ring = [];

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const vec = (lon, lat) => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // 궤도: 한반도 위를 지나는 대원. 방위각 190도(하강)
  const kv = vec(...K);
  const nT = [-Math.sin(K[1] * RAD) * Math.sin(K[0] * RAD), Math.cos(K[1] * RAD), -Math.sin(K[1] * RAD) * Math.cos(K[0] * RAD)];
  const eT = [Math.cos(K[0] * RAD), 0, -Math.sin(K[0] * RAD)];
  const AZ = 190 * RAD, dir = nT.map((v, i) => v * Math.cos(AZ) + eT[i] * Math.sin(AZ));
  const orbitAt = th => kv.map((v, i) => v * Math.cos(th) + dir[i] * Math.sin(th));   // 단위 벡터(지표 아래 점)

  // 배경 고르기: ?bg=galaxy(기본) | aurora | both
  const BG = 'galaxy';   // 배경: 은하수(별 알갱이 띠). 'aurora' | 'both' 로 바꿀 수 있다
  const useGalaxy = BG === 'galaxy' || BG === 'both', useAurora = BG === 'aurora' || BG === 'both';
  let sky = null;
  // 은하수: 안개 덩어리 대신 아주 작은 별 알갱이 수천 개가 대각선 띠로 모인 모습. 가운데에 가늘고 옅은 빛, 그 위를 어두운 먼지 결이 가른다.
  // 알갱이는 지구 점(1~2 px, 밝음)보다 훨씬 작고 어둡게 해서 지구 윤곽과 섞이지 않게 한다. 한 번만 그려 두고 천천히 흘린다
  const DPR = () => Math.min(1.5, devicePixelRatio || 1);   // 배율 2배 화면에서도 1.5배까지만(jmj 제안, 로컬 시험)
  function buildSky() { sky = paintSky(W, H, DPR()); }
  function resize() {
    const r = DPR(); W = innerWidth; H = innerHeight;
    cv.width = W * r; cv.height = H * r; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(r, 0, 0, r, 0, 0);
    if (useGalaxy) buildSky();
  }

  // 도입이 끝나면 그림판과 은하수 그림을 비우고, 다시 시작할 때 만든다(안 보이는 동안 화면 크기 그림 두 장을 붙잡아 두지 않는다)
  const free = () => { if (cv.width) { cv.width = cv.height = 0; sky = null; } };
  addEventListener('resize', () => { if (cv.width) resize(); else { W = innerWidth; H = innerHeight; } }); W = innerWidth; H = innerHeight; cv.width = cv.height = 0;   // 새 그림판의 기본 크기(300x150)가 아니라 '비어 있음'에서 시작한다

  async function init(lines, targetFn) {
    target = targetFn;
    const d = await (await fetch('data/globe_dots.json')).json();
    land = d.globe.map(([lon, lat]) => ({ v: vec(lon, lat), k: lon > 124 && lon < 131 && lat > 33 && lat < 43.2, lit: -9 }));
    korea = d.korea.map(([lon, lat]) => ({ v: vec(lon, lat), lit: -9 }));
    dmzDots = d.dmzg.map(([lon, lat]) => vec(lon, lat));
    dmzLines = lines;
    for (let i = 0; i < 240; i++) ring.push(i / 240 * Math.PI * 2);
  }
  function reset() { for (const d of land) d.lit = -9; for (const d of korea) d.lit = -9; }

  // 위성의 궤도 각(라디안, 0 = 한반도 위). 첫 통과는 천천히, 이어서 두 바퀴를 빠르게 돌아 같은 자리로
  function satTheta(t) {
    // 오프닝에서 왔을 때: scan 은 빛줄기 끝(사진 북쪽 위)에 머물다 지나가고, dots 는 지구가 드러날 무렵 북쪽에서 내려와 한반도 위를 지난다.
    // 그 뒤에는 궤도를 따라 한 바퀴 돌아 6.6초쯤 다시 한반도 위로, 한 바퀴 더. 오프닝 없이 시작하면 처음 시안 그대로
    const keys = !from ? [[0, -150], [1.2, -110], [6.4, 18], [8.6, 378], [10.6, 738], [LEN, 790]]
      : TR === 'scan' ? [[-ARR, -5], [-1.2, -4], [0, 4], [6.6, 364], [10.8, 724], [LEN, 780]]
      : [[-ARR, -70], [0, 4], [6.6, 364], [10.8, 724], [LEN, 780]];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
      const [a, A] = keys[i - 1], [b, B] = keys[i], k = (t - a) / (b - a);
      return (A + (B - A) * k) * RAD;
    }
    return keys[keys.length - 1][1] * RAD;
  }

  function frame(T) {
    if (T < prevT) { if (window.__introFrom) prepare(); else { from = null; photo = null; } }   // 새로 시작할 때(시각이 되돌아갈 때)만 정한다
    prevT = T;
    const A = from ? ARR : 0, t = T - A;   // t: 원래 도입의 시각(도착 단계 동안은 음수)
    if (t >= LEN) { cv.style.display = 'none'; free(); return false; }
    if (!cv.width) resize();
    cv.style.display = 'block';
    if (!land.length) return true;
    if (T < 0.05) reset();
    const arr = from ? ease(smooth(HOLD, A, T)) : 1;   // 0 = 사진 화면, 1 = 지구 전체
    const tg = target ? target() : { center: K, xy: [W / 2, H / 2], scale: Math.min(W, H) * 40 };
    // 카메라: 처음엔 동아시아 위, 첫 통과 동안 한반도로 돌아 맞추고, 10.8초부터 약 4.5초에 걸쳐 천천히 확대
    const spin = ease(smooth(0, 6.4, t)), zoom = smooth(10.8, LEN - 0.2, t), z = ease(zoom);
    const base = Math.min(W, H) * 0.34;
    // 지구 전체 화면: 오프닝에서 왔으면 처음부터 한반도를 가운데에 두고(돌지 않는다), 아니면 동아시아에서 한반도로 돈다
    const c0 = from ? [K[0], K[1] - 6] : [104 + (K[0] - 104) * spin, 14 + (K[1] - 14) * spin];
    let scale = base * Math.pow(tg.scale / base, z);
    let c = [c0[0] + (tg.center[0] - c0[0]) * z, c0[1] + (tg.center[1] - c0[1]) * z];
    let O = [W / 2 + (tg.xy[0] - W / 2) * z, H * 0.42 + (tg.xy[1] - H * 0.42) * z];
    if (from && arr < 1) {   // 사진 화면 -> 지구 전체: 축척은 지수로 줄이고, 사진 가운데는 화면에서 미끄러지지 않게 붙잡아 둔다
      scale = from.scale * Math.pow(base / from.scale, arr);
      const k = smooth(0.55, 1, arr);   // 지구를 돌려 맞추는 일은 거의 다 멀어진 뒤에
      c = [from.center[0] + (c0[0] - from.center[0]) * k, from.center[1] + (c0[1] - from.center[1]) * k];
      // 끝 화면에서 사진 가운데가 놓일 자리
      const pv = vec(...from.center), proj = (cc, sc, o) => {
        const L0 = cc[0] * RAD, P0 = cc[1] * RAD, x1 = pv[0] * Math.cos(L0) - pv[2] * Math.sin(L0), z1 = pv[0] * Math.sin(L0) + pv[2] * Math.cos(L0);
        return [o[0] + x1 * sc, o[1] - (pv[1] * Math.cos(P0) - z1 * Math.sin(P0)) * sc];
      };
      const Of = [W / 2, H * 0.42], Pf = proj(c0, base, Of), S = [from.xy[0] + (Pf[0] - from.xy[0]) * arr, from.xy[1] + (Pf[1] - from.xy[1]) * arr];
      const now = proj(c, scale, [0, 0]);
      O = [S[0] - now[0], S[1] - now[1]];   // 사진 가운데가 S 에 오도록 지구 중심을 옮긴다
    }   // 원래 크기 그대로, 조금 위로 올려 자막 자리를 비운다
    const l0 = c[0] * RAD, p0 = c[1] * RAD, cl = Math.cos(l0), sl = Math.sin(l0), cp = Math.cos(p0), sp = Math.sin(p0);
    // 단위 벡터 -> 화면 [x, y, 화면 쪽을 향한 정도]
    const P = (v, r = 1) => {
      const x1 = v[0] * cl - v[2] * sl, z1 = v[0] * sl + v[2] * cl;
      const y2 = v[1] * cp - z1 * sp, z2 = v[1] * sp + z1 * cp;
      return [O[0] + x1 * r * scale, O[1] - y2 * r * scale, z2];
    };
    const fade = 1 - smooth(LEN - 1.4, LEN - 0.1, t), mag = scale / base;
    cx.clearRect(0, 0, W, H);
    cx.globalAlpha = fade;
    cx.fillStyle = '#060c1c'; cx.fillRect(0, 0, W, H);
    if (useGalaxy && sky) {   // 은하수 배경: 천천히 흐르고, 확대가 시작되면 사라진다
      cx.globalAlpha = 0.7 * fade * (1 - smooth(0, 0.3, z));
      cx.drawImage(sky, -W * 0.15 - Math.max(0, t) * 3.5, -H * 0.15 + Math.max(0, t) * 1.2, W * 1.3, H * 1.3);
      cx.globalAlpha = fade;
    }
    // 분위기: 지구 뒤(원판 바깥)로만 비치는 대기 빛과 북쪽 높은 위도의 오로라 커튼(장식, 자료 아님). 확대가 시작되면 사라진다
    const deco = (1 - smooth(0.02, 0.25, z)) * smooth(0.2, 1.6, t);
    if (deco > 0) {
      cx.save(); cx.beginPath(); cx.rect(0, 0, W, H); cx.arc(O[0], O[1], scale * 1.0, 0, Math.PI * 2, true); cx.clip('evenodd');
      cx.globalCompositeOperation = 'lighter';
      const rim = cx.createRadialGradient(O[0], O[1], scale * 0.96, O[0], O[1], scale * 1.16);
      rim.addColorStop(0, 'rgba(80,140,255,0)'); rim.addColorStop(0.25, `rgba(80,140,255,${0.16 * deco})`); rim.addColorStop(1, 'rgba(80,140,255,0)');
      if (useAurora) { cx.beginPath(); cx.arc(O[0], O[1], scale * 1.16, 0, 7); cx.fillStyle = rim; cx.fill(); }
      const flick = (lon, k) => 0.5 + 0.5 * Math.sin(lon * 0.09 + t * 0.9 + k) * Math.sin(lon * 0.023 - t * 0.5 + k * 2.1);
      // 오로라: 지구 윗가장자리 뒤에서 피어오르는 빛 커튼(화면 기준). 원판 바깥만 그려져 지구를 가리지 않는다
      if (useAurora) for (let k = 0; k <= 1; k += 0.004) {
        const ang = Math.PI * (1.08 + 0.84 * k);                       // 왼쪽 위 ~ 오른쪽 위 가장자리
        const env = Math.sin(Math.PI * k) ** 1.5;                      // 가운데가 가장 높고 양 끝은 낮게
        const fl = flick(k * 400, 0), hgt = scale * (0.05 + 0.13 * fl * env);
        const a = 0.6 * (0.25 + 0.75 * fl ** 2) * env * deco;
        if (a < 0.03) continue;
        const ux = Math.cos(ang), uy = Math.sin(ang);
        const x0 = O[0] + ux * scale * 1.005, y0 = O[1] + uy * scale * 1.005, x1 = O[0] + ux * (scale + hgt), y1 = O[1] + uy * (scale + hgt);
        const gr = cx.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, `rgba(90,255,190,${0.04 * a})`); gr.addColorStop(0.4, `rgba(90,240,200,${0.26 * a})`); gr.addColorStop(0.75, `rgba(120,190,230,${0.1 * a})`); gr.addColorStop(1, 'rgba(160,110,255,0)');   // 지구에 닿는 쪽은 거의 비우고, 조금 떨어진 곳이 가장 밝다
        cx.strokeStyle = gr; cx.lineWidth = Math.max(2, scale * 0.016); cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke();
      }
      cx.globalCompositeOperation = 'source-over'; cx.restore();
    }
    // 지구 원판: 아주 옅은 남색과 가장자리 빛
    const g = cx.createRadialGradient(O[0], O[1], scale * 0.6, O[0], O[1], scale * 1.06);
    g.addColorStop(0, 'rgba(12,21,48,0.97)'); g.addColorStop(0.93, 'rgba(12,21,48,0.97)'); g.addColorStop(1, 'rgba(12,21,48,0)');   // 거의 불투명: 뒤의 은하수·오로라가 비치지 않게
    cx.globalAlpha = fade * (from ? smooth(0.3, 0.8, arr) : 1);   // 사진 화면에서는 아직 지구 원판이 하늘을 가리지 않는다
    cx.beginPath(); cx.arc(O[0], O[1], scale * 1.06, 0, 7); cx.fillStyle = g; cx.fill();
    cx.globalAlpha = fade;

    // 위성과 비추기
    const th = satTheta(t), sub = orbitAt(th);
    const beamOn = (from && TR === 'dots' ? t > -2.2 : t > 0.8) && t < LEN - 3.5;
    const light = arr => { if (beamOn) for (const d of arr) if (dot(d.v, sub) > Math.cos(BEAM)) d.lit = t; };
    light(land); light(korea); light(pdots);
    const glowOf = d => { const a = t - d.lit; return a < 0 || a > 2.6 ? 0 : Math.exp(-a * 1.4); };

    // 땅 점: 뒤쪽은 아주 옅게, 앞쪽은 또렷하게. 확대될수록 지구 전체 점은 사라지고 한반도 점이 남는다
    const dotR = Math.min(2.4, 1.05 * Math.pow(mag, 0.18));
    const globeA = (1 - smooth(0.25, 0.7, z)) * (from ? smooth(0.72, 0.95, arr) : 1);   // 지구 전체 점은 충분히 멀어진 뒤에(가까우면 격자처럼 보인다)
    for (const d of land) {
      const [x, y, f] = P(d.v);
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const face = smooth(-0.2, 0.35, f), lit = glowOf(d) * (f > 0 ? 1 : 0);
      let a = (0.07 + 0.62 * face) * globeA, col = '220,228,255', r = dotR;
      if (d.k) { col = '255,207,110'; a *= 1 - smooth(0.05, 0.4, z); r *= 1.25; }
      if (lit) { a = Math.max(a, (0.35 + 0.65 * lit) * globeA); col = d.k ? '255,226,160' : '235,242,255'; r *= 1 + 0.9 * lit; }
      if (a < 0.01) continue;
      cx.fillStyle = `rgba(${col},${a})`; cx.fillRect(x - r / 2, y - r / 2, r, r);
    }
    // 한반도 촘촘한 점(가까워질수록 드러남)
    const koA = Math.max(smooth(0.08, 0.45, z) * (1 - smooth(0.82, 1, z) * 0.7), from ? smooth(0.3, 0.5, arr) * (1 - smooth(0.6, 0.9, arr)) * 0.9 : 0);   // 너무 가까울 때는 격자처럼 보여 숨긴다
    if (koA > 0) {
      const kr = Math.max(0.8, Math.min(2.2, 0.6 * Math.pow(mag, 0.22)));
      for (const d of korea) {
        const [x, y, f] = P(d.v); if (f < 0 || x < -5 || x > W + 5 || y < -5 || y > H + 5) continue;
        cx.fillStyle = `rgba(220,228,255,${0.55 * koA})`; cx.fillRect(x - kr / 2, y - kr / 2, kr, kr);
      }
    }
    // 도착 단계: 레이더 사진을 지구 위 제자리(네 모서리 경위도)에 붙여 그린다
    const corner = i => P(vec(...from.corners[i]));
    const drawPhoto = alpha => {
      if (!photo || alpha <= 0.003) return;
      const [a0, a1, a3] = [corner(0), corner(1), corner(3)], r = DPR(), iw = photo.width, ih = photo.height;   // 그림판과 같은 배율(1.5배 상한)로 붙인다
      cx.save(); cx.globalAlpha = fade * alpha;
      cx.setTransform(r * (a1[0] - a0[0]) / iw, r * (a1[1] - a0[1]) / iw, r * (a3[0] - a0[0]) / ih, r * (a3[1] - a0[1]) / ih, r * a0[0], r * a0[1]);
      cx.drawImage(photo, 0, 0); cx.restore();
    };
    if (from && arr < 1 && TR === 'dots') {
      // A: 사진이 밝기대로 작은 점으로 풀린다. 멀어지면 점들이 한반도 점 속으로 섞여 사라진다. 위성이 지나가면 그 점들도 반짝인다
      drawPhoto(1 - smooth(0.3, 1.3, T));
      const dA = 1 - smooth(0.55, 0.88, arr);
      if (dA > 0.01) {
        const pw = Math.hypot(corner(1)[0] - corner(0)[0], corner(1)[1] - corner(0)[1]), cell = pw / 52;
        for (const d of pdots) {
          const show = smooth(0.15 + d.at * 0.9, 0.45 + d.at * 0.9, T);   // 가운데부터 바깥으로 차례로 풀린다
          if (show <= 0) continue;
          const [x, y] = P(d.v), lit = glowOf(d);
          const rad = Math.max(0.7, Math.min(2.2, cell * 0.16)) * (1 + 0.6 * lit);
          cx.fillStyle = `rgba(${lit ? '240,246,255' : '220,228,255'},${dA * show * Math.min(1, 0.35 + 0.6 * d.b + lit)})`;
          cx.beginPath(); cx.arc(x, y, rad, 0, 7); cx.fill();
        }
      }
    }
    if (from && arr < 1 && TR === 'scan') {
      // B: 가는 빛줄기 하나가 사진을 북쪽에서 남쪽으로 훑는다(위성이 찍는 순간). 훑고 나면 그 줄기가 북쪽 위의 위성까지 이어지고, 카메라가 그 줄기를 따라 멀어진다
      drawPhoto(1 - smooth(0.4, 0.8, arr));
      const sv = smooth(0.1, HOLD, T), on = smooth(0, 0.15, T) * (1 - smooth(HOLD, HOLD + 0.3, T));
      if (on > 0) {
        const C = from.corners, lerp = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
        const L = P(vec(...lerp(C[0], C[3], sv))), Rr = P(vec(...lerp(C[1], C[2], sv)));
        cx.save(); cx.globalCompositeOperation = 'lighter';
        cx.strokeStyle = `rgba(225,236,255,${0.85 * on})`; cx.lineWidth = 2; cx.shadowColor = 'rgba(200,220,255,.9)'; cx.shadowBlur = 14;
        cx.beginPath(); cx.moveTo(L[0], L[1]); cx.lineTo(Rr[0], Rr[1]); cx.stroke(); cx.restore();
      }
    }
    // 분계선: 첫 통과가 지나간 뒤 금빛으로 켜지고, 확대 끝에는 지도의 흰 선으로 바뀐다
    const dmzT = from ? smooth(-0.6, 0.6, t) : smooth(5.2, 6.4, t);   // 위성이 비추고 지나간 뒤에 켜진다
    if (dmzT > 0) {
      if (z < 0.35) {
        for (const v of dmzDots) { const [x, y, f] = P(v); if (f > 0) { cx.fillStyle = `rgba(255,207,110,${dmzT})`; cx.beginPath(); cx.arc(x, y, 1.6 * Math.pow(mag, 0.2), 0, 7); cx.fill(); } }
      } else {
        const wk = smooth(0.6, 1, z), col = [255, 207 + 48 * wk, 110 + 145 * wk].map(Math.round);
        cx.strokeStyle = `rgb(${col})`; cx.lineWidth = 1.5; cx.shadowColor = `rgba(${col},.8)`; cx.shadowBlur = 8;
        for (const line of dmzLines) {
          cx.beginPath(); line.forEach((p, n) => { const [x, y] = P(vec(p[0], p[1])); n ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke();
        }
        cx.shadowBlur = 0;
      }
    }
    // 궤도 고리: 가는 점선. 지구 뒤로 가려지는 부분은 그리지 않는다
    const ringA = 1 - smooth(0.05, 0.3, z);
    const hidden = (x, y, f) => f < 0 && Math.hypot(x - O[0], y - O[1]) < scale;
    if (ringA > 0) for (const a of ring) {
      const [x, y, f] = P(orbitAt(a), ORBIT_R); if (hidden(x, y, f)) continue;
      const back = ((th - a) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);   // 위성이 지나온 쪽 거리
      const trail = back < 1.2 ? 1 - back / 1.2 : 0;
      cx.fillStyle = `rgba(200,214,255,${(0.14 + (f > 0 ? 0.12 : 0) + 0.55 * trail) * ringA})`;
      cx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
    }
    // 위성과 전파: 위성에서 땅으로 내려가는 옅은 빛 기둥
    if (ringA > 0) {
      const [sx, sy, sf] = P(sub, ORBIT_R), [gx, gy, gf] = P(sub);
      if (!hidden(sx, sy, sf)) {
        if (from && TR === 'scan') {   // B: 사진 가운데에서 위성까지 이어지는 가는 빛줄기
          const lA = smooth(HOLD - 0.1, HOLD + 0.4, T) * (1 - smooth(-0.8, 0.2, t));
          if (lA > 0) {
            const q = P(vec(...from.center)), gr = cx.createLinearGradient(q[0], q[1], sx, sy);
            gr.addColorStop(0, `rgba(225,236,255,${0.7 * lA})`); gr.addColorStop(1, `rgba(225,236,255,${0.25 * lA})`);
            cx.save(); cx.strokeStyle = gr; cx.lineWidth = 1.5; cx.shadowColor = 'rgba(200,220,255,.8)'; cx.shadowBlur = 8;
            cx.beginPath(); cx.moveTo(q[0], q[1]); cx.lineTo(sx, sy); cx.stroke(); cx.restore();
          }
        }
        if (beamOn && gf > 0) {
          const nx = -(gy - sy), ny = gx - sx, L = Math.hypot(nx, ny) || 1, w = BEAM * scale * 0.9;
          const gr = cx.createLinearGradient(sx, sy, gx, gy);
          gr.addColorStop(0, `rgba(210,225,255,${0.35 * ringA})`); gr.addColorStop(1, 'rgba(210,225,255,0)');
          cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(gx + nx / L * w, gy + ny / L * w); cx.lineTo(gx - nx / L * w, gy - ny / L * w); cx.closePath();
          cx.fillStyle = gr; cx.fill();
        }
        cx.beginPath(); cx.arc(sx, sy, 2.6, 0, 7); cx.fillStyle = `rgba(255,255,255,${ringA})`; cx.shadowColor = '#fff'; cx.shadowBlur = 10; cx.fill(); cx.shadowBlur = 0;
      }
    }
    cx.globalAlpha = 1;
    lastCap = t < 0 ? 'film.i0' : t < 6.6 ? 'film.i1' : t < 10.8 ? 'film.i2' : 'film.i3';
    return true;
  }
  return { get LEN() { return LEN + (pending() ? ARR : 0); }, init, frame, canvas: cv, caption: () => lastCap };
}
