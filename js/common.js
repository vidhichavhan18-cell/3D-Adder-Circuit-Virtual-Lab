/* ==========================================================================
   ADDERVERSE COMMON UTILITIES & SESSION MANAGER (js/common.js)
   ========================================================================== */

// 1. Web Audio Synthesizer
const audioCtx = (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined')
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function playAlertBeep(isSuccess = false) {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (isSuccess) {
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low warning
      osc.frequency.setValueAtTime(164.81, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }
  } catch (e) {}
}

// 2. Student & Spectator Session Management
let currentSession = {
  name: 'Vidhi Chavhan',
  roll: '21CSE045',
  dept: 'CSE',
  sem: '4th',
  role: 'student', // 'student' or 'spectator'
  isLoggedIn: true
};

function loadSession() {
  try {
    const saved = localStorage.getItem('adderverse_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name) {
        currentSession = { ...currentSession, ...parsed };
      }
    }
  } catch (e) {}
  applyNavbarSession();
  return currentSession;
}

function saveSession(data) {
  currentSession = { ...currentSession, ...data, isLoggedIn: true };
  try {
    localStorage.setItem('adderverse_session', JSON.stringify(currentSession));
  } catch (e) {}
  applyNavbarSession();
}

function applyNavbarSession() {
  const nameEl = document.getElementById('student-name-display');
  const metaEl = document.getElementById('student-meta-display');
  const avatarEl = document.getElementById('avatar-circle');

  if (nameEl) nameEl.textContent = currentSession.name;
  if (metaEl) {
    if (currentSession.role === 'spectator') {
      const idTag = currentSession.instructorId || currentSession.roll || 'FAC-8842';
      const roleTag = currentSession.designation || 'Instructor';
      metaEl.textContent = `👨‍🏫 ${idTag} · ${roleTag}`;
    } else {
      metaEl.textContent = `${currentSession.roll} · ${currentSession.dept || 'CSE'}`;
    }
  }
  if (avatarEl) {
    avatarEl.textContent = (currentSession.name || 'A').charAt(0).toUpperCase();
    if (currentSession.role === 'spectator') {
      avatarEl.style.background = 'linear-gradient(135deg, var(--purple), #ec4899)';
    } else {
      avatarEl.style.background = 'linear-gradient(135deg, var(--cyan), var(--purple))';
    }
  }
}

function performLogout() {
  if (!confirm('Log out from this AdderVerse session?')) return;
  try {
    localStorage.removeItem('adderverse_session');
  } catch (e) {}
  window.location.href = 'index.html';
}

// 3. Wiring Alert Modal
function showWiringAlert(title, tag, terminals, message, hint, isSuccess = false) {
  const modal = document.getElementById('wiring-alert-modal');
  const box = document.getElementById('modal-box-theme');
  const titleEl = document.getElementById('alert-modal-title');
  const tagEl = document.getElementById('alert-modal-tag');
  const termEl = document.getElementById('alert-modal-terminals');
  const msgEl = document.getElementById('alert-modal-message');
  const hintEl = document.getElementById('alert-modal-hint');
  const iconEl = document.getElementById('alert-modal-icon');

  if (!modal) {
    alert(`${title}\n${message}\n\n${hint}`);
    return;
  }

  if (isSuccess) {
    box.className = 'alert-modal-box success-theme';
    iconEl.textContent = '✓';
    tagEl.textContent = tag || 'CONNECTION SUCCESS';
  } else {
    box.className = 'alert-modal-box';
    iconEl.textContent = '⚠️';
    tagEl.textContent = tag || 'CIRCUIT FAULT NOTIFICATION';
  }

  titleEl.textContent = title;
  termEl.textContent = terminals;
  msgEl.textContent = message;
  hintEl.textContent = hint;

  modal.classList.add('show');
  playAlertBeep(isSuccess);
}

function dismissWiringAlert() {
  const modal = document.getElementById('wiring-alert-modal');
  if (modal) modal.classList.remove('show');
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSession();
});
