/* ==========================================================================
   CIRCUIT ENGINE: LOGIC SOLVER, NETLIST & ELECTRICAL FAULT SYSTEM
   (js/circuit-engine.js)
   ========================================================================== */

// 1. Terminal Pin Definitions
const TERMINALS = {
  // Half Adder Pins
  sw_a:     { id: 'sw_a', label: 'Switch A Output', type: 'OUTPUT', signal: 'a', mode: 'half' },
  sw_b:     { id: 'sw_b', label: 'Switch B Output', type: 'OUTPUT', signal: 'b', mode: 'half' },
  xor1_in1: { id: 'xor1_in1', label: 'XOR Gate Pin 1 (1A)', type: 'INPUT', accepts: ['a', 'b'], mode: 'half' },
  xor1_in2: { id: 'xor1_in2', label: 'XOR Gate Pin 2 (1B)', type: 'INPUT', accepts: ['a', 'b'], mode: 'half' },
  xor1_out: { id: 'xor1_out', label: 'XOR Gate Pin 3 (1Y)', type: 'OUTPUT', signal: 'x1', mode: 'half' },
  and1_in1: { id: 'and1_in1', label: 'AND Gate Pin 1 (1A)', type: 'INPUT', accepts: ['a', 'b'], mode: 'half' },
  and1_in2: { id: 'and1_in2', label: 'AND Gate Pin 2 (1B)', type: 'INPUT', accepts: ['a', 'b'], mode: 'half' },
  and1_out: { id: 'and1_out', label: 'AND Gate Pin 3 (1Y)', type: 'OUTPUT', signal: 'c1', mode: 'half' },
  led_sum:  { id: 'led_sum', label: 'SUM LED Anode Terminal', type: 'INPUT', accepts: ['x1', 'sum'], mode: 'half' },
  led_carry:{ id: 'led_carry', label: 'CARRY LED Anode Terminal', type: 'INPUT', accepts: ['c1', 'carry'], mode: 'half' },

  // Full Adder Specific Pins
  sw_cin:   { id: 'sw_cin', label: 'Switch Cin Output', type: 'OUTPUT', signal: 'cin', mode: 'full' },
  xor2_in1: { id: 'xor2_in1', label: 'XOR₂ Gate Pin 4 (2A)', type: 'INPUT', accepts: ['x1', 'cin'], mode: 'full' },
  xor2_in2: { id: 'xor2_in2', label: 'XOR₂ Gate Pin 5 (2B)', type: 'INPUT', accepts: ['x1', 'cin'], mode: 'full' },
  xor2_out: { id: 'xor2_out', label: 'XOR₂ Gate Pin 6 (2Y)', type: 'OUTPUT', signal: 'sum', mode: 'full' },
  and2_in1: { id: 'and2_in1', label: 'AND₂ Gate Pin 4 (2A)', type: 'INPUT', accepts: ['x1', 'cin'], mode: 'full' },
  and2_in2: { id: 'and2_in2', label: 'AND₂ Gate Pin 5 (2B)', type: 'INPUT', accepts: ['x1', 'cin'], mode: 'full' },
  and2_out: { id: 'and2_out', label: 'AND₂ Gate Pin 6 (2Y)', type: 'OUTPUT', signal: 'c2', mode: 'full' },
  or1_in1:  { id: 'or1_in1', label: 'OR Gate Pin 1 (1A)', type: 'INPUT', accepts: ['c1', 'c2'], mode: 'full' },
  or1_in2:  { id: 'or1_in2', label: 'OR Gate Pin 2 (1B)', type: 'INPUT', accepts: ['c1', 'c2'], mode: 'full' },
  or1_out:  { id: 'or1_out', label: 'OR Gate Pin 3 (1Y)', type: 'OUTPUT', signal: 'carry', mode: 'full' }
};

// Ground Truth Netlists
const REQUIRED_HALF_WIRES = [
  { from: 'sw_a', to: 'xor1_in1' },
  { from: 'sw_b', to: 'xor1_in2' },
  { from: 'sw_a', to: 'and1_in1' },
  { from: 'sw_b', to: 'and1_in2' },
  { from: 'xor1_out', to: 'led_sum' },
  { from: 'and1_out', to: 'led_carry' }
];

const REQUIRED_FULL_WIRES = [
  { from: 'sw_a', to: 'xor1_in1' },
  { from: 'sw_b', to: 'xor1_in2' },
  { from: 'sw_a', to: 'and1_in1' },
  { from: 'sw_b', to: 'and1_in2' },
  { from: 'xor1_out', to: 'xor2_in1' },
  { from: 'sw_cin', to: 'xor2_in2' },
  { from: 'xor1_out', to: 'and2_in1' },
  { from: 'sw_cin', to: 'and2_in2' },
  { from: 'and1_out', to: 'or1_in1' },
  { from: 'and2_out', to: 'or1_in2' },
  { from: 'xor2_out', to: 'led_sum' },
  { from: 'or1_out', to: 'led_carry' }
];

// Active State
const circuitState = {
  mode: 'half', // 'half' or 'full'
  a: 0,
  b: 0,
  cin: 0,
  x1: 0,
  c1: 0,
  c2: 0,
  sum: 0,
  carry: 0,
  halfWired: true,
  fullWired: true
};

const userWires = {
  half: [...REQUIRED_HALF_WIRES],
  full: [...REQUIRED_FULL_WIRES]
};

let autoCycleInterval = null;

// Validation Engine
function validateConnection(mode, pinId1, pinId2) {
  if (pinId1 === pinId2) {
    return { valid: false, reason: "Same Pin Loop", desc: "Cannot connect a terminal pin to itself." };
  }

  const p1 = TERMINALS[pinId1];
  const p2 = TERMINALS[pinId2];
  if (!p1 || !p2) {
    return { valid: false, reason: "Unrecognized Terminal", desc: "One of the selected terminals is invalid." };
  }

  // Already exists
  const existing = userWires[mode].some(w =>
    (w.from === pinId1 && w.to === pinId2) || (w.from === pinId2 && w.to === pinId1)
  );
  if (existing) {
    return { valid: false, reason: "Duplicate Jumper", desc: "This terminal pair is already connected." };
  }

  // Electrical Short Circuit: Output to Output
  if (p1.type === 'OUTPUT' && p2.type === 'OUTPUT') {
    return {
      valid: false,
      reason: "BUS CONTENTION SHORT CIRCUIT",
      desc: `Directly connecting two driver outputs (${p1.label} ➔ ${p2.label}) causes extreme overcurrent and logic gate burnout in physical ICs!`,
      hint: "Rules: Connect an Output driver terminal to an Input receiver terminal."
    };
  }

  // Electrical Floating Line: Input to Input
  if (p1.type === 'INPUT' && p2.type === 'INPUT') {
    return {
      valid: false,
      reason: "FLOATING HIGH-IMPEDANCE STATE",
      desc: `Connecting receiver pin (${p1.label}) directly to (${p2.label}) leaves both gates floating with undefined logic levels.`,
      hint: "Rules: Every gate input must be driven by an active signal source."
    };
  }

  const source = p1.type === 'OUTPUT' ? p1 : p2;
  const dest = p1.type === 'INPUT' ? p1 : p2;

  // Signal compatibility
  if (dest.accepts && !dest.accepts.includes(source.signal)) {
    return {
      valid: false,
      reason: "INVALID LOGICAL ROUTING",
      desc: `Terminal ${dest.label} is not designed to receive the '${source.signal.toUpperCase()}' signal from ${source.label}.`,
      hint: `Expected valid signal(s): [${dest.accepts.join(', ').toUpperCase()}]. Review the circuit diagram.`
    };
  }

  return { valid: true, from: source.id, to: dest.id };
}

function addJumperWire(mode, pinId1, pinId2) {
  const result = validateConnection(mode, pinId1, pinId2);

  if (!result.valid) {
    const label1 = TERMINALS[pinId1]?.label || pinId1;
    const label2 = TERMINALS[pinId2]?.label || pinId2;
    showWiringAlert(
      "Electrical Wiring Fault Detected!",
      result.reason,
      `${label1}  ➔  ${label2}`,
      result.desc,
      result.hint || "Review standard breadboard wiring guidelines."
    );
    return false;
  }

  userWires[mode].push({ from: result.from, to: result.to });
  
  if (typeof reconstruct3DWires === 'function') {
    reconstruct3DWires(mode);
  }
  checkCircuitCompletion(mode);
  return true;
}

function checkCircuitCompletion(mode) {
  const req = mode === 'half' ? REQUIRED_HALF_WIRES : REQUIRED_FULL_WIRES;
  const wires = userWires[mode];
  const totalRequired = req.length;
  let connectedCount = 0;

  req.forEach(r => {
    const found = wires.some(w =>
      (w.from === r.from && w.to === r.to) || (w.from === r.to && w.to === r.from)
    );
    if (found) connectedCount++;
  });

  const isComplete = connectedCount >= totalRequired;
  circuitState[mode === 'half' ? 'halfWired' : 'fullWired'] = isComplete;

  const counter = document.getElementById(`wire-counter-${mode}`);
  const strip = document.getElementById(`wiring-strip-${mode}`);
  const pill = document.getElementById(`wiring-pill-${mode}`);
  const task = document.getElementById(`wiring-task-${mode}`);

  if (counter) counter.textContent = `${connectedCount} / ${totalRequired} Connected`;
  if (strip && pill && task) {
    if (isComplete) {
      strip.className = 'wiring-status-strip state-verified';
      pill.className = 'wiring-mode-pill pill-complete';
      pill.textContent = 'CIRCUIT OPERATIONAL';
      task.innerHTML = '🎉 <strong>Circuit Verified!</strong> All required jumper connections are correct. Flip switches to test the truth table.';
      counter.style.color = 'var(--green)';
    } else {
      strip.className = 'wiring-status-strip state-incomplete';
      pill.className = 'wiring-mode-pill pill-manual';
      pill.textContent = 'WIRING INCOMPLETE';
      task.textContent = `👉 Connect remaining ${totalRequired - connectedCount} jumper(s) to close the circuit and activate outputs.`;
      counter.style.color = 'var(--amber)';
    }
  }

  updateAllViews();
}

function autoWireReference(mode) {
  userWires[mode] = mode === 'half' ? [...REQUIRED_HALF_WIRES] : [...REQUIRED_FULL_WIRES];
  if (typeof reconstruct3DWires === 'function') {
    reconstruct3DWires(mode);
  }
  checkCircuitCompletion(mode);
  showWiringAlert(
    "Reference Circuit Auto-Wired",
    "BENCH AUTO-WIRED",
    `All ${mode === 'half' ? '6' : '12'} Connections Placed`,
    `The ${mode === 'half' ? 'Half' : 'Full'} Adder circuit has been fully connected according to theoretical specifications.`,
    "You can now flip switches to inspect live truth table outputs.",
    true
  );
}

function clearAllWires(mode) {
  userWires[mode] = [];
  if (typeof reconstruct3DWires === 'function') {
    reconstruct3DWires(mode);
  }
  checkCircuitCompletion(mode);
}

function connectFromSelect(mode) {
  const fromVal = document.getElementById(`select-${mode}-from`).value;
  const toVal = document.getElementById(`select-${mode}-to`).value;
  addJumperWire(mode, fromVal, toVal);
}

// Logic Solver
function solveLogic() {
  const isWired = circuitState.mode === 'half' ? circuitState.halfWired : circuitState.fullWired;

  if (!isWired) {
    circuitState.x1 = 0;
    circuitState.c1 = 0;
    circuitState.c2 = 0;
    circuitState.sum = 0;
    circuitState.carry = 0;
    return;
  }

  const { a, b, cin, mode } = circuitState;
  circuitState.x1 = a ^ b;
  circuitState.c1 = a & b;
  circuitState.c2 = circuitState.x1 & cin;

  if (mode === 'half') {
    circuitState.sum = circuitState.x1;
    circuitState.carry = circuitState.c1;
  } else {
    circuitState.sum = circuitState.x1 ^ cin;
    circuitState.carry = circuitState.c1 | circuitState.c2;
  }
}

function toggleInput(pinName) {
  const isWired = circuitState.mode === 'half' ? circuitState.halfWired : circuitState.fullWired;
  if (!isWired) {
    showWiringAlert(
      "Circuit Path Incomplete!",
      "OPEN CIRCUIT FAULT",
      "Inputs Floating",
      "The circuit cannot process signals because required jumper wires are missing. Please complete the wiring first.",
      "Click '⚡ Auto-Wire Reference' or wire the terminal pins to continue."
    );
    return;
  }
  circuitState[pinName] = circuitState[pinName] ? 0 : 1;
  updateAllViews();
}

function updateAllViews() {
  solveLogic();
  const isHalf = circuitState.mode === 'half';
  const isWired = isHalf ? circuitState.halfWired : circuitState.fullWired;

  // Update Switches
  updateSwitchCard(isHalf ? 'sw-half-a' : 'sw-full-a', isHalf ? 'num-half-a' : 'num-full-a', circuitState.a);
  updateSwitchCard(isHalf ? 'sw-half-b' : 'sw-full-b', isHalf ? 'num-half-b' : 'num-full-b', circuitState.b);
  if (!isHalf) {
    updateSwitchCard('sw-full-cin', 'num-full-cin', circuitState.cin);
  }

  // Update Gate Monitors
  if (isHalf) {
    updateGateCard('gate-card-h-xor', 'val-gate-h-xor', circuitState.x1, 'active-cyan');
    updateGateCard('gate-card-h-and', 'val-gate-h-and', circuitState.c1, 'active-amber');
  } else {
    updateGateCard('gate-card-f-xor1', 'val-gate-f-xor1', circuitState.x1, 'active-cyan');
    updateGateCard('gate-card-f-xor2', 'val-gate-f-xor2', circuitState.sum, 'active-cyan');
    updateGateCard('gate-card-f-and1', 'val-gate-f-and1', circuitState.c1, 'active-amber');
    updateGateCard('gate-card-f-and2', 'val-gate-f-and2', circuitState.c2, 'active-amber');
    updateGateCard('gate-card-f-or', 'val-gate-f-or', circuitState.carry, 'active-purple');
  }

  // Output LEDs
  const sumActive = isWired && circuitState.sum === 1;
  const carryActive = isWired && circuitState.carry === 1;

  if (isHalf) {
    const ledSum = document.getElementById('led-card-h-sum');
    const ledCarry = document.getElementById('led-card-h-carry');
    if (ledSum) ledSum.className = `led-output-card ${sumActive ? 'on-sum' : ''}`;
    if (ledCarry) ledCarry.className = `led-output-card ${carryActive ? 'on-carry' : ''}`;
    
    const statusSum = document.getElementById('status-h-sum');
    const statusCarry = document.getElementById('status-h-carry');
    if (statusSum) statusSum.textContent = sumActive ? 'HIGH (+5.0 V)' : 'LOW (0 V)';
    if (statusCarry) statusCarry.textContent = carryActive ? 'HIGH (+5.0 V)' : 'LOW (0 V)';

    const mathEl = document.getElementById('math-eval-half');
    if (mathEl) {
      mathEl.innerHTML = isWired
        ? `SUM = ${circuitState.a} ⊕ ${circuitState.b} = <strong style="color:var(--cyan); font-size:15px;">${circuitState.sum}</strong> &nbsp;|&nbsp; ` +
          `CARRY = ${circuitState.a} · ${circuitState.b} = <strong style="color:var(--amber); font-size:15px;">${circuitState.carry}</strong>`
        : `<span style="color:var(--amber);">⚠️ Circuit Open — Wire connections to activate logic calculations.</span>`;
    }

    const rowIndex = (circuitState.a << 1) | circuitState.b;
    document.querySelectorAll('#table-half tbody tr').forEach((row, i) => {
      row.className = (isWired && i === rowIndex) ? 'active-row' : '';
    });

    [0, 1, 2, 3].forEach(p => {
      const el = document.getElementById(`pip-h-${p}`);
      if (!el) return;
      if (isWired && p < rowIndex) el.className = 'progress-pip completed';
      else if (isWired && p === rowIndex) el.className = 'progress-pip current';
      else el.className = 'progress-pip';
    });
  } else {
    const ledSum = document.getElementById('led-card-f-sum');
    const ledCarry = document.getElementById('led-card-f-carry');
    if (ledSum) ledSum.className = `led-output-card ${sumActive ? 'on-sum' : ''}`;
    if (ledCarry) ledCarry.className = `led-output-card ${carryActive ? 'on-carry' : ''}`;

    const statusSum = document.getElementById('status-f-sum');
    const statusCarry = document.getElementById('status-f-carry');
    if (statusSum) statusSum.textContent = sumActive ? 'HIGH (+5.0 V)' : 'LOW (0 V)';
    if (statusCarry) statusCarry.textContent = carryActive ? 'HIGH (+5.0 V)' : 'LOW (0 V)';

    const mathEl = document.getElementById('math-eval-full');
    if (mathEl) {
      mathEl.innerHTML = isWired
        ? `X₁ = ${circuitState.a} ⊕ ${circuitState.b} = ${circuitState.x1} &nbsp;|&nbsp; ` +
          `SUM = ${circuitState.x1} ⊕ ${circuitState.cin} = <strong style="color:var(--cyan); font-size:15px;">${circuitState.sum}</strong> &nbsp;|&nbsp; ` +
          `C<sub>out</sub> = ${circuitState.c1} + ${circuitState.c2} = <strong style="color:var(--amber); font-size:15px;">${circuitState.carry}</strong>`
        : `<span style="color:var(--amber);">⚠️ Circuit Open — Wire connections to activate logic calculations.</span>`;
    }

    const rowIndex = (circuitState.a << 2) | (circuitState.b << 1) | circuitState.cin;
    document.querySelectorAll('#table-full tbody tr').forEach((row, i) => {
      row.className = (isWired && i === rowIndex) ? 'active-row' : '';
    });

    for (let p = 0; p < 8; p++) {
      const el = document.getElementById(`pip-f-${p}`);
      if (!el) continue;
      if (isWired && p < rowIndex) el.className = 'progress-pip completed';
      else if (isWired && p === rowIndex) el.className = 'progress-pip current';
      else el.className = 'progress-pip';
    }
  }

  if (typeof update3DSceneVisuals === 'function') {
    update3DSceneVisuals(circuitState.mode);
  }

  // Trigger spectator broadcast
  if (typeof broadcastSessionState === 'function') {
    broadcastSessionState();
  }
}

function updateSwitchCard(cardId, numId, value) {
  const card = document.getElementById(cardId);
  const num = document.getElementById(numId);
  if (!card || !num) return;
  if (value === 1) {
    card.classList.add('active');
    num.textContent = '1';
  } else {
    card.classList.remove('active');
    num.textContent = '0';
  }
}

function updateGateCard(cardId, valId, val, activeClass) {
  const card = document.getElementById(cardId);
  const valEl = document.getElementById(valId);
  if (!card || !valEl) return;
  valEl.textContent = val;
  if (val === 1) card.classList.add(activeClass);
  else card.classList.remove(activeClass);
}

function toggleAutoSequence(mode) {
  const btn = document.getElementById(`btn-autocycle-${mode}`);
  if (autoCycleInterval) {
    clearInterval(autoCycleInterval);
    autoCycleInterval = null;
    if (btn) btn.classList.remove('primary');
    return;
  }

  if (btn) btn.classList.add('primary');
  let step = 0;
  const maxSteps = mode === 'half' ? 4 : 8;

  autoCycleInterval = setInterval(() => {
    if (mode === 'half') {
      circuitState.a = (step >> 1) & 1;
      circuitState.b = step & 1;
    } else {
      circuitState.a = (step >> 2) & 1;
      circuitState.b = (step >> 1) & 1;
      circuitState.cin = step & 1;
    }
    updateAllViews();
    step = (step + 1) % maxSteps;
  }, 1000);
}

function toggleSchematicView(mode) {
  const modal = document.getElementById(`schematic-card-${mode}`);
  if (modal) {
    modal.classList.toggle('show');
  }
}
