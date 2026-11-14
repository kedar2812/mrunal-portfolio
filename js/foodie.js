// Revolving 3D text rings around the sushi photo.
// Each ring is rendered twice: a back copy (behind the photo, shows the far half)
// and a front copy (above the photo, shows the near half) — letters use backface-visibility
// so each copy only shows its own half. Rotation = idle spin + scroll velocity boost.
import { reduceMotion, onVisible, starPoints } from './util.js';

const RINGS = {
  a: { text: 'SUSHI LOVER ✦ FOOD CONTENT THAT FILLS TABLES ✦ ', size: 66, rx: -16, rz: -9, speed: -14, rFactor: .56 },
  b: { text: 'RESTAURANTS ✦ CAFÉS ✦ BARS ✦ HOTELS ✦ MENUS THAT GO VIRAL ✦ ', size: 30, rx: 24, rz: 13, speed: 20, rFactor: .44 },
};

export function initFoodie(register) {
  const stage = document.getElementById('foodieStage'); if (!stage) return;
  const badge = stage.querySelector('.foodie__badge path');
  if (badge) badge.setAttribute('d', 'M' + starPoints(16, 48, 38).split(' ').join(' L') + ' Z');
  onVisible(stage.querySelector('.foodie__badge'), v => { if (v) stage.querySelector('.foodie__badge').classList.add('is-in'); });

  const ctx = document.createElement('canvas').getContext('2d');
  const rings = [];
  const build = () => {
    rings.length = 0;
    const W = stage.clientWidth, small = W < 700;
    stage.querySelectorAll('.ring').forEach(host => {
      const cfg = RINGS[host.dataset.ring], back = host.classList.contains('ring--back');
      const size = cfg.size * (small ? .55 : Math.min(1, W / 900));
      const R = W * cfg.rFactor * (small ? 1.02 : 1);
      ctx.font = `400 ${size}px Anton, Impact, sans-serif`;
      // fill the circumference with repeats of the phrase, measured glyph-by-glyph
      const circ = 2 * Math.PI * R, track = size * .06;
      let chars = [], used = 0, k = 0;
      while (used < circ - size * .4) { const c = cfg.text[k % cfg.text.length]; const w = ctx.measureText(c).width + track; if (used + w > circ) break; chars.push([c, w]); used += w; k++; }
      const stretch = circ / used; // spread evenly so the loop closes seamlessly
      host.innerHTML = '';
      const tilt = document.createElement('div'); tilt.className = 'ring__tilt';
      tilt.style.transform = `rotateX(${cfg.rx}deg) rotateZ(${cfg.rz}deg)`;
      const spin = document.createElement('div'); spin.className = 'ring__spin';
      let acc = 0; const frag = document.createDocumentFragment();
      for (const [c, w] of chars) {
        const ww = w * stretch, mid = acc + ww / 2; acc += ww;
        let deg = mid / circ * 360;
        const s = document.createElement('span'); s.className = 'ring__ch'; s.textContent = c;
        s.style.fontSize = size + 'px';
        // back copy: mirror angle + flip so the far half reads left→right as well
        if (back) deg = -deg;
        s.style.transform = `translate(-50%,-50%) rotateY(${deg}deg) translateZ(${R}px)${back ? ' rotateY(180deg)' : ''}`;
        frag.appendChild(s);
      }
      spin.appendChild(frag); tilt.appendChild(spin); host.appendChild(tilt);
      rings.push({ spin, cfg, back });
    });
  };
  document.fonts.ready.then(build); build();
  let rw = stage.clientWidth; addEventListener('resize', () => { if (Math.abs(stage.clientWidth - rw) > 30) { rw = stage.clientWidth; build(); } });

  let visible = false; onVisible(stage, v => visible = v, { rootMargin: '200px' });
  let last = performance.now(), lastY = scrollY, boost = 0, angle = { a: 0, b: 0 };
  register(() => {
    const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
    const dy = scrollY - lastY; lastY = scrollY;
    if (!visible) return;
    boost += dy * .12; boost *= .9;
    if (!reduceMotion) { angle.a += (RINGS.a.speed * dt) - boost * .35; angle.b += (RINGS.b.speed * dt) + boost * .25; }
    for (const r of rings) {
      const key = r.cfg === RINGS.a ? 'a' : 'b';
      // back copy uses mirrored angles, so it spins the opposite way to stay in sync visually
      r.spin.style.transform = `rotateY(${(r.back ? -angle[key] : angle[key]).toFixed(2)}deg)`;
    }
  });
}
