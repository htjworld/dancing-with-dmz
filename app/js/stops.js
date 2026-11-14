import { state } from './state.js';

// 다섯 지역(서→동). 지역마다 레이더의 눈 하나와 손으로 하는 일 하나가 짝을 이룬다.
// bounds 는 tools/extract_nisar.py 의 REGIONS 와 같은 창이다(서, 남, 동, 북).
// 소개 카드에 넣을 짧은 영상(지역 id → 파일 경로). 비워 두면 영상 없이 글만 나온다.
// 예: paju: 'media/intro/paju.mp4'. 소리 없이 되풀이해 틀므로 5~8초짜리가 알맞다.
export const INTRO_CLIP = { yeoncheon: 'media/intro/yeoncheon.mp4' };
// 결과 카드의 '관련 영상 보기'에 넣을 영상(지역 id → 파일 경로). 비워 두면 '준비 중'이라고 나온다.
// 예: paju: 'media/result/paju.mp4'
export const RESULT_CLIP = {};

export const STOPS = [
  { id: 'paju', name: '파주 장단', eye: '시간의 눈',
    title: '가장 어두운 날, 가장 밝은 날',
    story: '물을 댄 논은 레이더에 어둡게 찍힙니다. 같은 논을 열한 번 찍은 사진이 섞여 있습니다.',
    todo: '가장 어두운 사진과 가장 밝은 사진을 차례로 골라 보세요.',
    en: { name: 'Paju Jangdan', eye: 'The eye of time',
      title: 'The darkest day, the brightest day',
      story: 'Flooded paddies look dark to radar. Here are eleven pictures of the same paddies, shuffled.',
      todo: 'Pick the darkest picture, then the brightest.' },
    bounds: [126.62, 37.86, 126.80, 38.00] },
  { id: 'yeoncheon', name: '연천 임진강', eye: '물의 눈',
    title: '강을 손으로 따라가 보세요',
    story: '잔잔한 물은 전파를 다른 쪽으로 튕겨 보내서, 레이더에는 검게 찍힙니다.',
    todo: '지도에서 검고 구불구불한 띠를 따라 쭉 그어 보세요.',
    en: { name: 'Yeoncheon Imjin River', eye: 'The eye for water',
      title: 'Follow the river with your finger',
      story: 'Calm water bounces the radar pulse away, so it comes out black.',
      todo: 'On the map, draw along the dark, winding band.' },
    bounds: [126.85, 37.98, 127.10, 38.18] },
  { id: 'cheorwon', name: '철원 평야', eye: '사람의 눈',
    title: '어느 땅이 더 많이 변했을까요?',
    story: '사람이 농사짓는 논이 있고, 3 km 옆에는 민간인이 들어갈 수 없는 땅이 있습니다. 어느 쪽이 어느 땅인지는 가려 두었습니다.',
    todo: '두 날짜의 사진을 견줘, 더 많이 변한 땅을 고르세요.',
    en: { name: 'Cheorwon Plain', eye: 'The eye for people',
      title: 'Which land changed more?',
      story: 'There are paddies that people farm, and 3 km away there is land civilians cannot enter. We have hidden which is which.',
      todo: 'Compare the pictures from two dates and pick the land that changed more.' },
    bounds: [127.15, 38.15, 127.55, 38.42] },
  { id: 'hwacheon', name: '화천 백암산', eye: '두 가지 눈',
    title: '숲과 평지는 어느 쪽에서 더 잘 갈릴까요?',
    story: 'NISAR는 전파를 주고받는 방향을 바꿔 두 가지로 찍습니다. HH와 HV라고 부릅니다.',
    todo: '지도 위의 커튼을 좌우로 밀어 HH와 HV를 견줘 보세요.',
    en: { name: 'Hwacheon Baegam-san', eye: 'Two eyes',
      title: 'Which one tells forest from flat land better?',
      story: 'NISAR records the same place two ways by changing the direction of the wave it sends and receives. They are called HH and HV.',
      todo: 'Slide the curtain on the map left and right to compare HH and HV.' },
    bounds: [127.65, 38.18, 127.90, 38.38] },
  { id: 'yanggu', name: '양구 펀치볼', eye: '종합',
    title: '가장 많이 변한 곳을 찾아보세요',
    story: '레이더 영상 열한 장을 겹치면, 한 계절 동안 많이 변한 곳과 거의 변하지 않은 곳이 갈립니다.',
    todo: '지도를 누른 채 끌어서, 막대가 가장 높이 차는 곳을 찾으세요.',
    en: { name: 'Yanggu Punchbowl', eye: 'All together',
      title: 'Find the place that changed the most',
      story: 'Stack eleven radar images and the places that changed a lot over the season stand apart from the ones that barely changed.',
      todo: 'Press and drag on the map to find where the bar fills the most.' },
    bounds: [128.05, 38.22, 128.22, 38.36] },
];
// 지금 언어에 맞는 지역 문구. 영어가 없으면 한국어가 나온다
export const label = (s, key) => (state.lang === 'en' ? s.en?.[key] ?? s[key] : s[key]);
export const centerOf = s => [(s.bounds[0] + s.bounds[2]) / 2, (s.bounds[1] + s.bounds[3]) / 2];
