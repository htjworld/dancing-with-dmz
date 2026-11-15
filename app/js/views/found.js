// '여기서 알게 된 것' 카드: 한 줄 결론 → 숫자 막대 → 쉬운 한두 문장. 자세한 숫자와 단서는 카드 머리의 ? 단추에 둔다.
// 다섯 지역이 같은 모양을 쓴다. 문구와 숫자는 각 미션 화면이 넘긴다.
import { t } from '../i18n.js';

let whyOpen = false;   // '관련 영상 보기'를 펼쳐 두었는가(창이 다시 그려져도 유지)
if (typeof document !== 'undefined') document.addEventListener('toggle', e => { if (e.target.matches?.('.found details.why')) whyOpen = e.target.open; }, true);

// rows: [{ name, value, text?, cls? }]  value 는 막대 길이를 정하는 수, text 는 옆에 적는 글(없으면 'x.x dB')
export function foundCard({ head, rows = [], caption = '', body = [], extra = '', more = [] }) {
  const top = Math.max(...rows.map(r => r.value), .0001);
  const notes = more.filter(Boolean);
  // 자세한 숫자와 단서는 카드 머리의 ? 단추에 둔다
  const why = notes.length ? `<details class="why"${whyOpen ? ' open' : ''}><summary aria-label="${t('common.foundWhy')}" title="${t('common.foundWhy')}">?</summary>
      <div class="notes"><b>${t('common.foundWhy')}</b>${notes.map(x => `<p class="fine">${x}</p>`).join('')}</div></details>` : '';
  return `<div class="found">${why}
    <p class="lead">${head}</p>
    ${rows.length ? `<div class="versus">${rows.map(r => `<span>${r.name}</span><i><u class="${r.cls || ''}" style="width:${Math.max(3, r.value / top * 100).toFixed(0)}%"></u></i><b>${r.text ?? `${r.value.toFixed(1)} dB`}</b>`).join('')}</div>` : ''}
    ${caption ? `<p class="fine cap">${caption}</p>` : ''}
    ${body.filter(Boolean).map(x => `<p>${x}</p>`).join('')}
    ${extra}
    </div>`;
}
