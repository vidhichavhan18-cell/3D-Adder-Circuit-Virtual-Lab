/* ==========================================================================
   DYNAMIC PRACTICE & VIVA VOCE ASSESSMENT (js/practice.js)
   32-Question Engineering Question Bank, Randomized Batches & Certification
   ========================================================================== */

const QUESTION_BANK = [
  {
    q: "Which specific logic gate produces the SUM output in a Half Adder?",
    options: ["AND Gate", "OR Gate", "XOR Gate", "NAND Gate"],
    answer: "XOR Gate",
    exp: "A Half Adder performs binary modulo-2 addition: SUM = A ⊕ B, which corresponds to the standard Exclusive-OR (XOR) logic gate."
  },
  {
    q: "What is the primary architectural difference between a Half Adder and a Full Adder?",
    options: [
      "A Full Adder includes an incoming Carry input (Cin) from a prior lower-order stage",
      "A Half Adder uses twice as many logic gates",
      "A Full Adder can only add inverted binary numbers",
      "A Half Adder produces an active analog output voltage"
    ],
    answer: "A Full Adder includes an incoming Carry input (Cin) from a prior lower-order stage",
    exp: "A Half Adder accepts only 2 binary operand bits (A, B). A Full Adder accepts 3 bits (A, B, and Cin), allowing adders to be cascaded for multi-bit ripple arithmetic."
  },
  {
    q: "For a Full Adder with inputs A = 1, B = 1, and Cin = 1, what are the resulting SUM and COUT outputs?",
    options: [
      "SUM = 0, COUT = 0",
      "SUM = 1, COUT = 0",
      "SUM = 0, COUT = 1",
      "SUM = 1, COUT = 1"
    ],
    answer: "SUM = 1, COUT = 1",
    exp: "Binary addition of 1 + 1 + 1 equals decimal 3, which is 11 in binary representation (SUM = 1, Carry-out = 1)."
  },
  {
    q: "How many 2-input NAND gates are required to construct a single Half Adder circuit from scratch?",
    options: ["3 NAND gates", "4 NAND gates", "5 NAND gates", "7 NAND gates"],
    answer: "5 NAND gates",
    exp: "Synthesizing an XOR gate requires 4 universal NAND gates, and taking the inverted intermediate node for the AND carry output brings the minimum implementation to 5 NAND gates."
  },
  {
    q: "Which standard 74-series TTL integrated circuit contains four 2-input Exclusive-OR (XOR) gates?",
    options: ["74LS00", "74LS04", "74LS08", "74LS86"],
    answer: "74LS86",
    exp: "The 74LS86 IC is a Quadruple 2-input XOR gate. 74LS08 is Quad AND, 74LS32 is Quad OR, and 74LS00 is Quad NAND."
  },
  {
    q: "In standard breadboard testing, what happens if two active logic gate outputs are shorted directly together?",
    options: [
      "Their voltages average safely to +2.5V without any effect",
      "Bus contention occurs, drawing destructive current that can burn out output transistors",
      "The circuit automatically converts to a Schmitt trigger",
      "The clock frequency doubles across the IC"
    ],
    answer: "Bus contention occurs, drawing destructive current that can burn out output transistors",
    exp: "Connecting two push-pull outputs directly (one driving HIGH +5V and one driving LOW 0V) creates a near-zero resistance short path to ground, destroying the output totem-pole stage."
  },
  {
    q: "A Full Adder circuit can be constructed using which combination of building blocks?",
    options: [
      "Two Half Adders and one OR gate",
      "One Half Adder and two OR gates",
      "Three Half Adders and one AND gate",
      "Two Multiplexers and one Inverter"
    ],
    answer: "Two Half Adders and one OR gate",
    exp: "Standard combinational hierarchy: The first Half Adder adds A and B (yielding X1 and C1). The second Half Adder adds X1 and Cin (yielding SUM and C2). An OR gate combines C1 and C2 into Cout."
  },
  {
    q: "What is the boolean logic equation for the CARRY output in a Half Adder?",
    options: ["CARRY = A + B", "CARRY = A · B", "CARRY = A ⊕ B", "CARRY = (A + B)'"],
    answer: "CARRY = A · B",
    exp: "A carry bit is generated only when both binary inputs A and B are simultaneously 1, which represents the logical AND operation (A · B)."
  },
  {
    q: "What is the carry-out equation (Cout) for a Full Adder in terms of inputs A, B, and Cin?",
    options: [
      "Cout = AB + Cin(A ⊕ B)",
      "Cout = (A ⊕ B) + Cin",
      "Cout = A · B · Cin",
      "Cout = A'B + AB'"
    ],
    answer: "Cout = AB + Cin(A ⊕ B)",
    exp: "Cout is 1 if both A and B are 1 (generate condition: AB), or if an incoming carry is propagated through the XOR stage (Cin · (A ⊕ B))."
  },
  {
    q: "What is the decimal equivalent of the binary outputs SUM = 0, CARRY = 1 produced by a Half Adder when A = 1 and B = 1?",
    options: ["Decimal 1", "Decimal 2", "Decimal 3", "Decimal 0"],
    answer: "Decimal 2",
    exp: "In positional binary notation, CARRY represents the 2s place and SUM represents the 1s place: (1 × 2¹) + (0 × 2⁰) = 2 in decimal."
  },
  {
    q: "Why is a Half Adder insufficient for cascading multi-bit addition (e.g. 4-bit, 8-bit, 16-bit)?",
    options: [
      "It cannot handle negative numbers",
      "It has no input pin to accept the carry generated by the previous lower-order bit stage",
      "Its output current is too low for TTL standards",
      "It generates a square wave instead of a constant DC voltage"
    ],
    answer: "It has no input pin to accept the carry generated by the previous lower-order bit stage",
    exp: "Multi-bit ripple carry addition requires each subsequent bit position (Bit 1, Bit 2, etc.) to sum operand bits together with the overflow carry from the right adjacent bit. Only a Full Adder possesses this Cin terminal."
  },
  {
    q: "What is the primary function of the solderless breadboard center trench (divider channel)?",
    options: [
      "To route cooling airflow under the circuit",
      "To electrically isolate opposite pin banks of Dual-In-Line (DIP) IC packages",
      "To supply negative reference voltage",
      "To anchor mechanical tie screws"
    ],
    answer: "To electrically isolate opposite pin banks of Dual-In-Line (DIP) IC packages",
    exp: "Dual In-line Package (DIP) ICs straddle the center channel so that pins 1-7 on one side and pins 8-14 on the other side do not short together across the breadboard's internal tie-clips."
  }
];

let currentQuizBatch = [];
let studentAnswers = {};
let quizAttemptNumber = 1;

function generateNewQuizBatch() {
  quizAttemptNumber++;
  studentAnswers = {};
  
  const resultsBanner = document.getElementById('quiz-results-banner');
  if (resultsBanner) resultsBanner.style.display = 'none';

  const certBox = document.getElementById('student-certificate-box');
  if (certBox) certBox.style.display = 'none';

  const label = document.getElementById('quiz-attempt-label');
  if (label) label.textContent = `Assessment Set #${quizAttemptNumber}`;

  // Shuffle and pick 8
  const shuffledBank = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
  const selected = shuffledBank.slice(0, 8);

  currentQuizBatch = selected.map(q => {
    const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
    const newAnswerIndex = shuffledOptions.indexOf(q.answer);
    return {
      q: q.q,
      options: shuffledOptions,
      answer: newAnswerIndex,
      exp: q.exp
    };
  });

  renderQuizQuestions();
}

function renderQuizQuestions() {
  const container = document.getElementById('quiz-questions-list');
  if (!container) return;

  container.innerHTML = currentQuizBatch.map((item, qIdx) => `
    <div class="question-card" id="q-card-${qIdx}">
      <div class="question-header">
        <span class="question-num-tag">Q${qIdx + 1}</span>
        <h4 class="question-title-text">${item.q}</h4>
      </div>
      <div class="options-list">
        ${item.options.map((opt, optIdx) => `
          <div class="option-item" id="opt-${qIdx}-${optIdx}" onclick="selectQuizOption(${qIdx}, ${optIdx})">
            <span class="option-radio"></span>
            <span>${opt}</span>
          </div>
        `).join('')}
      </div>
      <div class="question-feedback-box" id="feedback-q-${qIdx}">
        <strong>Rationale:</strong> ${item.exp}
      </div>
    </div>
  `).join('');
}

function selectQuizOption(qIdx, optIdx) {
  studentAnswers[qIdx] = optIdx;
  
  currentQuizBatch[qIdx].options.forEach((_, i) => {
    const optEl = document.getElementById(`opt-${qIdx}-${i}`);
    if (optEl) optEl.classList.remove('selected');
  });

  const selectedEl = document.getElementById(`opt-${qIdx}-${optIdx}`);
  if (selectedEl) selectedEl.classList.add('selected');

  const card = document.getElementById(`q-card-${qIdx}`);
  if (card) card.classList.add('answered');
}

function submitAssessmentQuiz() {
  const total = currentQuizBatch.length;
  let score = 0;

  currentQuizBatch.forEach((item, qIdx) => {
    const userChoice = studentAnswers[qIdx];
    const isCorrect = userChoice === item.answer;
    if (isCorrect) score++;

    item.options.forEach((_, optIdx) => {
      const optEl = document.getElementById(`opt-${qIdx}-${optIdx}`);
      if (!optEl) return;
      optEl.classList.remove('selected');
      if (optIdx === item.answer) {
        optEl.classList.add('correct');
      } else if (userChoice === optIdx) {
        optEl.classList.add('incorrect');
      }
    });

    const fBox = document.getElementById(`feedback-q-${qIdx}`);
    if (fBox) fBox.style.display = 'block';
  });

  const banner = document.getElementById('quiz-results-banner');
  if (banner) banner.style.display = 'block';

  const scoreText = document.getElementById('score-val-text');
  if (scoreText) scoreText.textContent = score;

  const badge = document.getElementById('score-badge-element');
  const feedback = document.getElementById('score-feedback-text');

  if (badge && feedback) {
    if (score === total) {
      badge.className = 'score-badge-pill badge-excellent';
      badge.textContent = '🏆 100% Perfect Score · Grade A+';
      feedback.textContent = 'Flawless performance! You demonstrated complete conceptual mastery of both Half and Full Adder combinational logic.';
      playAlertBeep(true);
    } else if (score >= 5) {
      badge.className = 'score-badge-pill badge-pass';
      badge.textContent = '✓ Viva Passed · High Proficiency';
      feedback.textContent = 'Well done! Review the highlighted rationale cards for the questions you missed.';
      playAlertBeep(true);
    } else {
      badge.className = 'score-badge-pill badge-review';
      badge.textContent = '📖 Review Recommended';
      feedback.textContent = 'Revisit the 3D Half and Full Adder laboratories to observe gate propagation, then generate a new question set.';
      playAlertBeep(false);
    }
  }

  // Display Certificate
  const certBox = document.getElementById('student-certificate-box');
  if (certBox) {
    certBox.style.display = 'block';
    
    // Fill student metadata
    const certName = document.getElementById('cert-student-name');
    const certRoll = document.getElementById('cert-student-roll');
    const certDept = document.getElementById('cert-student-dept');
    const certTime = document.getElementById('cert-timestamp');

    if (certName) certName.textContent = currentSession.name || 'Student';
    if (certRoll) certRoll.textContent = currentSession.roll || '21CSE045';
    if (certDept) certDept.textContent = currentSession.dept || 'CSE';
    if (certTime) certTime.textContent = `Verification Timestamp: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

    // Check if instructor previously stamped the certificate
    try {
      const savedStamp = localStorage.getItem('adderverse_certificate_stamp');
      if (savedStamp) {
        const stamp = JSON.parse(savedStamp);
        const stampBox = document.getElementById('cert-instructor-stamp-box');
        const details = document.getElementById('cert-instructor-details');
        if (stampBox && details) {
          stampBox.style.display = 'block';
          details.innerHTML = `Verified by: <strong style="color:var(--text);">${stamp.instructorName}</strong> &nbsp;·&nbsp; Evaluation: <span style="color:var(--green); font-weight:700;">${stamp.verdict.replace('_', ' ')}</span> &nbsp;·&nbsp; Mode: <em>Spectator Remote Verification</em>`;
        }
      }
    } catch(e) {}

    window.scrollTo({ top: banner.offsetTop - 80, behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  generateNewQuizBatch();
});
