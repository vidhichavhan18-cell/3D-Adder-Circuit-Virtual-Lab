# Project Title

AdderVerse: 3D Interactive Adder Circuit Virtual Laboratory with Multi-User Instructor Spectator Mode

### Problem Statement Fit

This project addresses the Virtual Laboratory Simulation for STEM / Digital Logic & Electronics Education problem statement, focusing on realistic physical breadboard hardware simulation and the mandatory Multi-User Review: Spectator Mode capability.

In conventional engineering education, students encounter a steep barrier transitioning from theoretical Boolean equations to physical hardware breadboarding using 74-series Integrated Circuits. Furthermore, instructors lack real-time visibility into students' hands-on wiring procedures during remote or asynchronous laboratory sessions, making remote lab evaluations difficult, subjective, and prone to undetected wiring faults.

AdderVerse directly addresses the problem statement through three core capabilities:
1. Physical 3D Breadboard Wiring: Students construct functional Half Adder and Full Adder circuits in an interactive 3D WebGL environment using authentic DIP IC packages (7486 XOR, 7408 AND, 7432 OR), mechanical toggle switches, and jumper wires with active electrical short-circuit protection.
2. Multi-User Review and Spectator Mode: As mandated by the problem statement, the simulation provides a dedicated Spectator Mode where an instructor can observe a student's wiring progress in real time across the network and remotely trigger specific input sequences to evaluate dynamic circuit responses and truth table accuracy.
3. Automated Diagnostic Verification: Instructors can remotely execute complete automated test sequences, observe resulting Sum and Carry outputs on the student's board, and stamp the student's completion certificate with authenticated evaluation remarks.

### Target Users

AdderVerse is designed for three primary user segments:
- Undergraduate Engineering and Polytechnic Students: Students in Computer Science (CSE), Artificial Intelligence & Data Science (AI&DS), Information Technology (IT), and Electrical/Electronics Engineering studying Digital Logic Design and Computer Architecture.
- Instructors, Professors, and Lab Demonstrators: Educators conducting remote tutorials, synchronous lab evaluations, viva voce assessments, and live classroom demonstrations.
- Self-Paced Learners and Exam Candidates: Students preparing for practical lab examinations, viva voce defense, and technical interviews.

Key user pain points addressed:
- Lack of Laboratory Hardware Access: Eliminates physical equipment dependency with instant browser-based 3D access, enabling unlimited practice outside campus lab hours.
- Instructor Inability to Audit Remote Wiring: Solved via live Spectator Mode syncing student jumper placements, node connectivity, and electrical continuity.
- Silent Failures and Component Damage: In physical labs, short circuits (such as output-to-output contention) permanently damage ICs; AdderVerse intercepts these errors with synthesized audio-visual alarms and diagnostic guidance.
- Disconnect Between Gate Symbols and Physical DIP Pinouts: Bridges the gap between abstract floating logic gate symbols and realistic 14-pin dual-in-line chip configurations with VCC on pin 14 and GND on pin 7.

### What We Built

During the event, we designed and built AdderVerse—a high-performance, WebGL-accelerated 3D virtual laboratory for learning, wiring, simulating, and evaluating binary adder circuits with real-time multi-user instructor supervision.

The platform consists of five integrated subsystems:
1. Interactive 3D Virtual Breadboard Workbench: A Three.js physical breadboard with Quad 2-input XOR (7486), Quad 2-input AND (7408), and Quad 2-input OR (7432) DIP packages, interactive toggle levers, procedural curved jumper wires with raycast terminal snapping, and glowing emissive LEDs.
2. Multi-User Spectator Mode and Remote Testing Suite: An instructor observation interface utilizing the native BroadcastChannel API and cross-tab/cross-window event synchronization. Instructors can monitor student wire progress live, trigger specific binary test vectors remotely, run automated diagnostic sequences, and issue verified evaluation stamps.
3. Active Electrical Fault and Short-Circuit Notification Engine: A topological netlist validator that prevents dangerous electrical connections (such as Output-to-Output contention, power rail shorting, or improper pin mappings) with synthesized Web Audio alarms and diagnostic modal dialogs.
4. Deterministic Real-Time Logic Engine: Dynamic combinational boolean solver driving synchronized 3D LED illuminations and automated truth table row tracking.
5. Interactive Viva Voce and Verification Suite: Dynamic 32-question engineering quiz bank with randomized batches, immediate scoring, question rationale cards, and an official laboratory completion credential capable of receiving digital instructor verification stamps.

### Core Features

- Interactive 3D Breadboard and Jumper Wiring: Full 3D orbital camera controls (rotate, pan, zoom) with terminal pin raycasting, procedural 3D bezier jumper wire extrusion, color-coded signals, and pin-to-pin electrical validation.
- Multi-User Review and Instructor Spectator Mode: A specialized mode enabling instructors to observe a student's wiring progress live, including connected jumpers, wire topology, and circuit status. Instructors can remotely trigger individual binary input vectors on the student's board to test circuit responses and execute automated test sequences.
- Automated Diagnostic Test Sequences: 1-click remote evaluation suite that cycles through all binary test combinations on the student's circuit, verifies outputs against expected logic states, and computes an automated verification score.
- Intelligent Fault Notification and Short-Circuit Protection: Automatic real-time electrical rule validation that detects invalid connections, such as shorting logic outputs or connecting gates incorrectly, triggering a Web Audio synthesized alert buzzer and modal dialog explaining the physical electronic hazard.
- Real-Time Half and Full Adder Simulation with Truth Table Row Tracking: Instantaneous combinational logic simulation for Half Adders and Full Adders, with real-time glowing 3D LEDs and synchronous truth table row highlighting.
- Automated State Sequencing and Reference Auto-Wiring: An automated sequencer that iterates through all binary states alongside a 1-click auto-wire reference feature for guided learning.
- Dual 3D Physical and 2D Schematic View Modes: Seamless toggle between physical 3D breadboard layout and clean 2D ANSI/IEEE logic gate schematics.
- Viva Voce Assessment and Verified Certificate Stamping: 32-question engineering quiz bank generating 8 randomized questions with immediate grading, rationale explanations, and an official laboratory certificate capable of receiving instructor verification stamps.

### Technical Architecture

AdderVerse is designed around a modular, reactive, client-side event-driven architecture that runs entirely in modern web browsers without requiring backend servers, third-party plugins, or database dependencies.

The system is organized into decoupled layers:
The presentation layer is powered by Three.js WebGL rendering, managing a custom scene graph composed of the laboratory workbench, breadboard chassis, 14-pin dual-in-line IC packages with notch orientation indicators, mechanical input toggle switches, and emissive LED domes. Camera navigation is handled through OrbitControls with spherical damping, and user wire creation operates via raycasting against interactive terminal pin meshes, generating smooth procedural 3D curves between connection points.

The core logic and simulation layer consists of two cooperating engines: a topological netlist validator and a deterministic combinational logic solver. When a student places a jumper wire, the netlist validator inspects the terminal identifiers, confirms valid driver-to-receiver polarity, verifies that VCC and ground rails are correctly routed, and halts evaluation if an illegal bridge (such as output-to-output bus contention) is detected. Once the circuit loop is verified as closed and electrically sound, the boolean solver computes instantaneous Sum and Carry outputs, synchronizing both the 3D LED material emissions and the highlighted rows of the live HTML truth table.

The multi-user synchronization layer enables the Spectator Mode without server overhead by leveraging the browser BroadcastChannel API paired with window storage event listeners. The student workbench broadcasts lightweight state packets containing current wire netlists, terminal counts, and switch configurations. The instructor console receives these packets in real time to render an inspection HUD showing wiring percentage and circuit health. In reverse, instructors dispatch remote trigger commands containing binary input vectors; the student client intercepts these commands, updates the physical 3D switch orientations, executes the logic solver, and transmits verified output states back to the instructor.

Sound synthesis is handled through native browser Web Audio API contexts, utilizing procedural oscillator nodes and gain envelopes to produce realistic mechanical toggle clicks and dual-tone dissonant alert buzzers without external audio asset downloads. Assessment and certification are managed by a client-side module using Fisher-Yates array randomization to generate unique 8-question tests from a 32-question viva bank, rendering verified completion credentials upon faculty sign-off.

### Tech Stack

- Frontend and User Interface: HTML5, Modern CSS3 with CSS Grid, Flexbox, Custom Properties, Glassmorphism, and Vanilla JavaScript (ES6+ modular).
- 3D Graphics and WebGL Rendering: Three.js (r128), OrbitControls, Raycasting, Spline Geometry Extrusion.
- Multi-User Synchronization: Browser BroadcastChannel API, LocalStorage Cross-Window Event Bus.
- Audio Synthesis: Web Audio API (AudioContext, OscillatorNode, GainNode).
- Typography and Branding: Custom AdderVerse Branding Logo, Google Fonts (Inter, JetBrains Mono).
- Deployment and Version Control: Git, GitHub, CreatorCode CLI (AWS S3 Cloud Hosting).

### Innovation / Uniqueness

- Integrated Multi-User Review (Spectator Mode): Unlike standalone simulators where work is isolated, AdderVerse allows an instructor or peer to spectate live wiring progress and remotely inject test signals into the student's running circuit.
- Bridging Schematic to Physical Breadboard: Students work directly with realistic 14-pin dual-in-line ICs (7486, 7408, 7432), learning real-world pin numbering and chip orientation instead of abstract floating gates.
- Active Pedagogical Fault Prevention: Rather than silently producing incorrect outputs or burning physical components, the system intercepts short circuits and invalid connections with immediate audio-visual feedback explaining why the connection causes physical damage.
- 100% Client-Side and Zero-Setup: Runs out of the box in any modern browser with offline local script fallbacks, requiring no server installation, database setup, or browser extensions.

### Demo Instructions

Judges can test the application and its Spectator Mode in under 2 minutes:

1. Launch AdderVerse: Open index.html in your web browser (or via VS Code Live Server).
2. Student Login: Click "1-Click Student Demo" on the onboarding screen to enter with a pre-configured student profile (Vidhi Chavhan, 21CSE045).
3. Test 3D Wiring and Auto-Wire: Navigate to Half Adder 3D. Click "Auto-Wire Reference" in the top toolbar to see all 6 jumpers connect in 3D.
4. Test Electrical Fault Alert (Optional): Click "Clear Wires", then attempt an invalid connection (e.g. Switch A Output to Switch B Output) to witness the active Fault Notification Modal with buzzer audio.
5. Open Spectator Mode: Click the "Spectator Mode" button in the top navigation bar to slide open the Instructor Spectator & Review Panel. Notice the live student details, wire progress (6 / 6 Connected, 100%), and operational status.
6. Trigger Remote Test Sequences (Problem Statement Feature): In the Spectator Panel under Remote Input Sequences & Testing, click any test vector button (e.g., A=1, B=1). Observe the 3D toggle levers flip on the student's board, LEDs update (Carry LED glows Amber, Sum LED turns off), and the Instructor Panel displays instant verification feedback: Expected: Sum=0, Carry=1 | Actual: Sum=0, Carry=1 -> TEST VECTOR VERIFIED. Click "Run Automated Test Sequence" to watch the instructor panel cycle through all 4 test vectors automatically and output a 100% pass score.
7. Stamp Certificate: In the Spectator panel, click "Stamp & Sign Student Certificate". Navigate to Practice & Viva to view the verified Laboratory Completion Certificate bearing the official instructor verification stamp.

### Known Limitations

- Dedicated Circuit Topologies: Optimized specifically for Half Adder and Full Adder configurations; arbitrary freeform custom circuit creation is reserved for future expansion.
- Digital Logic Idealization: Simulates combinational boolean states (0 and 1) without modeling analog transient characteristics such as gate propagation delays (10ns) or thermal dissipation.
- Local Multi-Window Scope: Multi-user spectator sync operates via browser BroadcastChannel and local storage events across tabs/windows on the same machine; cloud WebRTC peer-to-peer room routing is planned for multi-campus connectivity.

### Future Work

- Cloud WebRTC Relay for Global Classrooms: Expand the Spectator Mode to WebRTC peer rooms enabling instructors to spectate students over the public internet with zero server overhead.
- Expanded IC Library and Freeform Sandbox: Add Subtractor circuits, 4-Bit Ripple Carry Adders (74283), Multiplexers (74151), and Sequential Flip-Flop ICs.
- Waveform Timing and Virtual Oscilloscope: Integrate interactive timing diagram probes to measure propagation delays and hazard glitches.
- LMS Gradebook Integration: Enable automated score synchronization with Canvas, Blackboard, and Moodle via LTI standards.
