// Shared loader for the node tests: card data, decks, the engine, every js/cards/*.js script file, and the AI.
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
module.exports = function load(opts = {}) {
  const ctx = { window: {}, console, Math }; vm.createContext(ctx);
  const files = ['data/cards.js', 'data/decks.js', 'js/engine.js'];
  const cardDir = path.join(root, 'js/cards');
  const only = opts.only; // load only these card files (names), default all
  for (const f of fs.readdirSync(cardDir).filter(f => f.endsWith('.js')).sort()) if (!only || only.includes(f)) files.push('js/cards/' + f);
  if (opts.ai) files.push('js/ai.js');
  for (const f of files) {
    try { vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }); }
    catch (e) { if (f.startsWith('js/cards/')) console.error(`(skipped ${f}: ${e.message})`); else throw e; }
  }
  const E = ctx.window.EdisonEngine; E.init(ctx.window.EDISON_CARDS);
  return { ctx, E, AI: ctx.window.EdisonAI, C: ctx.window.EDISON_CARDS, DECKS: ctx.window.EDISON_DECKS };
};
