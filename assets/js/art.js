import * as THREE from "https://unpkg.com/three@0.166.1/build/three.module.js";

const canvas = document.getElementById("world");
const fallbackCanvas = document.getElementById("fallback-world");
const cursorLight = document.querySelector(".cursor-light");
const eraName = document.getElementById("era-name");
const eraLine = document.getElementById("era-line");
const pulseButton = document.getElementById("pulse-button");

const eras = {
  spark: "listen to the long signal",
  fire: "warmth became a public technology",
  word: "memory learned to travel",
  number: "the sky accepted measurement",
  city: "strangers became infrastructure",
  care: "fragility entered the design",
  machine: "hands became engines",
  sky: "the finite began answering the infinite",
};

const palette = {
  ember: new THREE.Color("#ff5a2c"),
  gold: new THREE.Color("#f5c84b"),
  jade: new THREE.Color("#2cff9a"),
  lapis: new THREE.Color("#5da8ff"),
  rose: new THREE.Color("#ff6f91"),
  bone: new THREE.Color("#fff4dc"),
};

let renderer;
let scene;
let camera;
let crown;
let particles;
let glyphs;
let pulse = 0;
let pointerX = 0;
let pointerY = 0;
let activeEra = "spark";

function initThree() {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#060504", 0.022);

  camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 12);

  const ambient = new THREE.AmbientLight("#fff4dc", 0.85);
  const fire = new THREE.PointLight("#ff5a2c", 10, 34);
  const sky = new THREE.PointLight("#5da8ff", 8, 36);
  fire.position.set(-5, -2, 7);
  sky.position.set(5, 3, 6);
  scene.add(ambient, fire, sky);

  crown = new THREE.Group();
  scene.add(crown);
  buildRings();
  buildSignalField();
  buildGlyphCloud();
}

function buildRings() {
  const colors = [palette.ember, palette.gold, palette.jade, palette.lapis, palette.rose, palette.bone];
  for (let i = 0; i < 11; i += 1) {
    const radius = 1.45 + i * 0.42;
    const geometry = new THREE.TorusGeometry(radius, 0.006 + i * 0.0008, 12, 280);
    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.2 - i * 0.01,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI * (0.5 + i * 0.037);
    ring.rotation.y = Math.PI * (i * 0.029);
    ring.userData.speed = 0.0006 + i * 0.00013;
    crown.add(ring);
  }
}

function buildSignalField() {
  const count = 1800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorWheel = [palette.ember, palette.gold, palette.jade, palette.lapis, palette.rose, palette.bone];

  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const angle = i * 2.399963229728653;
    const radius = 2.2 + t * 7.8;
    const wave = Math.sin(i * 0.071) * 0.65;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius * 0.58 + wave;
    positions[i * 3 + 2] = (Math.sin(i * 0.043) * 3.4) - 2.8;

    const color = colorWheel[i % colorWheel.length];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function buildGlyphCloud() {
  glyphs = new THREE.Group();
  const geometry = new THREE.IcosahedronGeometry(0.038, 0);
  const colors = [palette.gold, palette.jade, palette.lapis, palette.rose];

  for (let i = 0; i < 132; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const piece = new THREE.Mesh(geometry, material);
    const phi = Math.acos(1 - 2 * (i + 0.5) / 132);
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    const radius = 3.3 + (i % 9) * 0.21;
    piece.position.set(
      Math.cos(theta) * Math.sin(phi) * radius,
      Math.sin(theta) * Math.sin(phi) * radius,
      Math.cos(phi) * radius
    );
    piece.userData.seed = i * 0.037;
    glyphs.add(piece);
  }

  scene.add(glyphs);
}

function updateEra() {
  const sections = [...document.querySelectorAll("[data-era]")];
  const mid = window.innerHeight * 0.52;
  let next = "spark";

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= mid && rect.bottom >= mid) {
      next = section.dataset.era;
      break;
    }
  }

  if (next !== activeEra) {
    activeEra = next;
    eraName.textContent = next;
    eraLine.textContent = eras[next] || eras.spark;
    document.body.dataset.era = next;
  }
}

function animate(time) {
  const seconds = time * 0.001;
  const scroll = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
  const targetZ = 12 - scroll * 5.2;
  camera.position.z += (targetZ - camera.position.z) * 0.035;
  camera.position.x += (pointerX * 0.9 - camera.position.x) * 0.025;
  camera.position.y += (-pointerY * 0.6 - camera.position.y) * 0.025;

  crown.rotation.x = Math.sin(seconds * 0.16) * 0.12 + pointerY * 0.05;
  crown.rotation.y = seconds * 0.07 + pointerX * 0.12 + scroll * Math.PI * 0.4;
  crown.children.forEach((ring, index) => {
    ring.rotation.z += ring.userData.speed * (1 + pulse * 4);
    ring.material.opacity = 0.1 + Math.sin(seconds * 0.7 + index) * 0.035 + pulse * 0.08;
  });

  if (particles) {
    particles.rotation.y = -seconds * 0.025 + pointerX * 0.08;
    particles.rotation.x = Math.sin(seconds * 0.11) * 0.06 + pointerY * 0.05;
    particles.material.size = 0.035 + pulse * 0.045;
  }

  if (glyphs) {
    glyphs.rotation.y = seconds * 0.05;
    glyphs.rotation.x = Math.cos(seconds * 0.1) * 0.09;
    glyphs.children.forEach((piece) => {
      piece.scale.setScalar(1 + Math.sin(seconds * 2 + piece.userData.seed * 40) * 0.22 + pulse);
    });
  }

  pulse *= 0.94;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function resize() {
  if (!renderer || !camera) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function initInteraction() {
  window.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    cursorLight.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate3d(-50%, -50%, 0)`;
  });

  window.addEventListener("scroll", updateEra, { passive: true });
  window.addEventListener("resize", resize);

  pulseButton.addEventListener("click", () => {
    pulse = 1.4;
  });
}

function drawFallback() {
  document.body.classList.add("fallback");
  const ctx = fallbackCanvas.getContext("2d");

  function size() {
    fallbackCanvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
    fallbackCanvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function frame(time) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#060504";
    ctx.fillRect(0, 0, width, height);
    const cx = width * 0.52;
    const cy = height * 0.5;
    const colors = ["#ff5a2c", "#f5c84b", "#2cff9a", "#5da8ff", "#ff6f91"];

    for (let i = 0; i < 120; i += 1) {
      const angle = i * 0.38 + time * 0.00018;
      const radius = 40 + i * 3.3;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.62, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length];
      ctx.globalAlpha = 0.42;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  size();
  window.addEventListener("resize", size);
  requestAnimationFrame(frame);
}

try {
  initThree();
  initInteraction();
  updateEra();
  requestAnimationFrame(animate);
} catch (error) {
  console.warn("WebGL artwork fallback engaged.", error);
  initInteraction();
  updateEra();
  drawFallback();
}

