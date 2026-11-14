// About — the 12-point star "blooms" open with scroll and reveals the intro,
// which then lights up word-by-word. Corner stickers (reference stamp library) sit
// in the pink between the star's spikes.
import { clamp, lerp, shapeSVG, el, onVisible, reduceMotion } from './util.js';

const STICKERS = [
  { shape: 'star', x: 9, y: 16, size: 230, rot: -12, fill: '#a8bfff', stroke: '#f2edc7', sw: 6, text: 'bold type', color: '#f2edc7', motion: 'm-wobble', d: 9 },
  { shape: 'spark', x: 91, y: 18, size: 220, rot: 14, fill: '#fff2a8', text: 'good food', color: '#bd4f9e', motion: 'm-float', d: 7 },
  { shape: 'flower', x: 10, y: 84, size: 200, rot: 8, fill: '#bd4f9e', stroke: '#f2edc7', sw: 5, text: 'a little chaos', color: '#f2edc7', motion: 'm-spin', d: 22 },
  { shape: 'burst', x: 90, y: 82, size: 230, rot: -6, fill: '#f2edc7', text: 'brief → post', color: '#bd4f9e', motion: 'm-wobble', d: 8 },
];

const smooth = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);

export function initAbout(register) {
  const pin = document.getElementById('aboutPin'), bloom = document.getElementById('aboutBloom');
  const para = document.getElementById('aboutPara'), stickerHost = document.getElementById('aboutStickers');
  if (!pin || !bloom) return;
  const card = bloom.parentElement, content = bloom.firstElementChild;

  // words
  const HL = new Set(['bold', 'type,', 'good', 'food,', 'chaos,', 'brief', 'post.']);
  para.innerHTML = para.textContent.trim().split(/\s+/).map(w => `<span class="w${HL.has(w.toLowerCase()) ? ' hl' : ''}">${w}</span>`).join(' ');
  const words = [...para.querySelectorAll('.w')];

  // stickers
  const stickers = STICKERS.map(c => {
    const s = shapeSVG(c.shape);
    const node = el('div', { class: 'about__sticker', style: { left: c.x + '%', top: c.y + '%' } });
    const inner = el('div', { class: reduceMotion ? '' : c.motion, style: { position: 'absolute', inset: 0, animationDuration: c.d + 's' } });
    const svg = el('svg', { viewBox: '0 0 100 100' }, true);
    svg.appendChild(el(s.tag, { ...s.attr, fill: c.fill, stroke: c.stroke || 'none', 'stroke-width': c.sw || 0, 'stroke-linejoin': s.sharp ? 'miter' : 'round', 'vector-effect': 'non-scaling-stroke' }, true));
    inner.appendChild(svg); inner.appendChild(el('span', { text: c.text, style: { color: c.color } }));
    node.appendChild(inner); stickerHost.appendChild(node);
    return { node, c };
  });

  // 12-point star outline with slightly rounded tips/valleys (same family as the reference mask)
  const N = 12, SAMPLES = 288;
  const starPoly = (cx, cy, outer, inner, rot) => {
    const pts = [];
    for (let i = 0; i < SAMPLES; i++) {
      const a = i / SAMPLES * Math.PI * 2;
      const f = (a * N / (Math.PI * 2)) % 1, tri = 1 - Math.abs(f * 2 - 1);
      const shape = .55 * tri + .45 * smooth(tri);
      const r = inner + (outer - inner) * shape, aa = a + rot - Math.PI / 2;
      pts.push(`${(cx + Math.cos(aa) * r).toFixed(1)}px ${(cy + Math.sin(aa) * r).toFixed(1)}px`);
    }
    return `polygon(${pts.join(',')})`;
  };

  let W = 0, H = 0;
  const size = () => {
    W = card.clientWidth; H = card.clientHeight;
    const sc = clamp(Math.min(W / 1400, H / 820), .42, 1.1);
    const narrow = W < 600;
    stickers.forEach(({ node, c }) => { node.style.setProperty('--sz', (c.size * sc).toFixed(0) + 'px'); node.style.left = (narrow ? 50 + (c.x - 50) * .78 : c.x) + '%'; node.style.top = (narrow ? 50 + (c.y - 50) * .9 : c.y) + '%'; });
  };
  size(); addEventListener('resize', size);

  // name block reveals
  // (observe the unclipped parent — a fully clip-path'd element never reports as intersecting)
  const nameBlock = document.querySelector('.about__name');
  if (nameBlock) onVisible(nameBlock, v => { if (v) nameBlock.querySelectorAll('.script, .avatar').forEach(n => n.classList.add('is-in')); }, { threshold: .3 });

  let last = -1;
  register(() => {
    const r = pin.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = reduceMotion ? .7 : clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    // stickers pop in as the section arrives (before pin)
    const arrive = clamp((vh - r.top) / (vh * .8), 0, 1);
    if (Math.abs(p - last) < .0005 && arrive >= 1 && last !== -1) return; last = p;

    // phase 1 — bloom (0 → .38): bud → open star, spinning from −150° to 0
    const b = easeOut(clamp(p / .38, 0, 1));
    // phase 3 — fully open (.84 → 1): star swallows the card so the section hands off to plum
    const c = smooth(clamp((p - .84) / .16, 0, 1));
    const outerBase = W >= H ? Math.max(W * .5, H * .7) : Math.max(W * .62, H * .36);
    const outer = lerp(outerBase * .045, outerBase, b) * (1 + c * 1.4);
    const inner = outer * .8;
    const rot = lerp(-150, 0, b) * Math.PI / 180;
    bloom.style.clipPath = starPoly(W / 2, H / 2, outer, inner, rot);

    // content grows in with the bloom
    const cIn = clamp((b - .45) / .55, 0, 1);
    content.style.opacity = cIn.toFixed(3);
    content.style.transform = `scale(${(.86 + .14 * easeOut(cIn)).toFixed(4)}) rotate(${((1 - cIn) * -4).toFixed(2)}deg)`;

    // phase 2 — words light up (.36 → .82)
    const wp = clamp((p - .36) / .46, 0, 1) * (words.length + 2);
    words.forEach((w, i) => { const o = .16 + .84 * clamp(wp - i, 0, 1); w.style.opacity = o.toFixed(2); });

    // stickers: pop on arrival, drift outward as the star opens, shrink away when it swallows the card
    stickers.forEach(({ node, c: cfg }, i) => {
      const a = easeOut(clamp(arrive * 1.25 - i * .08, 0, 1));
      const pop = a < 1 ? (1 + Math.sin(a * Math.PI) * .18) * a : 1;
      const dx = (cfg.x - 50) * .5 * b, dy = (cfg.y - 50) * .4 * b;
      const s = pop * (1 - c * .6);
      node.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) scale(${s.toFixed(3)}) rotate(${(cfg.rot - 20 * (1 - a)).toFixed(1)}deg)`;
    });
  });
}
