// 여러 모드가 함께 쓰는 조각: 블랙홀 선택 메뉴
import { GROUP_LABEL, GROUP_ORDER } from '../data/catalog.js';
import { esc, el } from './format.js';

// 블랙홀 선택 <select>. onChange(bhDesc)
export function bhSelect(ctx, currentId, onChange, { includeCustom = true } = {}) {
  const list = ctx.catalog.filter((b) => !b.infoOnly);
  const groups = {};
  for (const b of list) (groups[b.group] ??= []).push(b);
  let html = '<select class="select-lg">';
  for (const g of GROUP_ORDER) {
    if (!groups[g]) continue;
    html += `<optgroup label="${GROUP_LABEL[g]}">` + groups[g].map((b) => `<option value="${b.id}"${b.id === currentId ? ' selected' : ''}>${esc(b.short)}</option>`).join('') + '</optgroup>';
  }
  if (includeCustom && ctx.custom) html += `<optgroup label="내가 만든 것"><option value="custom"${currentId === 'custom' ? ' selected' : ''}>직접 만든 블랙홀</option></optgroup>`;
  html += '</select>';
  const sel = el(html);
  sel.addEventListener('change', () => onChange(sel.value === 'custom' ? ctx.custom : list.find((b) => b.id === sel.value)));
  return sel;
}
