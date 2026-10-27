/**
 * #numbers dotted globe.
 * Same scene as tracking-react/src/fx/modules/coverage-globe.js
 * (occluder, atmosphere rim, graticule, land dots, city arcs).
 * Spin is rootGroup.rotation.y += 0.0012 each frame — do not retune.
 *
 * tracking's coverage band is a full-bleed canvas with camera.y = 0.95.
 * Here the square disk is cropped by the existing #numbers CSS
 * (upper half, sitting low, dimmed), so the camera stays centered
 * and only the distance is set to match coverage-globe.webp.
 * Initial yaw matches that still, then the same spin takes over.
 */
import * as THREE from "./assets/vendor/three.module.min.js";

const AUTO_ROTATE = 0.0012;
const TILT_X = 0.3;
const STILL_YAW = 0.5585053606381855;
const CAM_Z = 3.38;

const CITIES = [
  ["Tokyo", 139.69, 35.68], ["Seoul", 126.97, 37.56], ["Beijing", 116.4, 39.9],
  ["Shanghai", 121.47, 31.23], ["Hong Kong", 114.17, 22.32], ["Singapore", 103.82, 1.35],
  ["Mumbai", 72.83, 19.08], ["Delhi", 77.1, 28.7], ["Bangkok", 100.5, 13.75],
  ["Jakarta", 106.85, -6.21], ["Sydney", 151.21, -33.87], ["Auckland", 174.76, -36.85],
  ["Dubai", 55.27, 25.2], ["Istanbul", 28.98, 41.01], ["Moscow", 37.62, 55.75],
  ["Cairo", 31.24, 30.04], ["Nairobi", 36.82, -1.29], ["Lagos", 3.38, 6.52],
  ["Cape Town", 18.42, -33.92], ["Johannesburg", 28.04, -26.2], ["Berlin", 13.4, 52.52],
  ["Paris", 2.35, 48.86], ["London", -0.13, 51.51], ["Amsterdam", 4.9, 52.37],
  ["Madrid", -3.7, 40.42], ["Rome", 12.5, 41.9], ["Stockholm", 18.07, 59.33],
  ["Reykjavik", -21.94, 64.13], ["New York", -74.01, 40.71], ["Toronto", -79.38, 43.65],
  ["Chicago", -87.65, 41.88], ["Miami", -80.19, 25.76], ["Los Angeles", -118.24, 34.05],
  ["San Francisco", -122.42, 37.77], ["Seattle", -122.33, 47.61], ["Mexico City", -99.13, 19.43],
  ["Bogota", -74.08, 4.71], ["Lima", -77.04, -12.05], ["Sao Paulo", -46.63, -23.55],
  ["Rio", -43.17, -22.91], ["Buenos Aires", -58.38, -34.61], ["Santiago", -70.65, -33.45],
  ["Anchorage", -149.9, 61.22], ["Honolulu", -157.86, 21.31], ["Perth", 115.86, -31.95],
  ["Karachi", 67.01, 24.86], ["Tehran", 51.39, 35.69], ["Riyadh", 46.72, 24.71],
];

function latLonToVec3(lat, lon, radius) {
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(latR) * Math.sin(lonR),
    radius * Math.sin(latR),
    radius * Math.cos(latR) * Math.cos(lonR),
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function mount() {
  const section = document.getElementById("numbers");
  const still = document.getElementById("numbers-globe-still");
  const view = document.getElementById("numbers-globe");
  if (!section || !view || section.dataset.numbersGlobe) return;
  if (prefersReducedMotion()) return;
  section.dataset.numbersGlobe = "mounting";

  const vctx = view.getContext("2d", { alpha: true });
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (err) {
    console.warn("[numbers-globe] webgl", err);
    section.dataset.numbersGlobe = "fallback";
    return;
  }
  renderer.setClearColor(0x000000, 0);
  const glc = renderer.domElement;
  glc.setAttribute("aria-hidden", "true");
  glc.style.cssText = "position:absolute;left:-99999px;top:0;width:2px;height:2px;pointer-events:none;";
  section.appendChild(glc);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = CAM_Z;
  camera.position.y = 0;

  const rootGroup = new THREE.Group();
  rootGroup.rotation.x = TILT_X;
  rootGroup.rotation.y = STILL_YAW;
  scene.add(rootGroup);

  rootGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.995, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x060912 }),
  ));

  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: "varying vec3 vNormal; void main(){ vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying vec3 vNormal; void main(){ float d = dot(vNormal, vec3(0.0,0.0,1.0)); float i = pow(max(0.0, 0.7 - d), 3.0) * 0.65; gl_FragColor = vec4(0.05, 0.3, 0.9, 1.0) * i; }",
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    }),
  ));

  const gratPos = [];
  for (let lat = -75; lat <= 75; lat += 15) {
    for (let i = 0; i < 180; i++) {
      const l1 = -180 + (360 * i) / 180, l2 = -180 + (360 * (i + 1)) / 180;
      const a = latLonToVec3(lat, l1, 1.001), b = latLonToVec3(lat, l2, 1.001);
      gratPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  for (let lon = -180; lon < 180; lon += 20) {
    for (let i = 0; i < 90; i++) {
      const la1 = -90 + (180 * i) / 90, la2 = -90 + (180 * (i + 1)) / 90;
      const a = latLonToVec3(la1, lon, 1.001), b = latLonToVec3(la2, lon, 1.001);
      gratPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const gratGeo = new THREE.BufferGeometry();
  gratGeo.setAttribute("position", new THREE.Float32BufferAttribute(gratPos, 3));
  rootGroup.add(new THREE.LineSegments(gratGeo, new THREE.LineBasicMaterial({ color: 0x1a2a44, transparent: true, opacity: 0.18 })));

  const dotsGroup = new THREE.Group();
  rootGroup.add(dotsGroup);

  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 32;
  const dctx = dotCanvas.getContext("2d");
  const dg = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  dg.addColorStop(0, "rgba(255,255,255,1)");
  dg.addColorStop(0.35, "rgba(255,255,255,0.9)");
  dg.addColorStop(1, "rgba(255,255,255,0)");
  dctx.fillStyle = dg;
  dctx.fillRect(0, 0, 32, 32);
  const dotTex = new THREE.CanvasTexture(dotCanvas);

  const hubPos = new Float32Array(CITIES.length * 3);
  CITIES.forEach(([, lon, lat], i) => {
    const v = latLonToVec3(lat, lon, 1.012);
    hubPos[i * 3] = v.x;
    hubPos[i * 3 + 1] = v.y;
    hubPos[i * 3 + 2] = v.z;
  });

  const ARC_SEGS = 64;
  const cityArcGroup = new THREE.Group();
  rootGroup.add(cityArcGroup);
  const cityArcs = [];
  const ARC_COUNT = 8;
  const ARC_COLOR = new THREE.Color("#e24dc0");
  const tAttr = new Float32Array(ARC_SEGS);
  for (let i = 0; i < ARC_SEGS; i++) tAttr[i] = i / (ARC_SEGS - 1);

  const buildArcPts = (ai, bi) => {
    const a = new THREE.Vector3(hubPos[ai * 3], hubPos[ai * 3 + 1], hubPos[ai * 3 + 2]);
    const b = new THREE.Vector3(hubPos[bi * 3], hubPos[bi * 3 + 1], hubPos[bi * 3 + 2]);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dist = a.distanceTo(b);
    mid.normalize().multiplyScalar(1 + (40 / 100) * dist * 0.9);
    const out = new Float32Array(ARC_SEGS * 3);
    for (let i = 0; i < ARC_SEGS; i++) {
      const t = i / (ARC_SEGS - 1), u = 1 - t;
      out[i * 3] = u * u * a.x + 2 * u * t * mid.x + t * t * b.x;
      out[i * 3 + 1] = u * u * a.y + 2 * u * t * mid.y + t * t * b.y;
      out[i * 3 + 2] = u * u * a.z + 2 * u * t * mid.z + t * t * b.z;
    }
    return out;
  };

  const spawnCityArc = () => {
    let ai = Math.floor(Math.random() * CITIES.length);
    let bi = Math.floor(Math.random() * CITIES.length);
    while (bi === ai) bi = Math.floor(Math.random() * CITIES.length);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(buildArcPts(ai, bi), 3));
    geo.setAttribute("aT", new THREE.Float32BufferAttribute(tAttr.slice(), 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: ARC_COLOR.clone() }, uHead: { value: 0 }, uLife: { value: 0 } },
      vertexShader: "attribute float aT;varying float vT;void main(){vT=aT;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "uniform vec3 uColor;uniform float uHead,uLife;varying float vT;void main(){float base=smoothstep(0.,0.15,vT)*smoothstep(1.,0.85,vT);float d=abs(vT-uHead);float p=exp(-d*d*90.);float a=(base*0.55+p*1.3)*uLife;gl_FragColor=vec4(uColor+p*vec3(0.4,0.5,0.6),a);}",
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { line: new THREE.Line(geo, mat), born: performance.now() / 1000, life: 2.2 + Math.random() * 2.2 };
  };

  while (cityArcs.length < ARC_COUNT) {
    const arc = spawnCityArc();
    cityArcs.push(arc);
    cityArcGroup.add(arc.line);
  }

  let animId = 0;
  let globeOn = false;
  let sized = false;

  const measure = () => {
    const el = still && !still.hidden ? still : view;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = el.clientWidth;
    const cssH = el.clientHeight || cssW;
    return {
      w: Math.max(1, Math.round(cssW * dpr)),
      h: Math.max(1, Math.round((cssH || cssW) * dpr)),
      cssW,
    };
  };

  const applySize = () => {
    const { w, h, cssW } = measure();
    if (!cssW) return false;
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    if (view.width !== w || view.height !== h) {
      view.width = w;
      view.height = h;
    }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    sized = true;
    return true;
  };

  const blit = () => {
    vctx.clearRect(0, 0, view.width, view.height);
    vctx.drawImage(glc, 0, 0, view.width, view.height);
  };

  const animate = (now) => {
    if (!globeOn) {
      animId = 0;
      return;
    }
    animId = requestAnimationFrame(animate);
    if (!sized && !applySize()) return;
    rootGroup.rotation.y += AUTO_ROTATE;
    const nowS = now / 1000;
    for (let k = 0; k < cityArcs.length; k++) {
      const ar = cityArcs[k];
      const age = nowS - ar.born;
      if (age > ar.life) {
        cityArcGroup.remove(ar.line);
        ar.line.geometry.dispose();
        ar.line.material.dispose();
        const nu = spawnCityArc();
        cityArcs[k] = nu;
        cityArcGroup.add(nu.line);
        continue;
      }
      const head = Math.min(1, age / (ar.life * 0.65));
      const lifeFade = age < 0.2 ? age / 0.2 : (age > ar.life - 0.4 ? (ar.life - age) / 0.4 : 1);
      ar.line.material.uniforms.uHead.value = head;
      ar.line.material.uniforms.uLife.value = lifeFade;
    }
    renderer.render(scene, camera);
    blit();
  };

  const reveal = () => {
    if (!applySize()) return false;
    renderer.render(scene, camera);
    blit();
    const probe = vctx.getImageData(view.width >> 1, view.height >> 1, 1, 1).data;
    if (probe[3] === 0) {
      console.warn("[numbers-globe] blit empty");
      section.dataset.numbersGlobe = "fallback";
      return false;
    }
    view.hidden = false;
    if (still) still.hidden = true;
    section.dataset.numbersGlobe = "live";
    return true;
  };

  const onVis = (vis) => {
    globeOn = vis && !prefersReducedMotion();
    if (globeOn && !animId) animId = requestAnimationFrame(animate);
  };

  const io = new IntersectionObserver((entries) => {
    onVis(entries.some((entry) => entry.isIntersecting));
  }, { rootMargin: "120px", threshold: 0.01 });
  io.observe(section);

  const ro = new ResizeObserver(() => {
    if (applySize() && section.dataset.numbersGlobe === "live") {
      renderer.render(scene, camera);
      blit();
    }
  });
  ro.observe(section);

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    if (prefersReducedMotion()) {
      globeOn = false;
      cancelAnimationFrame(animId);
      animId = 0;
      view.hidden = true;
      if (still) still.hidden = false;
      section.dataset.numbersGlobe = "reduced";
      return;
    }
    if (section.dataset.numbersGlobe === "reduced") {
      if (reveal()) onVis(true);
    }
  });

  fetch(new URL("./assets/coverage-land-dots.bin", import.meta.url))
    .then((res) => {
      if (!res.ok) throw new Error("dots " + res.status);
      return res.arrayBuffer();
    })
    .then((buf) => {
      const positions = new Float32Array(buf);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      dotsGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.015,
        map: dotTex,
        color: 0xc9dcf4,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
        alphaTest: 0.05,
      })));
      if (!reveal()) return;
      onVis(true);
    })
    .catch((err) => {
      console.warn("[numbers-globe]", err);
      section.dataset.numbersGlobe = "fallback";
    });
}

if (!prefersReducedMotion()) mount();
else {
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    if (!prefersReducedMotion()) mount();
  });
}
