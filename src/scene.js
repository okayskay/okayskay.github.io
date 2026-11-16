import * as THREE from "three";

// Кадры на плёнке — постеры проектов (URL через Vite, чтобы попали в сборку)
const FRAMES = [
  ["Жат бауыр-2", new URL("./img/zhat-bauyr-2.jpg", import.meta.url).href],
  ["Көршінің қызы", new URL("./img/korshinin-kyzy.jpg", import.meta.url).href],
  ["Кесу", new URL("./img/films/kesu.jpg", import.meta.url).href],
  ["Ауылдастар", new URL("./img/films/auyldastar.jpg", import.meta.url).href],
  ["Казахи против пришельцев", new URL("./img/films/kazakhi-vs-aliens.jpg", import.meta.url).href],
  ["Адасқан", new URL("./img/films/adasqan.jpg", import.meta.url).href],
  ["Қара таңба", new URL("./img/films/qara-tanba.jpg", import.meta.url).href],
  ["Ғашықпын саған", new URL("./img/films/gashykpyn-sagan.jpg", import.meta.url).href],
  ["Келінжан", new URL("./img/films/kelinzhan.jpg", import.meta.url).href],
  ["Сәке 2", new URL("./img/films/sake-2.jpg", import.meta.url).href],
  ["Жар-Жар", new URL("./img/films/zhar-zhar.jpg", import.meta.url).href],
];

function makeFilmTexture() {
  const frameW = 360, h = 300, holes = 30;
  const c = document.createElement("canvas");
  c.width = frameW * FRAMES.length; // 3960 — в пределах 4096 для телефонов
  c.height = h;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;

  g.fillStyle = "#151311";
  g.fillRect(0, 0, c.width, h);

  // перфорация
  g.fillStyle = "#050505";
  const step = c.width / (FRAMES.length * 6);
  for (let x = step / 2; x < c.width; x += step) {
    roundRect(g, x - 9, 12, 18, holes - 6, 4);
    roundRect(g, x - 9, h - holes - 6, 18, holes - 6, 4);
  }

  // обновляем текстуру пачкой, а не на каждый загруженный постер
  let pending = null;
  const flush = () => { clearTimeout(pending); pending = setTimeout(() => { tex.needsUpdate = true; }, 200); };

  const box = (i) => ({ x: i * frameW + 14, y: holes + 22, w: frameW - 28, fh: h - 2 * (holes + 22) });

  function drawLabel(i, title) {
    const { x, y, w, fh } = box(i);
    const shade = g.createLinearGradient(0, y + fh * 0.45, 0, y + fh);
    shade.addColorStop(0, "rgba(10,9,8,0)");
    shade.addColorStop(1, "rgba(10,9,8,0.85)");
    g.fillStyle = shade;
    g.fillRect(x, y, w, fh);
    g.fillStyle = "rgba(255,240,220,0.85)";
    g.font = '700 22px "Inter Tight", Arial, sans-serif';
    g.textBaseline = "bottom";
    wrapText(g, title.toUpperCase(), x + 16, y + fh - 12, w - 32, 24);
  }

  FRAMES.forEach(([title, src], i) => {
    const { x, y, w, fh } = box(i);
    // заставка, пока постер грузится
    g.fillStyle = "#24201c";
    g.fillRect(x, y, w, fh);
    drawLabel(i, title);

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      // cover: заполняем кадр, берём верхнюю часть постера (лица и название)
      const s = Math.max(w / img.width, fh / img.height);
      const sw = w / s, sh = fh / s;
      const sx = (img.width - sw) / 2, sy = Math.min(img.height - sh, (img.height - sh) * 0.3);
      g.save();
      g.filter = "saturate(0.65) brightness(0.62) contrast(1.05)";
      g.drawImage(img, sx, sy, sw, sh, x, y, w, fh);
      g.restore();
      // тёплая плёночная тонировка
      g.fillStyle = "rgba(233,162,59,0.08)";
      g.fillRect(x, y, w, fh);
      drawLabel(i, title);
      flush();
    };
    img.src = src;
  });

  return tex;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

function wrapText(g, text, x, yBottom, maxW, lh) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  lines.push(line);
  lines.reverse().forEach((l, i) => g.fillText(l, x, yBottom - i * lh));
}

export async function startScene(canvas) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    canvas.closest(".hero")?.classList.add("no-webgl");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x0b0b0c, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0b0c, 0.045);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  try { await document.fonts.load('700 22px "Inter Tight"', "ӨҢҚ"); } catch {}

  // --- Плёнка ---
  const tex = makeFilmTexture();
  const SEG = 360, LEN = 46, H = 1.5;
  const geo = new THREE.PlaneGeometry(LEN, H, SEG, 1);
  const base = geo.attributes.position.array.slice();
  tex.repeat.set(LEN / (H * (tex.image.width / tex.image.height)) / 1, 1);
  const film = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.15 })
  );
  const filmGroup = new THREE.Group();
  filmGroup.add(film);
  scene.add(filmGroup);

  function bendFilm(t) {
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const u = base[i] / LEN;            // -0.5..0.5
      const v = base[i + 1];              // -H/2..H/2
      const s = u * 9 + t * 0.25;
      const twist = Math.sin(u * 3.2 + t * 0.3) * 1.1 + u * 2.2;
      const cx = base[i] * 0.55;
      const cy = Math.sin(s) * 1.6 + u * 2.0;
      const cz = Math.cos(s * 0.8) * 2.4 - 1.5;
      p[i] = cx;
      p[i + 1] = cy + v * Math.cos(twist);
      p[i + 2] = cz + v * Math.sin(twist);
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // --- Свет проектора ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.SpotLight(0xffc37a, 520, 40, 0.6, 0.6, 1.2);
  key.position.set(9, 6, 8);
  key.target.position.set(1, 0, 0);
  scene.add(key, key.target);
  const rim = new THREE.PointLight(0x4fa3ff, 30, 30);
  rim.position.set(-8, -3, 4);
  scene.add(rim);

  // Луч (конус с мягкими краями)
  const beamGeo = new THREE.ConeGeometry(4.2, 22, 48, 1, true);
  beamGeo.translate(0, -11, 0);
  const beam = new THREE.Mesh(
    beamGeo,
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(0xffb35c) } },
      vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
        void main(){ vY = position.y; vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz);
        vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 uColor; varying vec3 vN; varying vec3 vV; varying float vY;
        void main(){ float edge = pow(abs(dot(vN, vV)), 2.2); float fade = smoothstep(-22., -2., vY) * (1. - smoothstep(-2., 0., vY) * .6);
        gl_FragColor = vec4(uColor, edge * fade * .14); }`,
    })
  );
  beam.position.copy(key.position);
  beam.lookAt(-6, -4, -6);
  beam.rotateX(-Math.PI / 2);
  scene.add(beam);

  // Пыль в луче
  const N = 1400;
  const dust = new Float32Array(N * 3);
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    dust[i * 3] = (Math.random() - 0.3) * 22;
    dust[i * 3 + 1] = (Math.random() - 0.5) * 12;
    dust[i * 3 + 2] = (Math.random() - 0.5) * 10;
    seeds[i] = Math.random() * 100;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  dustGeo.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float seed; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vec3 p = position; p.x += sin(uTime*.05 + seed)*.6; p.y += mod(uTime*.08 + seed, 12.) - 6. - position.y*0.;
      p.y = mod(p.y + 6., 12.) - 6.; vec4 mv = modelViewMatrix*vec4(p,1.);
      vA = .35 + .65*abs(sin(uTime*.6 + seed*3.)); gl_PointSize = (1.4 + fract(seed)*2.2) * uPx * (10. / -mv.z);
      gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,d);
      gl_FragColor = vec4(1., .82, .58, a*vA*.55); }`,
  });
  scene.add(new THREE.Points(dustGeo, dustMat));

  // --- Размер, мышь, видимость ---
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // на узких экранах отводим камеру, чтобы плёнка влезала
    camera.position.z = w < 760 ? 17 : 12;
    filmGroup.position.x = w < 760 ? 0 : 2.2;
    filmGroup.position.y = w < 760 ? 3.6 : 0;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
  });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(canvas);

  const clock = new THREE.Clock();
  let t = 0, running = false;
  function frame(dt) {
    t += dt;
    bendFilm(t);
    tex.offset.x = -t * 0.018;
    dustMat.uniforms.uTime.value = t;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    filmGroup.rotation.y = mouse.x * 0.18 - 0.25;
    filmGroup.rotation.x = mouse.y * 0.1 + 0.05;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  function loop() {
    if (running) return;
    running = true;
    clock.getDelta();
    const tick = () => {
      if (!visible || document.hidden) { running = false; return; }
      frame(Math.min(clock.getDelta(), 0.05));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) loop(); });

  canvas.classList.add("is-ready");
  if (reduced) { frame(4); return; }
  loop();
}
