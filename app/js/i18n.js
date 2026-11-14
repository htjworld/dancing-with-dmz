// 화면 문구. 화면 모듈은 문구를 직접 적지 않고 t('키')로 가져온다. 영어가 아직 없는 키는 한국어가 나온다.
// 숫자는 여기 적지 않는다. {n} 같은 자리에 facts.json 의 값을 넣는다.
import { state } from './state.js';

const TEXT = {
  ko: {
    'night.lead': '빛이 아니라 땅의 변화로 찍은, DMZ의 한 계절',
    'mission.lead': '레이더가 본 다섯 땅의 리듬을 모아, 끊어진 선을 춤추게 하세요.',
    'mission.back': '← 밤사진으로',
    'night.eye': 'NISAR 레이더 · 2026년 6월~11월 · {passes}번의 통과',
    'night.title': '들판은 빛나고,<br>선은 고요하다',
    'night.body': '밝을수록 한 계절 동안 레이더 신호가 많이 변한 땅입니다. 농사짓는 들판은 분계선(흰 선) 양쪽에서 빛나고, 그 사이의 띠는 어둡게 남습니다.',
    'night.fact': '2026년 7월, 다섯 지역에서 구름 없이 찍힌 광학 위성 관측은 <b>{n}{unit}</b>. 이 땅의 여름을 본 것은 레이더뿐입니다.',
    'night.paddy': '철원 민통선 논',
    'night.dmz': '철원 DMZ 안 저지대',
    'night.pairNote': '숲 대비 HH 신호의 계절 변동 폭',
    'night.scaleLow': '고요함 {lo} dB',
    'night.scaleHigh': '많이 변함 {hi} dB 이상',
    'night.all': '전체',
    'night.next': '다섯 지역에서 직접 확인하기 →',
    'region.paju': '파주', 'region.yeoncheon': '연천', 'region.cheorwon': '철원', 'region.hwacheon': '화천', 'region.yanggu': '양구',
    // plan.md 2-4절의 한계 문구 키
    'caveat.signal_not_cause': '빛남은 레이더 신호가 변한 크기입니다. 생태나 작황을 판정한 것이 아닙니다.',
    'caveat.provisional': '{passes}번의 통과 중 {prov}번은 임시 공개(PROVISIONAL) 자료라 기준이 조금 다를 수 있습니다.',
    'caveat.zone_unverified': '구역은 영상에서 고른 사각형이고 토지피복을 검증하지 않았습니다.',
    'caveat.forest_relative': '숲 구역을 기준으로, 장면 전체가 함께 변한 몫을 뺐습니다.',
    'caveat.cloud_tile': '구름량은 HLS 타일(약 110 km) 단위 값입니다.',
    'caveat.north_wording': '분계선 북쪽 땅은 "경작지로 보이는 곳"으로만 부릅니다.',
    'caveat.missing_pass': '7월 29일 통과는 자료가 없습니다.',
  },
  en: {
    'night.lead': 'A season of the DMZ, photographed by change instead of light',
    'mission.back': '← Night photo',
    'night.eye': 'NISAR radar · June–November 2026 · {passes} passes',
    'night.title': 'The fields glow.<br>The line stays still.',
    'night.body': 'Brighter means the radar signal changed more over the season. Farmed fields glow on both sides of the demarcation line (white), while the strip between them stays dark.',
    'night.fact': 'In July 2026, cloud-free optical satellite views of the five areas: <b>{n}</b>. Only radar saw this summer.',
    'night.paddy': 'Cheorwon paddies (south)',
    'night.dmz': 'Cheorwon lowland inside the DMZ',
    'night.pairNote': 'Seasonal range of HH signal relative to forest',
    'night.scaleLow': 'still {lo} dB',
    'night.scaleHigh': 'changed {hi} dB or more',
    'night.all': 'All',
    'night.next': 'Check it yourself in five places →',
    'region.paju': 'Paju', 'region.yeoncheon': 'Yeoncheon', 'region.cheorwon': 'Cheorwon', 'region.hwacheon': 'Hwacheon', 'region.yanggu': 'Yanggu',
    'caveat.signal_not_cause': 'Glow is how much the radar signal changed. It is not a verdict on ecology or harvest.',
    'caveat.forest_relative': 'Change shared by the whole scene was removed using forest zones as the reference.',
  },
};

export function t(key, vars = {}) {
  const text = TEXT[state.lang]?.[key] ?? TEXT.ko[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
