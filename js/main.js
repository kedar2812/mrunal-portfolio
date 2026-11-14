// Entry: smooth scroll + one shared RAF loop driving every effect.
import Lenis from 'lenis';
import { reduceMotion } from './util.js';
import { initHero } from './hero.js';
import { initStamps } from './stamps.js';
import { initLetterReveal, initLinePop, initWaveText, initBrandTicker, initProjects, initSwing, initArchive, initFadeUp, initParallax, initCursor, initMenu, initForm } from './effects.js';
import { shapeSVG, starPoints } from './util.js';

const tasks = [];
const register = fn => tasks.push(fn);

// About section starburst mask + avatar scallop badge (generated from the shape library)
(() => {
  // 12-point rounded badge (same geometry family as the reference mask)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='${starPoints(12, 37, 30.5)}' stroke='#000' stroke-width='2.4' stroke-linejoin='round'/></svg>`;
  document.documentElement.style.setProperty('--burst', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  const sc = shapeSVG('scallop'); document.querySelectorAll('.shape-scallop').forEach(p => p.setAttribute('d', sc.attr.d));
})();

let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  document.documentElement.classList.add('lenis');
  window.__lenis = lenis;
}

const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[init]', name, e); } };
safe('cursor', initCursor);
safe('menu', () => initMenu(lenis));
safe('hero', initHero);
safe('stamps', initStamps);
safe('letters', initLetterReveal);
safe('linepop', initLinePop);
safe('wave', () => initWaveText(register));
safe('brands', () => initBrandTicker(register));
safe('projects', () => initProjects(register));
safe('swing', initSwing);
safe('archive', () => initArchive(register));
safe('fadeup', initFadeUp);
safe('parallax', () => initParallax(register));
safe('form', initForm);
import('./about.js').then(m => safe('about', () => m.initAbout(register))).catch(e => console.error(e));
import('./foodie.js').then(m => safe('foodie', () => m.initFoodie(register))).catch(e => console.error(e));

// heavier modules load lazily so the hero paints first
import('./star3d.js').then(m => safe('star3d', () => m.initStar3D(register))).catch(e => console.error(e));
import('./physics.js').then(m => { safe('tags', () => m.initServiceTags(register)); safe('footer', () => m.initFooterPhysics(register)); }).catch(e => console.error(e));

function loop(t) {
  if (lenis) lenis.raf(t);
  for (const fn of tasks) fn(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
