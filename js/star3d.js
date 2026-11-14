// Puffy clay star (three.js) that spins with scroll velocity — stand-in for the reference GLB.
// Material mirrors the reference props: clay #a8bfff, roughness 1, clearcoat .6, sheen .35 pink.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { reduceMotion } from './util.js';

export function initStar3D(register) {
  const canvas = document.getElementById('star3d'); if (!canvas) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100); camera.position.set(0, 0, 10);

  // rounded 5-point star outline → extrude with big bevel = "puffy" clay
  const shape = new THREE.Shape(); const P = 5, R = 1.55, r = .93, pts = [];
  for (let i = 0; i < P * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / P, rad = i % 2 ? r : R; pts.push(new THREE.Vector2(Math.cos(a) * rad, Math.sin(a) * rad)); }
  const round = .42; // corner rounding via quadratic curves through midpoints
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length];
    const a = p1.clone().lerp(p0, round * .5), b = p1.clone().lerp(p2, round * .5);
    if (i === 0) shape.moveTo(a.x, a.y); else shape.lineTo(a.x, a.y);
    shape.quadraticCurveTo(p1.x, p1.y, b.x, b.y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .55, bevelEnabled: true, bevelThickness: .42, bevelSize: .36, bevelSegments: 16, curveSegments: 48 });
  geo.center(); geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#93a9ff'), roughness: .7, envMapIntensity: .55, metalness: 0, clearcoat: .6, clearcoatRoughness: 1,
    sheen: .35, sheenColor: new THREE.Color('#ff9ee4'), sheenRoughness: .6, reflectivity: .8,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const group = new THREE.Group(); group.add(mesh); scene.add(group);
  // base tilt for a lively 3/4 view
  mesh.rotation.set(THREE.MathUtils.degToRad(-14), THREE.MathUtils.degToRad(18), THREE.MathUtils.degToRad(8));
  const key = new THREE.DirectionalLight('#ffffff', 1.25); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#ffb5f0', 1.2); rim.position.set(-5, -2, -3); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#fff6fb', '#5b3a6d', .55));

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const s = Math.min(2.1, Math.max(1, Math.min(w / 1440, h / 760) * 1.9)); group.scale.setScalar(s);
  };
  resize(); addEventListener('resize', resize);

  let visible = false, lastY = scrollY, vel = 0, rotY = 0, t0 = performance.now();
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(canvas);
  const sens = .3, friction = .79;
  register(() => {
    const y = scrollY, dy = y - lastY; lastY = y;
    if (!visible) return;
    if (!reduceMotion) { vel += dy * sens * .0045; vel *= friction; rotY += vel; }
    const t = (performance.now() - t0) / 1000;
    group.rotation.y = rotY;
    group.rotation.x = Math.sin(t * .6) * .06;
    group.position.y = Math.sin(t * .9) * .06;
    renderer.render(scene, camera);
  });
}
