/* ==========================================================================
   THREE.JS 3D WORKBENCH & PHYSICAL BREADBOARD ENGINE (js/three-bench.js)
   ========================================================================== */

// 3D Scene Registry
const scenes = {
  half: {
    initialized: false,
    containerId: 'viewport-half',
    canvasId: 'canvas-half',
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    animId: null,
    meshes: {},
    wires: [],
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    clickableObjects: [],
    selectedPin: null,
    terminalMeshes: {}
  },
  full: {
    initialized: false,
    containerId: 'viewport-full',
    canvasId: 'canvas-full',
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    animId: null,
    meshes: {},
    wires: [],
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    clickableObjects: [],
    selectedPin: null,
    terminalMeshes: {}
  }
};

function init3DWorkbench(mode) {
  const ctx = scenes[mode];
  const container = document.getElementById(ctx.containerId);
  const canvas = document.getElementById(ctx.canvasId);

  if (!container || !canvas) return;
  if (ctx.animId) cancelAnimationFrame(ctx.animId);
  if (ctx.renderer) ctx.renderer.dispose();

  const width = container.clientWidth || 900;
  const height = container.clientHeight || 500;

  ctx.renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  ctx.renderer.setSize(width, height);
  ctx.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  ctx.renderer.shadowMap.enabled = true;
  ctx.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  ctx.scene = new THREE.Scene();
  ctx.scene.background = new THREE.Color(0x0a1424);
  ctx.scene.fog = new THREE.Fog(0x0a1424, 25, 45);

  ctx.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  ctx.camera.position.set(0, 11, 17);

  ctx.controls = new THREE.OrbitControls(ctx.camera, canvas);
  ctx.controls.enableDamping = true;
  ctx.controls.dampingFactor = 0.05;
  ctx.controls.minDistance = 6;
  ctx.controls.maxDistance = 28;
  ctx.controls.maxPolarAngle = Math.PI * 0.46;
  ctx.controls.target.set(0, 0.5, 0);
  ctx.controls.update();

  setupStudioLighting(ctx.scene);
  buildPhysicalCircuit(mode);
  setupRaycastingInteraction(mode);

  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0 && ctx.renderer) {
      ctx.renderer.setSize(w, h);
      ctx.camera.aspect = w / h;
      ctx.camera.updateProjectionMatrix();
    }
  });
  resizeObserver.observe(container);

  ctx.initialized = true;
  startRenderLoop(mode);
  reconstruct3DWires(mode);
  checkCircuitCompletion(mode);
}

function setupStudioLighting(scene) {
  const ambient = new THREE.AmbientLight(0x88b0d0, 0.85);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(6, 15, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  scene.add(keyLight);

  const rimCyan = new THREE.PointLight(0x00d4ff, 18, 25);
  rimCyan.position.set(-9, 6, 6);
  scene.add(rimCyan);

  const bounceAmber = new THREE.PointLight(0xf59e0b, 14, 25);
  bounceAmber.position.set(9, 5, -6);
  scene.add(bounceAmber);
}

function buildPhysicalCircuit(mode) {
  const ctx = scenes[mode];
  const isHalf = mode === 'half';
  ctx.meshes = {};
  ctx.wires = [];
  ctx.clickableObjects = [];
  ctx.terminalMeshes = {};

  const boardWidth = isHalf ? 19 : 25;
  const boardDepth = isHalf ? 9 : 11;

  // Solderless Breadboard Base Plate
  const bbGroup = new THREE.Group();
  const baseGeo = new THREE.BoxGeometry(boardWidth, 0.45, boardDepth);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.45, metalness: 0.1 });
  const breadboardBase = new THREE.Mesh(baseGeo, baseMat);
  breadboardBase.position.y = -0.225;
  breadboardBase.receiveShadow = true;
  bbGroup.add(breadboardBase);

  const topPlateGeo = new THREE.BoxGeometry(boardWidth - 0.4, 0.05, boardDepth - 0.4);
  const topPlateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const topPlate = new THREE.Mesh(topPlateGeo, topPlateMat);
  topPlate.position.y = 0.025;
  topPlate.receiveShadow = true;
  bbGroup.add(topPlate);

  // Power Rails
  const railGeo = new THREE.BoxGeometry(boardWidth - 1.2, 0.04, 0.1);
  const redRail = new THREE.Mesh(railGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  redRail.position.set(0, 0.05, -boardDepth / 2 + 0.55);
  bbGroup.add(redRail);

  const blueRail = new THREE.Mesh(railGeo, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  blueRail.position.set(0, 0.05, -boardDepth / 2 + 0.85);
  bbGroup.add(blueRail);

  ctx.scene.add(bbGroup);

  // Component Layout
  let layout;
  if (isHalf) {
    layout = {
      swA: [-6.8, 0.5, -2.0],
      swB: [-6.8, 0.5, 2.0],
      xor1: [0.0, 0.5, -1.8],
      and1: [0.0, 0.5, 1.8],
      ledSum: [6.8, 0.5, -1.8],
      ledCarry: [6.8, 0.5, 1.8]
    };
  } else {
    layout = {
      swA: [-9.5, 0.5, -3.2],
      swB: [-9.5, 0.5, 0.0],
      swCin: [-9.5, 0.5, 3.2],
      xor1: [-3.2, 0.5, -1.8],
      and1: [-3.2, 0.5, 1.8],
      xor2: [2.8, 0.5, -3.0],
      and2: [2.8, 0.5, 0.5],
      or1: [6.5, 0.5, 1.8],
      ledSum: [10.5, 0.5, -3.0],
      ledCarry: [10.5, 0.5, 1.8]
    };
  }

  // Components
  createToggleSwitch(ctx, 'a', layout.swA, 'INPUT A');
  createToggleSwitch(ctx, 'b', layout.swB, 'INPUT B');
  if (!isHalf) {
    createToggleSwitch(ctx, 'cin', layout.swCin, 'INPUT Cin');
  }

  createLogicGateIC(ctx, 'xor1', layout.xor1, '74LS86 XOR', 0x00d4ff);
  createLogicGateIC(ctx, 'and1', layout.and1, '74LS08 AND', 0xf59e0b);
  if (!isHalf) {
    createLogicGateIC(ctx, 'xor2', layout.xor2, '74LS86 XOR₂', 0x00d4ff);
    createLogicGateIC(ctx, 'and2', layout.and2, '74LS08 AND₂', 0xf59e0b);
    createLogicGateIC(ctx, 'or1', layout.or1, '74LS32 OR', 0xa855f7);
  }

  createDomeLED(ctx, 'sum', layout.ledSum, 'SUM LED', 0x00d4ff);
  createDomeLED(ctx, 'carry', layout.ledCarry, 'CARRY LED', 0xf59e0b);

  // Terminal Pin Contacts (Gold)
  createTerminalPin(ctx, 'sw_a', [layout.swA[0] + 0.8, 0.35, layout.swA[2]], 'Switch A Out');
  createTerminalPin(ctx, 'sw_b', [layout.swB[0] + 0.8, 0.35, layout.swB[2]], 'Switch B Out');
  if (!isHalf) {
    createTerminalPin(ctx, 'sw_cin', [layout.swCin[0] + 0.8, 0.35, layout.swCin[2]], 'Cin Out');
  }

  createTerminalPin(ctx, 'xor1_in1', [layout.xor1[0] - 1.1, 0.35, layout.xor1[2] - 0.3], 'XOR In1');
  createTerminalPin(ctx, 'xor1_in2', [layout.xor1[0] - 1.1, 0.35, layout.xor1[2] + 0.3], 'XOR In2');
  createTerminalPin(ctx, 'xor1_out', [layout.xor1[0] + 1.1, 0.35, layout.xor1[2]], 'XOR Out');

  createTerminalPin(ctx, 'and1_in1', [layout.and1[0] - 1.1, 0.35, layout.and1[2] - 0.3], 'AND In1');
  createTerminalPin(ctx, 'and1_in2', [layout.and1[0] - 1.1, 0.35, layout.and1[2] + 0.3], 'AND In2');
  createTerminalPin(ctx, 'and1_out', [layout.and1[0] + 1.1, 0.35, layout.and1[2]], 'AND Out');

  if (!isHalf) {
    createTerminalPin(ctx, 'xor2_in1', [layout.xor2[0] - 1.1, 0.35, layout.xor2[2] - 0.3], 'XOR₂ In1');
    createTerminalPin(ctx, 'xor2_in2', [layout.xor2[0] - 1.1, 0.35, layout.xor2[2] + 0.3], 'XOR₂ In2');
    createTerminalPin(ctx, 'xor2_out', [layout.xor2[0] + 1.1, 0.35, layout.xor2[2]], 'XOR₂ Out');

    createTerminalPin(ctx, 'and2_in1', [layout.and2[0] - 1.1, 0.35, layout.and2[2] - 0.3], 'AND₂ In1');
    createTerminalPin(ctx, 'and2_in2', [layout.and2[0] - 1.1, 0.35, layout.and2[2] + 0.3], 'AND₂ In2');
    createTerminalPin(ctx, 'and2_out', [layout.and2[0] + 1.1, 0.35, layout.and2[2]], 'AND₂ Out');

    createTerminalPin(ctx, 'or1_in1', [layout.or1[0] - 1.1, 0.35, layout.or1[2] - 0.3], 'OR In1');
    createTerminalPin(ctx, 'or1_in2', [layout.or1[0] - 1.1, 0.35, layout.or1[2] + 0.3], 'OR In2');
    createTerminalPin(ctx, 'or1_out', [layout.or1[0] + 1.1, 0.35, layout.or1[2]], 'OR Out');
  }

  createTerminalPin(ctx, 'led_sum', [layout.ledSum[0] - 0.8, 0.35, layout.ledSum[2]], 'SUM LED In');
  createTerminalPin(ctx, 'led_carry', [layout.ledCarry[0] - 0.8, 0.35, layout.ledCarry[2]], 'CARRY LED In');
}

function createTerminalPin(ctx, pinId, pos, pinLabel) {
  const pinGroup = new THREE.Group();
  pinGroup.position.set(...pos);

  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.45, 16);
  const postMat = new THREE.MeshStandardMaterial({
    color: 0xd4a843,
    metalness: 0.95,
    roughness: 0.1
  });
  const post = new THREE.Mesh(postGeo, postMat);
  post.position.y = 0.225;
  pinGroup.add(post);

  const ringGeo = new THREE.RingGeometry(0.18, 0.28, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00d4ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.46;
  pinGroup.add(ring);

  const hitGeo = new THREE.BoxGeometry(0.6, 0.9, 0.6);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hit = new THREE.Mesh(hitGeo, hitMat);
  hit.position.y = 0.45;
  hit.userData = { isPin: true, pinId: pinId, label: pinLabel };
  pinGroup.add(hit);

  ctx.scene.add(pinGroup);
  ctx.clickableObjects.push(hit);
  ctx.terminalMeshes[pinId] = { group: pinGroup, ring: ring, pos: pos };
}

function createToggleSwitch(ctx, key, pos, labelText) {
  const swGroup = new THREE.Group();
  swGroup.position.set(...pos);

  const baseGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.35, 24);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.castShadow = true;
  swGroup.add(base);

  const leverGroup = new THREE.Group();
  leverGroup.position.set(0, 0.18, 0);

  const leverGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.9, 16);
  const leverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
  const leverStem = new THREE.Mesh(leverGeo, leverMat);
  leverStem.position.y = 0.45;
  leverGroup.add(leverStem);

  const tipGeo = new THREE.SphereGeometry(0.24, 20, 20);
  const tipMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.6 });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.y = 0.9;
  leverGroup.add(tip);

  swGroup.add(leverGroup);

  const sprite = createTextSprite(labelText, '#00d4ff');
  sprite.position.set(0, 1.6, 0);
  swGroup.add(sprite);

  const hitBoxGeo = new THREE.BoxGeometry(1.2, 2.0, 1.2);
  const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
  hitBox.position.y = 0.8;
  hitBox.userData = { isSwitch: true, switchKey: key };
  swGroup.add(hitBox);

  ctx.scene.add(swGroup);
  ctx.meshes[`sw_${key}`] = { group: swGroup, lever: leverGroup, tip: tip };
  ctx.clickableObjects.push(hitBox);
}

function createLogicGateIC(ctx, key, pos, chipLabel, glowColor) {
  const icGroup = new THREE.Group();
  icGroup.position.set(...pos);

  const bodyGeo = new THREE.BoxGeometry(1.9, 0.55, 1.15);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.275;
  icGroup.add(body);

  const ribbonGeo = new THREE.BoxGeometry(1.7, 0.04, 0.9);
  const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, emissive: 0x000000, emissiveIntensity: 0 });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.position.y = 0.56;
  icGroup.add(ribbon);

  const sprite = createTextSprite(chipLabel, '#ffffff');
  sprite.position.set(0, 1.25, 0);
  icGroup.add(sprite);

  ctx.scene.add(icGroup);
  ctx.meshes[`gate_${key}`] = { group: icGroup, ribbon: ribbon, glowColor: glowColor };
}

function createDomeLED(ctx, key, pos, labelText, lightColor) {
  const ledGroup = new THREE.Group();
  ledGroup.position.set(...pos);

  const holderGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.3, 24);
  const holderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
  const holder = new THREE.Mesh(holderGeo, holderMat);
  holder.position.y = 0.15;
  ledGroup.add(holder);

  const domeGeo = new THREE.SphereGeometry(0.38, 24, 24);
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x000000, emissiveIntensity: 0.05, transparent: true, opacity: 0.9 });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 0.45;
  ledGroup.add(dome);

  const pointLight = new THREE.PointLight(lightColor, 0, 8);
  pointLight.position.set(0, 0.9, 0);
  ledGroup.add(pointLight);

  const sprite = createTextSprite(labelText, '#94a3b8');
  sprite.position.set(0, 1.45, 0);
  ledGroup.add(sprite);

  ctx.scene.add(ledGroup);
  ctx.meshes[`led_${key}`] = { group: ledGroup, dome: dome, light: pointLight, color: lightColor };
}

function createTextSprite(text, textColor = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const g = canvas.getContext('2d');
  g.font = 'bold 26px Inter, JetBrains Mono, sans-serif';
  g.fillStyle = textColor; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.9, 0.48, 1);
  return sprite;
}

function reconstruct3DWires(mode) {
  const ctx = scenes[mode];
  if (!ctx.scene) return;

  ctx.wires.forEach(w => {
    ctx.scene.remove(w.line);
    ctx.scene.remove(w.pulse);
    w.line.geometry.dispose();
    w.line.material.dispose();
    w.pulse.geometry.dispose();
    w.pulse.material.dispose();
  });
  ctx.wires = [];

  const currentWires = userWires[mode];
  currentWires.forEach(wDef => {
    const pinA = ctx.terminalMeshes[wDef.from];
    const pinB = ctx.terminalMeshes[wDef.to];
    if (!pinA || !pinB) return;

    const p1 = new THREE.Vector3(...pinA.pos);
    const p3 = new THREE.Vector3(...pinB.pos);
    const arcHeight = Math.max(p1.y, p3.y) + 1.25;
    const mid = new THREE.Vector3((p1.x + p3.x) / 2, arcHeight, (p1.z + p3.z) / 2);

    const curve = new THREE.CatmullRomCurve3([p1, mid, p3]);
    const points = curve.getPoints(32);

    const wireGeo = new THREE.BufferGeometry().setFromPoints(points);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.65,
      linewidth: 2
    });
    const wireLine = new THREE.Line(wireGeo, wireMat);
    ctx.scene.add(wireLine);

    const pulseGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff, visible: false });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    ctx.scene.add(pulse);

    const termFrom = TERMINALS[wDef.from];
    ctx.wires.push({
      line: wireLine,
      material: wireMat,
      curve: curve,
      pulse: pulse,
      pulseMat: pulseMat,
      signalKey: termFrom ? termFrom.signal : 'a'
    });
  });
}

function setupRaycastingInteraction(mode) {
  const ctx = scenes[mode];
  const canvas = document.getElementById(ctx.canvasId);

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    ctx.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ctx.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    ctx.raycaster.setFromCamera(ctx.mouse, ctx.camera);
    const intersects = ctx.raycaster.intersectObjects(ctx.clickableObjects, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData && hit.userData.isSwitch) {
        toggleInput(hit.userData.switchKey);
        return;
      }
      if (hit.userData && hit.userData.isPin) {
        handlePinClick(mode, hit.userData.pinId, hit.userData.label);
      }
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    ctx.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ctx.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    ctx.raycaster.setFromCamera(ctx.mouse, ctx.camera);
    const intersects = ctx.raycaster.intersectObjects(ctx.clickableObjects, true);
    canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
  });
}

function handlePinClick(mode, pinId, label) {
  const ctx = scenes[mode];
  const banner = document.getElementById(`pin-banner-${mode}`);
  const bannerText = document.getElementById(`pin-banner-text-${mode}`);

  if (!ctx.selectedPin) {
    ctx.selectedPin = pinId;
    playAlertBeep(true);
    if (banner && bannerText) {
      banner.style.display = 'flex';
      bannerText.textContent = `Pin 1: ${label} ➔ Click Destination Pin...`;
    }
    if (ctx.terminalMeshes[pinId]) {
      ctx.terminalMeshes[pinId].ring.material.color.setHex(0xf59e0b);
      ctx.terminalMeshes[pinId].ring.material.opacity = 1.0;
    }
  } else {
    const pinA = ctx.selectedPin;
    const pinB = pinId;

    if (ctx.terminalMeshes[pinA]) {
      ctx.terminalMeshes[pinA].ring.material.color.setHex(0x00d4ff);
      ctx.terminalMeshes[pinA].ring.material.opacity = 0.6;
    }

    ctx.selectedPin = null;
    if (banner) banner.style.display = 'none';

    addJumperWire(mode, pinA, pinB);
  }
}

function update3DSceneVisuals(mode) {
  const ctx = scenes[mode];
  if (!ctx.initialized || !ctx.scene) return;
  const isWired = mode === 'half' ? circuitState.halfWired : circuitState.fullWired;

  const switchKeys = mode === 'half' ? ['a', 'b'] : ['a', 'b', 'cin'];
  switchKeys.forEach(k => {
    const swObj = ctx.meshes[`sw_${k}`];
    if (!swObj) return;
    const isHigh = circuitState[k] === 1;

    swObj.lever.rotation.z = isHigh ? -0.45 : 0.45;
    swObj.tip.material.color.setHex(isHigh ? 0x10b981 : 0xef4444);
    swObj.tip.material.emissive.setHex(isHigh ? 0x059669 : 0x991b1b);
    swObj.tip.material.emissiveIntensity = isHigh ? 0.9 : 0.4;
  });

  const gateSignals = {
    xor1: circuitState.x1,
    and1: circuitState.c1,
    xor2: circuitState.sum,
    and2: circuitState.c2,
    or1: circuitState.carry
  };

  Object.keys(gateSignals).forEach(gKey => {
    const gateObj = ctx.meshes[`gate_${gKey}`];
    if (!gateObj) return;
    const isGateHigh = isWired && gateSignals[gKey] === 1;

    gateObj.ribbon.material.emissive.setHex(isGateHigh ? gateObj.glowColor : 0x000000);
    gateObj.ribbon.material.emissiveIntensity = isGateHigh ? 0.8 : 0;
  });

  ['sum', 'carry'].forEach(lKey => {
    const ledObj = ctx.meshes[`led_${lKey}`];
    if (!ledObj) return;
    const isLedHigh = isWired && circuitState[lKey] === 1;

    if (isLedHigh) {
      ledObj.dome.material.color.setHex(ledObj.color);
      ledObj.dome.material.emissive.setHex(ledObj.color);
      ledObj.dome.material.emissiveIntensity = 2.4;
      ledObj.light.intensity = 8.0;
    } else {
      ledObj.dome.material.color.setHex(0x1e293b);
      ledObj.dome.material.emissive.setHex(0x000000);
      ledObj.dome.material.emissiveIntensity = 0.05;
      ledObj.light.intensity = 0;
    }
  });

  const signalMap = {
    a: circuitState.a,
    b: circuitState.b,
    cin: circuitState.cin,
    x1: circuitState.x1,
    c1: circuitState.c1,
    c2: circuitState.c2,
    sum: circuitState.sum,
    carry: circuitState.carry
  };

  ctx.wires.forEach(w => {
    const isHigh = isWired && signalMap[w.signalKey] === 1;
    if (isHigh) {
      w.material.color.setHex(0x00d4ff);
      w.material.opacity = 0.95;
      w.pulseMat.visible = true;
    } else {
      w.material.color.setHex(0x334155);
      w.material.opacity = 0.35;
      w.pulseMat.visible = false;
    }
  });
}

function startRenderLoop(mode) {
  const ctx = scenes[mode];
  let startTime = performance.now();

  function render(currentTime) {
    ctx.animId = requestAnimationFrame(render);
    if (ctx.controls) ctx.controls.update();

    const elapsedSeconds = (currentTime - startTime) * 0.001;
    ctx.wires.forEach((w, index) => {
      if (!w.pulseMat.visible) return;
      const progress = ((elapsedSeconds * 0.8) + (index * 0.15)) % 1;
      const pt = w.curve.getPoint(progress);
      w.pulse.position.copy(pt);
    });

    if (ctx.renderer && ctx.scene && ctx.camera) {
      ctx.renderer.render(ctx.scene, ctx.camera);
    }
  }

  render(performance.now());
}

function setCameraView(mode, viewType) {
  const ctx = scenes[mode];
  if (!ctx.camera) return;

  if (viewType === 'iso') ctx.camera.position.set(0, 11, 17);
  else if (viewType === 'top') ctx.camera.position.set(0, 20, 0.1);
  else if (viewType === 'front') ctx.camera.position.set(0, 6, 18);
  ctx.controls.target.set(0, 0.5, 0);
  ctx.controls.update();
}

function resetCameraView(mode) {
  setCameraView(mode, 'iso');
}
