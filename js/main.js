/**
 * main.js
 * Entry point. Initialises the app, loads field data,
 * sequences narrative beats, orchestrates chapters.
 *
 * Chapters don't know about each other — they receive
 * a shared state object and emit events through it.
 */

import { loadFields, generateRandom } from './fields.js';
import { setupCanvas, canvasSize }    from './canvas.js';
import { renderField }                from './render.js';
import { init as initCh0 }           from './chapters/ch0-field.js';

// ── SHARED STATE ──────────────────────────────────────────────────────
// All chapters read/write this. main.js listens for events.
const state = {
  currentField: null,
  randomField:  null,
  machine:      null,   // ch1
  attachment:   null,   // ch2

  // Simple event emitter
  _handlers: {},
  on(event, fn)        { (this._handlers[event] = this._handlers[event] || []).push(fn); },
  emit(event, payload) { (this._handlers[event] || []).forEach(fn => fn(payload)); },
};

// ── NARRATIVE SEQUENCER ───────────────────────────────────────────────
function reveal(id, delay) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.classList.add('visible');
  }, delay);
}

// ── INIT ──────────────────────────────────────────────────────────────
async function init() {
  // 1. Load named field definitions
  await loadFields();

  // 2. Generate initial random field
  state.randomField  = generateRandom();
  state.currentField = state.randomField;

  // 3. Set up canvas and render initial field
  setupCanvas();
  renderField(state.currentField);

  // 4. Fade out loading veil
  setTimeout(() => {
    document.getElementById('veil').classList.add('gone');

    // Stagger narrative beats
    reveal('nb1', 200);
    reveal('nb2', 1000);
    reveal('nb3', 2000);
  }, 600);

  // 5. Initialise chapter 0 (field selection)
  initCh0(state);

  // 6. Listen for chapter transitions
  state.on('fieldSelected', def => {
    console.log('[main] field selected:', def.name);
    updateDebugPane(def);
    // Future: unlock chapter 1 (machine selection)
  });

  // 7. Setup debug pane
  setupDebugPane();
}

// ── DEBUG PANE ─────────────────────────────────────────────────────────
function setupDebugPane() {
  const toggleBtn = document.getElementById('debug-toggle');
  const debugPane = document.getElementById('debug-pane');

  toggleBtn.addEventListener('click', () => {
    toggleBtn.classList.toggle('active');
    debugPane.classList.toggle('visible');
  });

  // Initial population with current field
  if (state.currentField) {
    updateDebugPane(state.currentField);
  }
}

function updateDebugPane(fieldDef) {
  const content = document.getElementById('debug-content');
  if (content && fieldDef) {
    content.textContent = JSON.stringify(fieldDef, null, 2);
  }
}

// ── RESIZE ────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  setupCanvas();
  if (state.currentField) renderField(state.currentField);
});

window.addEventListener('load', init);
