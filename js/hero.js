// Hero gallery — WebGL noise-edged vertical wipe (port of the reference shader + timing),
// proximity hover thumbnails, autoplay with progress bar, blur intro.
import { reduceMotion, isTouch } from './util.js';

const IMAGES = Array.from({ length: 9 }, (_, i) => `assets/img/hero/h0${i + 1}.jpg`);
const THUMBS = Array.from({ length: 9 }, (_, i) => `assets/img/thumb/t0${i + 1}.jpg`);
// vertical crop focus per image (0 = top, .5 = centre) — h02 is a portrait, keep her face in frame
const FOCUS = [.5, .5, .5, .5, .5, .5, .5, .5, .5];
const CFG = { autoplay: 1.5, wipe: 1.4, distortion: .15, noiseScale: 5.5 };

const VERT = `attribute vec2 position;varying vec2 vUv;void main(){vUv=position*0.5+0.5;vUv.y=1.0-vUv.y;gl_Position=vec4(position,0.0,1.0);}`;
const FRAG = `precision highp float;varying vec2 vUv;
uniform sampler2D uTexCurrent;uniform sampler2D uTexNext;uniform float uProgress;uniform vec2 uResolution;uniform vec2 uImgCur;uniform vec2 uImgNext;uniform float uNoiseScale;uniform float uDistortion;uniform float uIsIntro;uniform float uFocusCur;uniform float uFocusNext;
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 a0=x-floor(x+0.5);vec3 g=a0*vec3(x0.x,x12.xz)+h*vec3(x0.y,x12.yw);return 130.0*dot(m,g);}
vec2 coverUV(vec2 img,float focus){vec2 r=vec2(min((uResolution.x/uResolution.y)/(img.x/img.y),1.0),min((uResolution.y/uResolution.x)/(img.y/img.x),1.0));return vec2(vUv.x*r.x+(1.0-r.x)*0.5,vUv.y*r.y+(1.0-r.y)*focus);}
void main(){vec2 uv=coverUV(uImgNext,uFocusNext);vec2 uvC=coverUV(uImgCur,uFocusCur);
vec2 sv=vec2(vUv.x*uResolution.x/uResolution.y,vUv.y);float n=snoise(sv*uNoiseScale*0.6);float mappedProgress=uProgress*(1.0+uDistortion*2.0)-uDistortion;float dist=(1.0-vUv.y)-mappedProgress+(n*uDistortion);
float wipe=smoothstep(0.0,0.01,dist);float edgeDistress=(1.0-smoothstep(0.0,0.05,abs(dist)))*0.03;vec2 uvR=uv+edgeDistress;vec2 uvCR=uvC+edgeDistress;
vec4 c1=mix(texture2D(uTexCurrent,uvCR),vec4(0.0),uIsIntro);vec4 c2=texture2D(uTexNext,uvR);gl_FragColor=mix(c2,c1,wipe);}`;

export function initHero() {
  const canvas = document.getElementById('heroGL');
  const blur = document.getElementById('heroBlur');
  const thumbsWrap = document.getElementById('thumbs');
  const card = canvas.parentElement;
  blur.style.backgroundImage = `url(${IMAGES[0]})`;

  // ---------- thumbnails ----------
  const thumbs = THUMBS.map((src, i) => {
    const b = document.createElement('button');
    b.className = 'thumb native-cursor'; b.type = 'button';
    b.setAttribute('role', 'tab'); b.setAttribute('aria-label', `Photo ${i + 1}`);
    b.style.backgroundImage = `url(${src})`; b.style.setProperty('--d', `${i * .065}s`);
    b.innerHTML = '<span class="thumb__bar"><i></i></span>';
    thumbsWrap.appendChild(b); return b;
  });

  let active = 0, introDone = false, userTook = false, timer = null;
  const setActive = (i, fromUser) => {
    if (fromUser) { userTook = true; gl.skipIntro(); }
    if (i === active && !fromUser) return;
    if (i !== active) { active = i; gl.goTo(i); }
    thumbs.forEach((t, k) => { t.classList.toggle('is-active', k === i); t.setAttribute('aria-selected', k === i); });
    restartBar();
  };
  const restartBar = () => {
    thumbs.forEach(t => t.querySelector('.thumb__bar').classList.remove('is-on'));
    clearInterval(timer);
    if (!introDone) return;
    const bar = thumbs[active].querySelector('.thumb__bar');
    bar.style.setProperty('--dur', CFG.autoplay + 's');
    void bar.offsetWidth; bar.classList.add('is-on');
    timer = setInterval(() => setActive((active + 1) % IMAGES.length), CFG.autoplay * 1000);
  };
  thumbs.forEach((t, i) => {
    t.addEventListener('click', () => setActive(i, true));
    t.addEventListener('mouseenter', () => { if (!proximity) setActive(i, true); });
  });
  // proximity hover: nearest thumbnail (by x) to the pointer anywhere over the hero
  const proximity = !isTouch;
  let centers = [], raf = 0, lastX = 0;
  const measure = () => { const r = card.getBoundingClientRect(); centers = thumbs.map(t => { const b = t.getBoundingClientRect(); return b.left - r.left + b.width / 2; }); };
  let measureT; const remeasure = () => { clearTimeout(measureT); measureT = setTimeout(measure, 420); };
  card.addEventListener('pointermove', e => {
    if (!proximity || !introDone) return; lastX = e.clientX;
    if (raf) return; raf = requestAnimationFrame(() => {
      raf = 0; const r = card.getBoundingClientRect(), x = lastX - r.left; let best = 0, bd = Infinity;
      centers.forEach((c, k) => { const d = Math.abs(x - c); if (d < bd) { bd = d; best = k; } });
      if (best !== active) { setActive(best, true); remeasure(); }
    });
  });
  addEventListener('resize', remeasure);

  // ---------- WebGL ----------
  const gl = createGL(canvas, () => {
    thumbs[0].classList.add('is-active');
    requestAnimationFrame(() => thumbsWrap.classList.add('is-in'));
    setTimeout(measure, 900);
  }, () => {
    if (introDone) return; introDone = true;
    blur.classList.add('is-hidden');
    thumbs.forEach(t => t.style.setProperty('--d', '0s'));
    restartBar();
  });

  // pause autoplay when hero not visible
  new IntersectionObserver(([e]) => { gl.setVisible(e.isIntersecting); if (!e.isIntersecting) clearInterval(timer); else if (introDone) restartBar(); }).observe(card);
}

function createGL(canvas, onReady, onIntroComplete) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  const state = { textures: [], out: 0, inc: 0, progress: 0, isIntro: 1, done: false, pending: -1, aspect: [1672, 941], visible: true, req: 0 };
  if (!gl) { // fallback: plain image swap
    canvas.style.display = 'none';
    onReady(); setTimeout(onIntroComplete, 400);
    return { goTo: i => { canvas.parentElement.querySelector('.hero__blur').style.cssText += `;filter:none;transform:none;opacity:1;background-image:url(${IMAGES[i]})`; }, setVisible() {}, skipIntro() {} };
  }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'position'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { cur: U('uTexCurrent'), next: U('uTexNext'), prog: U('uProgress'), res: U('uResolution'), ic: U('uImgCur'), inx: U('uImgNext'), ns: U('uNoiseScale'), dis: U('uDistortion'), intro: U('uIsIntro'), fc: U('uFocusCur'), fn: U('uFocusNext') };

  const load = src => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    res({ texture: t, w: im.naturalWidth, h: im.naturalHeight }); }; im.src = src; });

  // load first image fast, rest in background
  load(IMAGES[0]).then(first => {
    state.textures[0] = first; state.aspect = [first.w, first.h]; onReady();
    let last = performance.now();
    const frame = now => {
      state.req = requestAnimationFrame(frame);
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!state.visible) return;
      const dpr = Math.min(devicePixelRatio || 1, 2), w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      if (state.progress < 1) {
        const dur = state.isIntro ? CFG.wipe * 1.2 : Math.max(CFG.wipe, .05);
        state.progress = (reduceMotion || (state.skip && state.isIntro)) ? 1 : Math.min(state.progress + dt / dur, 1);
        if (state.progress >= 1) {
          state.out = state.inc; state.isIntro = 0;
          if (!state.done) { state.done = true; onIntroComplete(); }
          if (state.pending !== -1 && state.pending !== state.inc && state.textures[state.pending]) { start(state.pending); state.pending = -1; }
        } else if (state.isIntro && state.progress > .35 && !state.done) { /* let UI start autoplay a touch before the wipe fully settles */ }
      }
      const tc = state.textures[state.out] || state.textures[0], tn = state.textures[state.inc] || tc;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tc.texture); gl.uniform1i(u.cur, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tn.texture); gl.uniform1i(u.next, 1);
      gl.uniform1f(u.prog, 1 - Math.pow(1 - state.progress, 4));
      gl.uniform2f(u.res, w, h); gl.uniform2f(u.ic, tc.w, tc.h); gl.uniform2f(u.inx, tn.w, tn.h);
      gl.uniform1f(u.ns, CFG.noiseScale); gl.uniform1f(u.dis, CFG.distortion); gl.uniform1f(u.intro, state.isIntro); gl.uniform1f(u.fc, FOCUS[state.out] ?? .5); gl.uniform1f(u.fn, FOCUS[state.inc] ?? .5);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    state.req = requestAnimationFrame(frame);
    IMAGES.slice(1).forEach((src, k) => load(src).then(t => { state.textures[k + 1] = t; }));
  });

  function start(i) { state.out = state.inc; state.inc = i; state.progress = 0; const t = state.textures[i]; if (t) state.aspect = [t.w, t.h]; }
  return {
    goTo(i) { if (!state.textures[i]) { state.pending = i; return; } if (state.done) start(i); else state.pending = i; },
    setVisible(v) { state.visible = v; },
    skipIntro() { state.skip = true; }
  };
}
