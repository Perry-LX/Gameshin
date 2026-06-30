// @ts-nocheck
// Three.js Rubik's Cube — responsive sizing, matches original visual style

import * as THREE from 'three';

const COLORS = [
  [1, 0, 0, 0xb71234],
  [-1, 0, 0, 0xff5800],
  [0, 1, 0, 0xf8fafc],
  [0, -1, 0, 0xffd500],
  [0, 0, 1, 0x009e60],
  [0, 0, -1, 0x0051ba],
];

const SZ = 0.94;       // cubie body size
const STICK = 0.82;    // sticker size
const STICK_Z = 0.501; // sticker offset from center
const ANIM = 180;      // ms per move

const MOVES = {
  U: { a: 'y', l: 1, d: -1 },  "U'": { a: 'y', l: 1, d: 1 },
  D: { a: 'y', l: -1, d: 1 },  "D'": { a: 'y', l: -1, d: -1 },
  R: { a: 'x', l: 1, d: -1 },  "R'": { a: 'x', l: 1, d: 1 },
  L: { a: 'x', l: -1, d: 1 },  "L'": { a: 'x', l: -1, d: -1 },
  F: { a: 'z', l: 1, d: -1 },  "F'": { a: 'z', l: 1, d: 1 },
  B: { a: 'z', l: -1, d: 1 },  "B'": { a: 'z', l: -1, d: -1 },
};

const _q = new THREE.Quaternion();
const _ax = new THREE.Vector3();
const _sq = new THREE.Quaternion();

function im(m) { return m.endsWith("'") ? m.slice(0, -1) : `${m}'`; }
function ease(t) { return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }

// ── Rounded rectangle shape ──

function rr(w, h, r) {
  r = Math.min(r, w/2, h/2);
  const s = new THREE.Shape();
  s.moveTo(-w/2+r, -h/2); s.lineTo(w/2-r, -h/2);
  s.quadraticCurveTo(w/2, -h/2, w/2, -h/2+r);
  s.lineTo(w/2, h/2-r); s.quadraticCurveTo(w/2, h/2, w/2-r, h/2);
  s.lineTo(-w/2+r, h/2); s.quadraticCurveTo(-w/2, h/2, -w/2, h/2-r);
  s.lineTo(-w/2, -h/2+r); s.quadraticCurveTo(-w/2, -h/2, -w/2+r, -h/2);
  s.closePath();
  return s;
}

const STICK_GEO = new THREE.ShapeGeometry(rr(STICK, STICK, 0.10));

export class ThreeRubiksCube {
  constructor(container) {
    this.c = container;
    this.seq = [];
    this.moves = 0;
    this.busy = false;
    this.solved = true;
    this._cb = null;

    this._init();
    this._build();
    this._lights();
    this._loop();
  }

  onUpdate(fn) { this._cb = fn; }

  /* ── Scene ── */

  _init() {
    const w = this.c.clientWidth, h = this.c.clientHeight;

    this.scene = new THREE.Scene();

    // Camera distance auto-calculated so cube fits ≈50% viewport
    const fov = 35, fr = fov * Math.PI / 180;
    const dist = (3.2 / 2) / Math.tan(fr / 2) / 0.48;

    this.cam = new THREE.PerspectiveCamera(fov, w/h, 0.1, 100);
    this.cam.position.set(0, 0, dist);
    this.cam.lookAt(0, 0, 0);

    this.ren = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.ren.setSize(w, h);
    this.ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.ren.setClearColor(0, 0);
    this.c.appendChild(this.ren.domElement);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);

    this.dr = { on: false, lx: 0, ly: 0, rx: 0, ry: 0 };

    // Events
    this.c.addEventListener('pointerdown', e => { this.dr.on = true; this.dr.lx = e.clientX; this.dr.ly = e.clientY; });
    this.c.addEventListener('pointermove', e => {
      if (!this.dr.on) return;
      this.dr.ry += (e.clientX - this.dr.lx) * 0.008;
      this.dr.rx = Math.max(-1.3, Math.min(1.3, this.dr.rx + (e.clientY - this.dr.ly) * 0.008));
      this.dr.lx = e.clientX; this.dr.ly = e.clientY;
    });
    this.c.addEventListener('pointerup', () => { this.dr.on = false; });
    this.c.addEventListener('pointerleave', () => { this.dr.on = false; });
    this.c.addEventListener('wheel', e => {
      e.preventDefault();
      const s = this.cam.position.length();
      this.cam.position.multiplyScalar(1 + e.deltaY * 0.002);
    }, { passive: false });

    this._onResize = () => {
      const w2 = this.c.clientWidth, h2 = this.c.clientHeight;
      if (w2 > 0 && h2 > 0) {
        this.cam.aspect = w2 / h2; this.cam.updateProjectionMatrix();
        this.ren.setSize(w2, h2);
      }
    };
    window.addEventListener('resize', this._onResize);

    document.addEventListener('keydown', e => {
      const k = e.key.toUpperCase();
      if ('UDRLFB'.includes(k)) { this.do(e.shiftKey ? `${k}'` : k); e.preventDefault(); }
      else if (k === 'S' && !e.shiftKey && !e.ctrlKey && !e.metaKey) { this.scramble(22); e.preventDefault(); }
      else if (k === 'Z' && !e.shiftKey && !e.ctrlKey && !e.metaKey) { this.solve(); e.preventDefault(); }
      else if (k === 'X' && !e.shiftKey && !e.ctrlKey && !e.metaKey) { this.reset(); e.preventDefault(); }
    });
  }

  /* ── Cubies ── */

  _build() {
    this.cubies = [];
    const bodyG = new THREE.BoxGeometry(SZ, SZ, SZ);
    const bodyM = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.55, metalness: 0.02 });
    const stickM = {};

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const g = new THREE.Group();
          g.position.set(x, y, z);
          g.add(new THREE.Mesh(bodyG, bodyM));

          for (const [nx, ny, nz, c] of COLORS) {
            if (nx*x + ny*y + nz*z <= 0) continue;
            if (!stickM[c]) stickM[c] = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.06, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.3 });
            const st = new THREE.Mesh(STICK_GEO, stickM[c]);
            st.position.set(nx*STICK_Z, ny*STICK_Z, nz*STICK_Z);
            if (nx > 0) st.rotation.y = Math.PI/2;
            else if (nx < 0) st.rotation.y = -Math.PI/2;
            else if (ny > 0) st.rotation.x = -Math.PI/2;
            else if (ny < 0) st.rotation.x = Math.PI/2;
            else if (nz < 0) st.rotation.y = Math.PI;
            g.add(st);
          }
          this.pivot.add(g);
          this.cubies.push({ g, home: { x, y, z }, x, y, z, q: new THREE.Quaternion() });
        }
      }
    }
  }

  _lights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const d1 = new THREE.DirectionalLight(0xffffff, 1.0);
    d1.position.set(4, 6, 5); this.scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xffeedd, 0.6);
    d2.position.set(-3, 4, -4); this.scene.add(d2);
    const d3 = new THREE.DirectionalLight(0xffffff, 0.25);
    d3.position.set(0, -5, 3); this.scene.add(d3);
    // Front fill light for specular highlights on visible faces
    const d4 = new THREE.DirectionalLight(0xffffff, 0.35);
    d4.position.set(0, 1, 4); this.scene.add(d4);
  }

  _loop() {
    if (this._dead) return;
    requestAnimationFrame(() => this._loop());
    this.pivot.rotation.x += (this.dr.rx - this.pivot.rotation.x) * 0.08;
    this.pivot.rotation.y += (this.dr.ry - this.pivot.rotation.y) * 0.08;
    this.ren.render(this.scene, this.cam);
  }

  /* ── Moves ── */

  _apply(c) {
    c.g.position.set(c.x, c.y, c.z);
    c.g.quaternion.copy(c.q);
  }

  _rot(c, a, d) {
    const {x, y, z} = c;
    if (a === 'x') { c.y = -d*z; c.z = d*y; }
    else if (a === 'y') { c.x = d*z; c.z = -d*x; }
    else { c.x = -d*y; c.y = d*x; }
    _ax.set(a === 'x' ? 1 : 0, a === 'y' ? 1 : 0, a === 'z' ? 1 : 0);
    _q.setFromAxisAngle(_ax, d * Math.PI/2);
    c.q.premultiply(_q);
  }

  async do(name, rec = true) {
    const m = MOVES[name];
    if (!m || this.busy) return;
    this.busy = true;

    const aff = this.cubies.filter(c => c[m.a] === m.l);
    const sn = aff.map(c => ({ c, f: { x: c.x, y: c.y, z: c.z, q: c.q.clone() } }));
    for (const c of aff) this._rot(c, m.a, m.d);
    for (const s of sn) {
      s.t = { x: s.c.x, y: s.c.y, z: s.c.z, q: s.c.q.clone() };
      s.c.x = s.f.x; s.c.y = s.f.y; s.c.z = s.f.z; s.c.q.copy(s.f.q);
    }

    const t0 = performance.now();
    await new Promise(r => {
      const tick = () => {
        const t = Math.min(1, (performance.now()-t0)/ANIM);
        const e = ease(t);
        for (const s of sn) {
          s.c.x = s.f.x + (s.t.x - s.f.x)*e;
          s.c.y = s.f.y + (s.t.y - s.f.y)*e;
          s.c.z = s.f.z + (s.t.z - s.f.z)*e;
          _sq.copy(s.f.q).slerp(s.t.q, e);
          s.c.q.copy(_sq);
          this._apply(s.c);
        }
        if (t < 1) requestAnimationFrame(tick);
        else {
          for (const s of sn) { s.c.x = s.t.x; s.c.y = s.t.y; s.c.z = s.t.z; s.c.q.copy(s.t.q); this._apply(s.c); }
          r();
        }
      };
      requestAnimationFrame(tick);
    });

    if (rec) { this.seq.push(name); this.moves++; }
    this.busy = false;
    this._chk();
    this._cb?.({ moveCount: this.moves, isSolved: this.solved });
  }

  async scramble(n = 22) {
    if (this.busy) return;
    if (!this.solved) await this.reset();
    const ks = Object.keys(MOVES);
    let last = '';
    for (let i = 0; i < n; i++) {
      let m;
      do { m = ks[Math.floor(Math.random()*ks.length)]; } while (m[0] === last);
      last = m[0];
      await this.do(m);
    }
  }

  async solve() {
    if (this.busy || !this.seq.length) return;
    const ms = [...this.seq].reverse().map(im);
    this.seq = [];
    for (const m of ms) {
      await this.do(m, false);
      this.moves = Math.max(0, this.moves-1);
      this._cb?.({ moveCount: this.moves, isSolved: this.solved });
    }
    this._chk();
    this._cb?.({ moveCount: this.moves, isSolved: this.solved });
  }

  async reset() {
    if (this.busy) return;
    this.seq = []; this.moves = 0;
    for (const c of this.cubies) {
      c.x = c.home.x; c.y = c.home.y; c.z = c.home.z;
      c.q.identity(); this._apply(c);
    }
    this.solved = true;
    this._cb?.({ moveCount: 0, isSolved: true });
  }

  _chk() {
    this.solved = this.cubies.every(c =>
      Math.abs(c.x-c.home.x) < 0.01 && Math.abs(c.y-c.home.y) < 0.01 && Math.abs(c.z-c.home.z) < 0.01
      && c.q.angleTo(new THREE.Quaternion()) < 0.01
    );
  }

  resize() {
    this._onResize?.();
  }

  destroy() {
    this._dead = true;
    window.removeEventListener('resize', this._onResize);
    this.ren.dispose();
    if (this.ren.domElement.parentNode) this.ren.domElement.remove();
  }
}
