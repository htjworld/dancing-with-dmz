# 공통 인터페이스 (htj ↔ jmj)

로직·데이터(htj)와 프론트(jmj)가 만나는 지점을 **지금 저장소에 실제로 있는 그대로** 적은 문서다. 계약의 기준은 이 문서 하나다(`plan.md` 2·3절은 여기를 가리킨다).

- 여기 적힌 파일 이름, 필드, 함수 이름과 인자는 바꾸지 않는다. 바꿔야 하면 **이 문서를 먼저 고쳐 푸시하고**, `plan.md` 5절 요청 칸에 한 줄 남긴 뒤 코드를 바꾼다.
- 여기 없는 데이터나 함수가 필요하면 직접 만들지 말고 요청 칸에 적는다(htj가 만든다).
- 숫자를 화면에 손으로 적지 않는다. 모든 숫자는 `facts.json`에서 온다.

마지막 확인: 2026-11-14, 커밋 `H5` 기준. `npm test` 37개 통과.

---

## 1. 불러오기

```js
import { load, data, fact } from './state.js';
await load();
data.glow      // glow.json (항상 있음)
data.facts     // facts.json (항상 있음)
data.opening   // opening.json, 없으면 null
data.zones, data.passes, data.boundary, data.layers   // 기존 그대로
fact('july_clear_optical')   // → 0 (값만, 키가 없으면 null)
```

## 2. 데이터 파일

좌표는 모두 경위도(EPSG:4326)다. `corners`는 영상 바깥 모서리 네 점이며 순서는 **[좌상, 우상, 우하, 좌하]**이다. 이 순서는 MapLibre image source의 `coordinates`와 같아서 그대로 넣으면 된다.

### 2-1. `data/glow.json` — 계절 변동 지도 (밤사진)

```json
{
  "metric": "숲 대비 HH 계절 변동 폭(표준편차, dB)",
  "scale_db": [0, 1.5],
  "source": "layers",
  "dates": ["2026-06-23", "2026-07-05", "...11개, 7/29 결측 제외"],
  "regions": {
    "paju | yeoncheon | cheorwon | hwacheon | yanggu": {
      "corners": [[lng, lat] x4],
      "size": [너비, 높이],
      "value": "glow/<지역>_value.webp",
      "color": "glow/<지역>_color.webp",
      "frames": ["glow/<지역>_f01.webp", "... f10"]
    }
  }
}
```

| 필드 | 쓰는 곳 | 설명 |
|---|---|---|
| `color` | 밤사진 표시 | 색을 입힌 최종 그림(남색 → 주황 → 노랑). 알파 0 = 자료 없음 |
| `frames[i]` | 재생 | 첫 통과부터 i+2번째 통과까지 누적. 10장. 마지막 장 = `color` |
| `value` | 땅 연주, 숫자 | 무손실 회색. 빨강 채널 0~255 → `scale_db` 범위의 dB. **숫자는 직접 박지 말고 `scale_db`를 읽는다** |
| `scale_db` | 계산 | 지금 `[0, 1.5]`. 바뀔 수 있다 |
| `source` | — | `"layers"`(앱 영상에서 만든 판) / `"cache"`(원자료 판). 화면에서 구분하지 않아도 된다 |

경로는 `data/` 기준이다. 쓸 때는 `` `data/${r.color}` ``처럼 붙인다.

### 2-2. `data/opening.json` — 구름 문지르기

```json
{
  "region": "cheorwon",
  "optical": { "date": "2026-07-26", "cloud_pct": 95.0, "window_cloud_pct": 65.9, "granule": "HLS.L30.T52SCH.2026207T021023.v2.0",
               "file": "opening/hls_cheorwon.jpg", "corners": [[127.143139, 38.419917], "..."] },
  "radar":   { "date": "2026-07-17", "file": "opening/nisar_cheorwon.webp", "corners": "optical과 같음" },
  "clouds":  { "cheorwon": { "2026-06": [2, 7], "2026-07": [0, 3], "2026-08": [0, 7], "2026-09": [0, 10], "2026-10": [7, 10], "2026-11": [1, 1] },
               "paju": {}, "yeoncheon": {}, "hwacheon": {}, "yanggu": {} }
}
```

- 두 영상은 **같은 격자, 같은 `corners`**다. 겹쳐 놓고 위의 광학 영상을 지우면 아래 레이더가 그 자리에 드러난다(맑은 10월 장면으로 위치가 맞는지 검증함).
- `cloud_pct`는 HLS 타일(약 110 km) 전체의 구름량, **`window_cloud_pct`는 철원 창 안에서 잰 구름 비율**이다. 화면에는 `window_cloud_pct`를 쓴다.
- `clouds[지역][월] = [창 안이 맑았던 관측, 전체 관측]`(Landsat L30, `tools/hls_window.py`). 맑음 = 창 안 구름 20% 이하.
- 광학(7/26)과 레이더(7/17) 날짜가 9일 다르다. 화면에는 "같은 7월"로 쓰고, 날짜를 보여 줄 때는 두 날짜를 다 쓴다.

### 2-3. `data/facts.json` — 화면과 발표의 숫자

각 키는 `{ value, unit, note, source }`이다. 화면에서는 `fact(키)`로 값만 꺼낸다.

| 키 | 지금 값 | 뜻 |
|---|---|---|
| `july_clear_optical` | 0 장 | 2026년 7월, 다섯 지역 **창 안이** 맑았던(구름 20% 이하) Landsat 관측 수 |
| `july_optical_looks` | 19 번 | 같은 기간 다섯 지역 창을 찍은 Landsat 관측 수. "19번 찍었는데 맑은 날 0번"으로 쓴다 |
| `july_regions` | 5 곳 | 위에서 센 지역 수 |
| `cheorwon_july_min_cloud` | 41 % | 7월 철원 창 안 구름이 가장 적었던 날의 값 |
| `cheorwon_paddy_db` | 2.1 dB | 철원 민통선 논, 숲 대비 계절 변동 폭 |
| `cheorwon_dmz_db` | 0.7 dB | 철원 DMZ 안 저지대 |
| `cheorwon_north_db` | 2.0 dB | 철원 분계선 북쪽 경작지로 보이는 곳 |
| `paju_dmz_farm_db` | 2.1 dB | 파주 DMZ 안 경작지 |
| `paju_dmz_wild_db` | 0.6 dB | 파주 DMZ 안 미경작지 |
| `paju_north_db` | 2.2 dB | 파주 분계선 서쪽 경작지로 보이는 곳 |
| `passes` / `passes_total` / `passes_provisional` | 11 / 12 / 10 회 | 자료가 있는 통과 / 전체 / PROVISIONAL |

새 숫자가 필요하면 요청 칸에 적는다(`tools/make_facts.py`에 추가).

## 3. 함수

계산 함수는 DOM 없이 돌아가고 테스트가 있다(`app/tests/glow.test.js`, `evidence.test.js`).

### `glow.js`

| 함수 | 반환 | 메모 |
|---|---|---|
| `pixelOf(corners, size, lng, lat)` | `[x, y]` 또는 `null` | 영상 밖이면 `null` |
| `regionAt(glow, lng, lat)` | `{ region, x, y }` 또는 `null` | 포인터가 어느 지역 영상 위에 있는지 |
| `sampleDb(imageData, x, y, scaleDb)` | dB 또는 `null` | `imageData` = `{ data, width, height }` (canvas `getImageData` 결과). 알파 0이나 범위 밖이면 `null` |
| `frameAt(progress, nFrames)` | 0 ~ nFrames-1 | 진행도 0~1 → 프레임 번호 |

### `landsound.js`

| 함수 | 반환 | 메모 |
|---|---|---|
| `noteFor(db, scaleDb)` | `{ midi, freq, gain }` 또는 `null` | 눈금의 25%(`REST_BELOW`) 아래는 쉼. 아리랑과 같은 솔 음계 |
| `touch(db, scaleDb)` | 울린 음 또는 `null` | **포인터가 움직일 때마다 불러도 된다.** 간격은 내부에서 조절하고, 곡을 멈추지 않는다. 소리 꺼짐이면 아무것도 안 한다 |

### `evidence.js`

```js
evidence(data.zones, 'cheorwon')
// → { dates: ['2026-06-23', ... 12개],
//     lines: [{ zoneId, name, role, place: 'south' | 'dmz' | 'north', values: [dB | null] x12 }],  // 남 → DMZ → 북 순서
//     ranges: { 'cheorwon-paddy': 2.1, 'cheorwon-dmz': 0.7, 'cheorwon-north': 2.0 },              // facts.json과 같다
//     excluded: [2, 5, 10],             // 모든 구역이 함께 변한 통과(cycle). 곡선에 옅게 표시할 때만 쓴다
//     caveats: ['signal_not_cause', 'forest_relative', 'provisional', 'zone_unverified', 'north_wording', 'missing_pass'] }
```

- `values`는 숲 대비 HH이고 첫 통과가 0이다. 7/29(인덱스 3)는 `null`이니 선을 끊는다.
- `name`은 한국어 구역 이름이다. 영어 화면에서는 `place`로 문구를 고른다(South of the line / Inside the DMZ / North of the line).

### `sound.js`, `music.js`, `rhythm.js` (기존 + 추가)

| 함수 | 메모 |
|---|---|
| `play(plan)` → 시작 시각(ms, `performance.now` 기준) | 곡 전체 재생. **부르면 울리던 소리를 먼저 멈춘다** |
| `stop()` | 모두 멈춤 |
| `blip(freq, gain, dur)` | 곡을 멈추지 않는 짧은 음(추가). 보통은 `touch`를 쓴다 |
| `setSound(on)`, `soundOn` | 소리 켜기/끄기 |
| `score()` | 아리랑 16마디, `duration` 22.5초 |
| `layerGains`, `applyRhythm`, `cycleAt` | 실측을 반주 세기에 묶는 기존 함수. 쓰는 법은 `main.js`의 `perform` |

## 4. 쓰는 법 (예시, 그대로 가져가도 된다)

### 4-1. 밤사진 올리기

```js
for (const [id, r] of Object.entries(data.glow.regions)) {
  map.addSource(`glow-${id}`, { type: 'image', url: `data/${r.color}`, coordinates: r.corners });
  map.addLayer({ id: `glow-${id}`, type: 'raster', source: `glow-${id}`, paint: { 'raster-opacity': 1, 'raster-fade-duration': 0 } });
}
// 분계선은 기존 'dmz' 소스(data.boundary)를 그 위에 흰 선으로
```

### 4-2. 프레임 재생 (곡과 맞추기)

```js
// 미리 받아 두면 깜빡이지 않는다
for (const r of Object.values(data.glow.regions)) for (const f of r.frames) new Image().src = `data/${f}`;

// state.playing = { at(ms), duration(s) } 는 main.js 의 perform() 이 이미 채운다
const shown = {};
function drawFrame(now) {
  const p = state.playing; if (!p) return;
  const progress = Math.min(1, (now - p.at) / 1000 / p.duration);
  for (const [id, r] of Object.entries(data.glow.regions)) {
    const url = `data/${r.frames[frameAt(progress, r.frames.length)]}`;
    if (shown[id] !== url) { map.getSource(`glow-${id}`).updateImage({ url, coordinates: r.corners }); shown[id] = url; }
  }
}
```

### 4-3. 땅 연주

```js
// value 영상을 화소값 그대로 읽는다(색 보정·알파 곱하기 끄기)
const pixels = {};
for (const [id, r] of Object.entries(data.glow.regions)) {
  const blob = await (await fetch(`data/${r.value}`)).blob();
  const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d');
  g.drawImage(bmp, 0, 0);
  pixels[id] = g.getImageData(0, 0, bmp.width, bmp.height);
}
const onMove = e => {                       // map.on('mousemove', onMove); map.on('touchmove', onMove);
  const hit = regionAt(data.glow, e.lngLat.lng, e.lngLat.lat);
  if (!hit) return;
  touch(sampleDb(pixels[hit.region], hit.x, hit.y, data.glow.scale_db), data.glow.scale_db);
};
```

브라우저는 사용자가 한 번 누르기 전에는 소리를 막는다. 오프닝의 첫 터치나 "시작" 버튼 뒤에 연주를 켠다.

### 4-4. 근거 패널

```js
const e = evidence(data.zones, 'cheorwon');
// 곡선: e.lines 마다 e.dates × values (null 은 끊기). 숫자: e.ranges[zoneId]. 한계 문구: e.caveats.map(k => t(`caveat.${k}`))
```

## 5. 한계 문구 키

로직은 키만 준다. 문구(한·영)는 프론트의 `i18n.js`가 갖는다.

| 키 | 한국어 뜻 (영어는 jmj가 쓴다) |
|---|---|
| `signal_not_cause` | 빛남은 레이더 신호 변화의 크기이지 생태·작황 판정이 아니다 |
| `forest_relative` | 같은 날 숲 구역 값을 빼서, 장면 전체가 함께 변한 몫을 덜어 냈다 |
| `provisional` | 11번 중 10번은 PROVISIONAL 자료라 기준이 조금 다를 수 있다 |
| `zone_unverified` | 구역은 영상에서 고른 사각형이고 토지피복 검증이 없다 |
| `north_wording` | 북쪽 땅은 "경작지로 보이는 곳"으로만 부른다 |
| `missing_pass` | 7/29 통과는 자료가 없다 |
| `cloud_tile` | `cloud_pct`는 HLS 타일(약 110 km) 단위 값이다 |
| `cloud_window` | 창 안 구름은 Landsat 미리보기 영상의 흰 화소를 센 값이다. 옅은 구름은 못 세서 실제보다 적게 나온다 |

## 6. 다시 만들기 (htj)

```bash
python3 tools/hls_cloud.py                                      # 표준 라이브러리만
python tools/hls_window.py && python3 tools/make_facts.py       # 창 안 구름 -> facts
python tools/make_glow.py && python tools/make_opening.py       # numpy, scipy, Pillow, pyproj (requirements.txt)
npm test
```

생성물(`app/data/**`)이 충돌하면 손으로 합치지 않고 위 명령으로 다시 만든다.
