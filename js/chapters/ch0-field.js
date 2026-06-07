/**
 * chapters/ch0-field.js
 * Chapter 0: Field selection.
 * Builds the thumbnail selector in the narrative panel.
 * Emits 'fieldSelected' on state when user picks a field.
 */

import { NAMED_FIELDS, generateRandom, buildPoly } from '../fields.js';
import { dissolve, setupCanvas } from '../canvas.js';
import { renderField } from '../render.js';
import { lerp } from '../utils.js';

let _state      = null;
let _activeKey  = 'random';

// ── THUMBNAIL SVG ─────────────────────────────────────────────────────
function thumbSVG(def) {
  const W = 90, H = 58;
  const poly  = buildPoly(def, W, H);
  const pts   = poly.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const nOrig = def.verts.length;
  const roadA = poly[def.roadEdge % nOrig];
  const roadB = poly[(def.roadEdge + 1) % nOrig];
  const rivA  = poly[def.riverEdge % nOrig];
  const rivB  = poly[(def.riverEdge + 1) % nOrig];
  const gx    = lerp(roadA.x, roadB.x, def.gateT).toFixed(1);
  const gy    = lerp(roadA.y, roadB.y, def.gateT).toFixed(1);

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <polygon points="${pts}"
      fill="rgba(150,130,90,.09)"
      stroke="#3a3020" stroke-width="1.2" stroke-linejoin="round"/>
    <line x1="${rivA.x.toFixed(1)}"  y1="${rivA.y.toFixed(1)}"
          x2="${rivB.x.toFixed(1)}"  y2="${rivB.y.toFixed(1)}"
          stroke="#7a9aaa" stroke-width="2" opacity=".7"/>
    <line x1="${roadA.x.toFixed(1)}" y1="${roadA.y.toFixed(1)}"
          x2="${roadB.x.toFixed(1)}" y2="${roadB.y.toFixed(1)}"
          stroke="#8a7a60" stroke-width="2" opacity=".6"/>
    <circle cx="${gx}" cy="${gy}" r="2.5" fill="#6a5838"/>
  </svg>`;
}

// ── BUILD SELECTOR ────────────────────────────────────────────────────
export function buildSelector() {
  const sel  = document.getElementById('field-selector');
  if (!sel) return;
  sel.innerHTML = '';

  const keys = ['random', 'rectangle', 'triangle', 'hansen'];
  const defs = {
    random:    _state.randomField,
    rectangle: NAMED_FIELDS.rectangle,
    triangle:  NAMED_FIELDS.triangle,
    hansen:    NAMED_FIELDS.hansen,
  };

  keys.forEach(key => {
    const def = defs[key];
    if (!def) return;

    const div = document.createElement('div');
    div.className = 'field-thumb' + (key === _activeKey ? ' active' : '');
    div.innerHTML = `
      ${key === 'random' ? '<span class="refresh-btn" title="New random field">↺</span>' : ''}
      ${thumbSVG(def)}
      <div class="thumb-label">${def.name}</div>
      <div class="thumb-desc">${def.desc}</div>
    `;

    div.addEventListener('click', e => {
      if (e.target.classList.contains('refresh-btn')) {
        _state.randomField = generateRandom();
        buildSelector();
        if (_activeKey === 'random') switchField('random');
        return;
      }
      switchField(key);
    });

    sel.appendChild(div);
  });
}

// ── SWITCH FIELD ──────────────────────────────────────────────────────
function switchField(key) {
  _activeKey = key;

  document.querySelectorAll('.field-thumb').forEach((el, i) => {
    const keys = ['random', 'rectangle', 'triangle', 'hansen'];
    el.classList.toggle('active', keys[i] === key);
  });

  const def = key === 'random'
    ? _state.randomField
    : NAMED_FIELDS[key];

  dissolve(() => {
    _state.currentField = def;
    setupCanvas();
    renderField(def);
  });

  // Emit to main
  _state.currentField = def;
  _state.emit('fieldSelected', def);
}

// ── INIT ──────────────────────────────────────────────────────────────
export function init(state) {
  _state = state;

  // Generate initial random field if not already done
  if (!_state.randomField) {
    _state.randomField  = generateRandom();
    _state.currentField = _state.randomField;
  }

  buildSelector();
}
