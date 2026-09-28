/* ==========================================================================
   MULTI-USER REVIEW & SPECTATOR ENGINE (BroadcastChannel + LocalStorage Sync)
   (js/spectator.js)
   Problem Statement Requirement:
   "The simulation must support a 'Spectator Mode' where an instructor can
    observe a student's wiring progress and trigger specific input sequences
    remotely for testing."
   ========================================================================== */

const spectatorChannel = (typeof window.BroadcastChannel !== 'undefined')
  ? new BroadcastChannel('adderverse_spectator_channel')
  : null;

let isSpectatorDrawerOpen = false;
let remoteVerificationRunning = false;

function toggleSpectatorPanel() {
  if (isSpectatorDrawerOpen) {
    closeSpectatorPanel();
  } else {
    openSpectatorDrawer();
  }
}

function openSpectatorDrawer() {
  isSpectatorDrawerOpen = true;
  const backdrop = document.getElementById('spectator-drawer-backdrop');
  if (backdrop) backdrop.classList.add('show');
  updateEvaluatorProfile();
  broadcastSessionState();
}

function updateEvaluatorProfile() {
  const card = document.getElementById('spec-evaluator-card');
  const nameEl = document.getElementById('spec-evaluator-name');
  const idEl = document.getElementById('spec-evaluator-id');
  const roleEl = document.getElementById('spec-evaluator-role');
  const roomEl = document.getElementById('spec-evaluator-room');

  let instData = currentSession.role === 'spectator' ? currentSession : null;
  if (!instData) {
    try {
      const savedInst = localStorage.getItem('adderverse_instructor_profile');
      if (savedInst) instData = JSON.parse(savedInst);
    } catch(e) {}
  }

  if (instData && (instData.instructorId || instData.role === 'spectator')) {
    if (card) card.style.display = 'block';
    if (nameEl) nameEl.textContent = instData.name || 'Dr. A. Sharma';
    if (idEl) idEl.textContent = instData.instructorId || instData.roll || 'FAC-8842';
    if (roleEl) roleEl.textContent = instData.designation || 'Course Professor';
    if (roomEl) roomEl.textContent = instData.room || 'LAB-CS301';
  } else {
    // Hide or show default guest badge
    if (nameEl) nameEl.textContent = 'Demo Evaluator';
    if (idEl) idEl.textContent = 'DEMO-KEY';
    if (roleEl) roleEl.textContent = 'Faculty Reviewer';
    if (roomEl) roomEl.textContent = 'Open Sandbox';
  }
}

function closeSpectatorPanel(e) {
  if (e && e.target && e.target.closest && e.target.closest('.spectator-drawer')) return;
  isSpectatorDrawerOpen = false;
  const backdrop = document.getElementById('spectator-drawer-backdrop');
  if (backdrop) backdrop.classList.remove('show');
}

function openSpectatorWindow() {
  window.open('circuit.html?role=spectator', '_blank', 'width=1280,height=820');
}

function broadcastSessionState() {
  const packet = {
    type: 'STATE_SYNC',
    student: {
      name: currentSession.name,
      roll: currentSession.roll,
      dept: currentSession.dept,
      sem: currentSession.sem,
      role: currentSession.role
    },
    circuitState: { ...circuitState },
    userWires: {
      half: [...(userWires.half || [])],
      full: [...(userWires.full || [])]
    },
    timestamp: Date.now()
  };

  try {
    localStorage.setItem('adderverse_live_session', JSON.stringify(packet));
    if (spectatorChannel) spectatorChannel.postMessage(packet);
  } catch(e) {}

  updateSpectatorUI(packet);
}

function updateSpectatorUI(packet) {
  if (!packet) return;

  if (packet.student) {
    const sName = document.getElementById('spec-student-name');
    const sRoll = document.getElementById('spec-student-roll');
    const sDept = document.getElementById('spec-student-dept');
    if (sName) sName.textContent = packet.student.name || 'Vidhi Chavhan';
    if (sRoll) sRoll.textContent = packet.student.roll || '21CSE045';
    if (sDept) sDept.textContent = packet.student.dept || 'CSE';
  }

  const mode = (packet.circuitState && packet.circuitState.mode) ? packet.circuitState.mode : circuitState.mode;
  const benchLabel = document.getElementById('spec-active-bench');
  if (benchLabel) benchLabel.textContent = mode === 'half' ? 'Half Adder 3D' : 'Full Adder 3D';

  const triggersHalf = document.getElementById('spec-triggers-half');
  const triggersFull = document.getElementById('spec-triggers-full');
  if (triggersHalf && triggersFull) {
    if (mode === 'half') {
      triggersHalf.style.display = 'block';
      triggersFull.style.display = 'none';
    } else {
      triggersHalf.style.display = 'none';
      triggersFull.style.display = 'block';
    }
  }

  const wires = (packet.userWires && packet.userWires[mode]) ? packet.userWires[mode] : (userWires[mode] || []);
  const requiredTotal = mode === 'half' ? REQUIRED_HALF_WIRES.length : REQUIRED_FULL_WIRES.length;
  const connectedCount = wires.length;
  const pct = Math.min(100, Math.round((connectedCount / requiredTotal) * 100));

  const wireBadge = document.getElementById('spec-wire-badge');
  const progressBar = document.getElementById('spec-wire-progress-bar');
  const statusMsg = document.getElementById('spec-wiring-status-msg');
  const countLabel = document.getElementById('spec-wire-count-label');

  if (wireBadge) wireBadge.textContent = `${connectedCount} / ${requiredTotal} Connected (${pct}%)`;
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (countLabel) countLabel.textContent = connectedCount;

  const isWired = mode === 'half'
    ? (packet.circuitState ? packet.circuitState.halfWired : circuitState.halfWired)
    : (packet.circuitState ? packet.circuitState.fullWired : circuitState.fullWired);

  if (statusMsg) {
    if (isWired && connectedCount >= requiredTotal) {
      statusMsg.innerHTML = '<span style="color:var(--green);">✓ Circuit Fully Wired &amp; Closed Loop</span>';
    } else {
      statusMsg.innerHTML = `<span style="color:var(--amber);">⚠️ Circuit Open — Missing ${requiredTotal - connectedCount} connection(s)</span>`;
    }
  }

  const listEl = document.getElementById('spec-wire-list-items');
  if (listEl) {
    if (wires.length === 0) {
      listEl.innerHTML = '<div style="font-style:italic;">No wires connected yet.</div>';
    } else {
      listEl.innerHTML = wires.map((w, idx) => {
        const fromObj = TERMINALS[w.from] || { label: w.from };
        const toObj = TERMINALS[w.to] || { label: w.to };
        return `<div style="padding:2px 0;">#${idx + 1}: ${fromObj.label} ➔ ${toObj.label}</div>`;
      }).join('');
    }
  }

  const timeEl = document.getElementById('spectator-session-sync-time');
  if (timeEl) {
    timeEl.textContent = `Sync: ${new Date().toLocaleTimeString()} · Real-time`;
  }
}

if (spectatorChannel) {
  spectatorChannel.onmessage = (event) => {
    handleIncomingSpectatorMessage(event.data);
  };
}

window.addEventListener('storage', (e) => {
  if (e.key === 'adderverse_live_session' && e.newValue) {
    try {
      const data = JSON.parse(e.newValue);
      if (data.type === 'STATE_SYNC') updateSpectatorUI(data);
    } catch(err) {}
  } else if (e.key === 'adderverse_remote_command' && e.newValue) {
    try {
      const cmd = JSON.parse(e.newValue);
      handleIncomingSpectatorMessage(cmd);
    } catch(err) {}
  }
});

function handleIncomingSpectatorMessage(msg) {
  if (!msg) return;
  if (msg.type === 'STATE_SYNC') {
    updateSpectatorUI(msg);
  } else if (msg.type === 'REMOTE_TRIGGER_INPUTS') {
    const targetMode = msg.mode || circuitState.mode;
    if (circuitState.mode !== targetMode) {
      switchCircuit(targetMode);
    }
    circuitState.a = msg.a;
    circuitState.b = msg.b;
    if (msg.cin !== undefined) circuitState.cin = msg.cin;

    updateAllViews();
    if (typeof update3DSceneVisuals === 'function') {
      update3DSceneVisuals(circuitState.mode);
    }

    showSpectatorToast(`👨‍🏫 Remote Instructor triggered: A=${msg.a}, B=${msg.b}${msg.cin !== undefined ? ', Cin=' + msg.cin : ''}`);
  } else if (msg.type === 'INSTRUCTOR_STAMP') {
    applyInstructorStamp(msg.instructorName, msg.verdict);
    showSpectatorToast(`🎓 Official Instructor Stamp Applied by ${msg.instructorName}!`);
  }
}

function instructorTriggerInputs(a, b, cin = 0) {
  const curMode = circuitState.mode;
  const cmd = {
    type: 'REMOTE_TRIGGER_INPUTS',
    mode: curMode,
    a: a,
    b: b,
    cin: cin,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem('adderverse_remote_command', JSON.stringify(cmd));
    if (spectatorChannel) spectatorChannel.postMessage(cmd);
  } catch(e) {}

  circuitState.a = a;
  circuitState.b = b;
  if (curMode === 'full') circuitState.cin = cin;

  updateAllViews();
  if (typeof update3DSceneVisuals === 'function') {
    update3DSceneVisuals(curMode);
  }

  let expSum, expCarry;
  if (curMode === 'half') {
    expSum = a ^ b;
    expCarry = a & b;
  } else {
    expSum = a ^ b ^ cin;
    expCarry = (a & b) | ((a ^ b) & cin);
  }

  const isWired = curMode === 'half' ? circuitState.halfWired : circuitState.fullWired;
  const actualSum = isWired ? circuitState.sum : 0;
  const actualCarry = isWired ? circuitState.carry : 0;
  const passed = isWired && (actualSum === expSum) && (actualCarry === expCarry);

  const resultBox = document.getElementById('spec-monitor-results');
  if (resultBox) {
    resultBox.innerHTML = `
      <div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px; border-left:3px solid ${passed ? 'var(--green)' : 'var(--red)'};">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:${passed ? 'var(--green)' : 'var(--red)'}; font-size:12px;">
            ${passed ? '✅ TEST VECTOR VERIFIED' : (!isWired ? '⚠️ OPEN CIRCUIT / FLOATING' : '❌ OUTPUT LOGIC MISMATCH')}
          </strong>
          <span style="font-size:10px; color:var(--text-dim);">${new Date().toLocaleTimeString()}</span>
        </div>
        <div style="font-size:11px; margin-top:3px;">
          Input Applied: <strong>A=${a}, B=${b}${curMode==='full' ? ', Cin='+cin : ''}</strong>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
          Expected: Sum=${expSum}, Carry=${expCarry} &nbsp;|&nbsp; Student: Sum=${actualSum}, Carry=${actualCarry}
        </div>
      </div>
    `;
  }

  playAlertBeep(passed);
}

async function runRemoteVerificationSuite() {
  if (remoteVerificationRunning) return;
  remoteVerificationRunning = true;
  const btn = document.getElementById('btn-run-remote-suite');
  if (btn) btn.disabled = true;

  const curMode = circuitState.mode;
  const vectors = curMode === 'half'
    ? [[0,0,0], [0,1,0], [1,0,0], [1,1,0]]
    : [[0,0,0], [0,0,1], [0,1,0], [0,1,1], [1,0,0], [1,0,1], [1,1,0], [1,1,1]];

  const resultBox = document.getElementById('spec-monitor-results');
  if (resultBox) {
    resultBox.innerHTML = `<div style="color:var(--cyan); font-size:11px;">▶ Running automated remote test sequence (${vectors.length} vectors)...</div>`;
  }

  let passedCount = 0;
  let summaryHtml = '';

  for (let i = 0; i < vectors.length; i++) {
    const [va, vb, vcin] = vectors[i];
    instructorTriggerInputs(va, vb, vcin);
    await new Promise(r => setTimeout(r, 750));

    const isWired = curMode === 'half' ? circuitState.halfWired : circuitState.fullWired;
    let expS = curMode === 'half' ? (va ^ vb) : (va ^ vb ^ vcin);
    let expC = curMode === 'half' ? (va & vb) : ((va & vb) | ((va ^ vb) & vcin));
    let actS = isWired ? circuitState.sum : 0;
    let actC = isWired ? circuitState.carry : 0;
    let ok = isWired && (actS === expS) && (actC === expC);
    if (ok) passedCount++;

    summaryHtml += `
      <div style="display:flex; justify-content:space-between; font-size:10px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <span>Vector [${va},${vb}${curMode==='full'?','+vcin:''}]: Exp(S=${expS},C=${expC})</span>
        <span style="color:${ok ? 'var(--green)' : 'var(--red)'}; font-weight:700;">${ok ? '✓ PASS' : '✗ FAIL'}</span>
      </div>
    `;
    if (resultBox) {
      resultBox.innerHTML = `<div style="font-size:11px; margin-bottom:4px; color:var(--text);">Testing vector ${i+1}/${vectors.length}...</div>` + summaryHtml;
    }
  }

  const allPassed = passedCount === vectors.length;
  if (resultBox) {
    resultBox.innerHTML = `
      <div style="padding:8px; border-radius:6px; background:${allPassed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; border:1px solid ${allPassed ? 'var(--green)' : 'var(--red)'}; margin-bottom:8px;">
        <strong style="color:${allPassed ? 'var(--green)' : 'var(--red)'}; font-size:12px;">
          ${allPassed ? '🎉 ALL REMOTE TEST VECTORS PASSED' : '⚠️ REMOTE VERIFICATION FAILED'}
        </strong>
        <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
          Result: ${passedCount} / ${vectors.length} test vectors passed (${Math.round((passedCount/vectors.length)*100)}%).
        </div>
      </div>
    ` + summaryHtml;
  }

  if (btn) btn.disabled = false;
  remoteVerificationRunning = false;
}

function stampStudentCertificate() {
  const instructorName = document.getElementById('input-instructor-name')?.value.trim() || 'Prof. Evaluator';
  const verdict = document.getElementById('select-instructor-verdict')?.value || 'VERIFIED_PASS';
  const packet = {
    type: 'INSTRUCTOR_STAMP',
    instructorName: instructorName,
    verdict: verdict,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem('adderverse_remote_command', JSON.stringify(packet));
    localStorage.setItem('adderverse_certificate_stamp', JSON.stringify(packet));
    if (spectatorChannel) spectatorChannel.postMessage(packet);
  } catch(e) {}

  applyInstructorStamp(instructorName, verdict);

  showWiringAlert(
    "Instructor Review Recorded!",
    "SPECTATOR STAMP ISSUED",
    `Student Evaluated by ${instructorName}`,
    `The student's circuit testing was completed remotely in Spectator Mode with verdict: ${verdict.replace('_', ' ')}.`,
    "Official verification badge will appear on the student's lab certificate in the Practice & Viva page.",
    true
  );
}

function applyInstructorStamp(instructorName, verdict) {
  const stampBox = document.getElementById('cert-instructor-stamp-box');
  const details = document.getElementById('cert-instructor-details');
  if (stampBox && details) {
    stampBox.style.display = 'block';
    details.innerHTML = `Verified by: <strong style="color:var(--text);">${instructorName}</strong> &nbsp;·&nbsp; Evaluation: <span style="color:var(--green); font-weight:700;">${verdict.replace('_', ' ')}</span> &nbsp;·&nbsp; Mode: <em>Spectator Remote Verification</em>`;
  }
}

function showSpectatorToast(msg) {
  let toast = document.getElementById('spectator-toast-elem');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'spectator-toast-elem';
    toast.className = 'spectator-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="font-size:16px;">👨‍🏫</span> <span>${msg}</span>`;
  toast.style.display = 'flex';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}
