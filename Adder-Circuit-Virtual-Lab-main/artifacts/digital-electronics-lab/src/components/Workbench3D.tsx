import {
  Box,
  Cable,
  CheckCircle2,
  CircleAlert,
  Eye,
  Grid3X3,
  Lightbulb,
  MonitorUp,
  MousePointer2,
  Play,
  Plug,
  Radio,
  RotateCcw,
  Trash2,
  Wifi,
  XCircle,
} from 'lucide-react';
import ThreeDScene from './ThreeDScene';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

export type BenchMode = 'half' | 'full';
export type BenchInputState = { a: boolean; b: boolean; cin: boolean };
export type BenchValues = {
  a: number;
  b: number;
  cin: number;
  x1: number;
  c1: number;
  c2: number;
  sum: number;
  carry: number;
};

type GateKind = 'XOR' | 'AND' | 'OR';
type PinKind = 'input' | 'output';
type Pin = { id: string; owner: string; label: string; kind: PinKind };
export type BenchWire = { id: string; from: string; to: string };
export type BenchGate = { id: string; kind: GateKind; x: number; y: number };
type Wire = BenchWire;
type GateNode = BenchGate;

export type BenchStatus = {
  ready: boolean;
  fault: string | null;
  wireCount: number;
};

type WorkbenchProps = {
  mode: BenchMode;
  inputs: BenchInputState;
  values: BenchValues;
  onSetInputs: (next: BenchInputState) => void;
  onStatusChange: (status: BenchStatus) => void;
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 510;
const GATE_WIDTH = 112;
const GATE_HEIGHT = 70;

function gatePins(node: GateNode): Pin[] {
  const inputs = node.kind === 'OR' ? ['C1', 'C2'] : node.kind === 'XOR' && node.id === 'xor-2' ? ['X1', 'Cin'] : node.kind === 'AND' && node.id === 'and-2' ? ['X1', 'Cin'] : ['A', 'B'];
  return [
    ...inputs.map((label) => ({ id: `${node.id}-in-${label.toLowerCase()}`, owner: node.id, label, kind: 'input' as const })),
    { id: `${node.id}-out`, owner: node.id, label: node.id === 'or-1' ? 'CARRY' : node.id.toUpperCase(), kind: 'output' as const },
  ];
}

function defaultGates(mode: BenchMode): GateNode[] {
  if (mode === 'half') {
    return [
      { id: 'xor-1', kind: 'XOR', x: 390, y: 170 },
      { id: 'and-1', kind: 'AND', x: 390, y: 330 },
    ];
  }
  return [
    { id: 'xor-1', kind: 'XOR', x: 265, y: 130 },
    { id: 'and-1', kind: 'AND', x: 265, y: 325 },
    { id: 'xor-2', kind: 'XOR', x: 510, y: 130 },
    { id: 'and-2', kind: 'AND', x: 510, y: 325 },
    { id: 'or-1', kind: 'OR', x: 725, y: 325 },
  ];
}

function defaultWires(mode: BenchMode): Wire[] {
  const half = [
    ['switch-a-out', 'xor-1-in-a'],
    ['switch-b-out', 'xor-1-in-b'],
    ['switch-a-out', 'and-1-in-a'],
    ['switch-b-out', 'and-1-in-b'],
    ['xor-1-out', 'led-sum-in'],
    ['and-1-out', 'led-carry-in'],
  ];
  const full = [
    ['switch-a-out', 'xor-1-in-a'],
    ['switch-b-out', 'xor-1-in-b'],
    ['switch-a-out', 'and-1-in-a'],
    ['switch-b-out', 'and-1-in-b'],
    ['xor-1-out', 'xor-2-in-x1'],
    ['switch-cin-out', 'xor-2-in-cin'],
    ['xor-1-out', 'and-2-in-x1'],
    ['switch-cin-out', 'and-2-in-cin'],
    ['and-1-out', 'or-1-in-c1'],
    ['and-2-out', 'or-1-in-c2'],
    ['xor-2-out', 'led-sum-in'],
    ['or-1-out', 'led-carry-in'],
  ];
  return (mode === 'half' ? half : full).map(([from, to], index) => ({ id: `wire-${index}-${from}-${to}`, from, to }));
}

function requiredConnections(mode: BenchMode): Array<[string, string]> {
  return defaultWires(mode).map((wire) => [wire.from, wire.to]);
}

function pinCoordinates(mode: BenchMode, gates: GateNode[], pinId: string) {
  const sourceY = mode === 'half' ? { a: 158, b: 325 } : { a: 92, b: 260, cin: 430 };
  const ledY = mode === 'half' ? { sum: 170, carry: 330 } : { sum: 130, carry: 325 };
  if (pinId === 'switch-a-out') return { x: 145, y: sourceY.a };
  if (pinId === 'switch-b-out') return { x: 145, y: sourceY.b };
  if (pinId === 'switch-cin-out') return { x: 145, y: sourceY.cin ?? 430 };
  if (pinId === 'led-sum-in') return { x: 855, y: ledY.sum };
  if (pinId === 'led-carry-in') return { x: 855, y: ledY.carry };

  const node = gates.find((gate) => pinId.startsWith(`${gate.id}-`));
  if (!node) return { x: 0, y: 0 };
  const pin = gatePins(node).find((item) => item.id === pinId);
  if (!pin) return { x: node.x, y: node.y };
  if (pin.kind === 'output') return { x: node.x + GATE_WIDTH / 2, y: node.y };
  const isSecond = pin.label === 'B' || pin.label === 'Cin' || pin.label === 'C2';
  return { x: node.x - GATE_WIDTH / 2, y: node.y + (isSecond ? 17 : -17) };
}

function sourceValue(pinId: string, inputs: BenchInputState) {
  if (pinId === 'switch-a-out') return inputs.a;
  if (pinId === 'switch-b-out') return inputs.b;
  if (pinId === 'switch-cin-out') return inputs.cin;
  return false;
}

function outputValue(pinId: string, values: BenchValues) {
  if (pinId === 'xor-1-out') return Boolean(values.x1);
  if (pinId === 'and-1-out') return Boolean(values.c1);
  if (pinId === 'xor-2-out') return Boolean(values.sum);
  if (pinId === 'and-2-out') return Boolean(values.c2);
  if (pinId === 'or-1-out') return Boolean(values.carry);
  return false;
}

function Workbench3D({ mode, inputs, values, onSetInputs, onStatusChange }: WorkbenchProps) {
  const [gates, setGates] = useState(() => defaultGates(mode));
  const [wires, setWires] = useState(() => defaultWires(mode));
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [fault, setFault] = useState<string | null>(null);
  const [activity, setActivity] = useState<string[]>(['Reference wiring loaded. Drag a gate or select any pin to inspect the path.']);
  const [spectator, setSpectator] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [immersiveMessage, setImmersiveMessage] = useState('WebXR-ready scene');
  const [libraryPulse, setLibraryPulse] = useState<GateKind | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const required = useMemo(() => requiredConnections(mode), [mode]);
  const missingConnections = useMemo(
    () => required.filter(([from, to]) => !wires.some((wire) => wire.from === from && wire.to === to)),
    [required, wires],
  );
  const ready = missingConnections.length === 0 && !fault;

  useEffect(() => {
    const nextGates = defaultGates(mode);
    setGates(nextGates);
    setWires(defaultWires(mode));
    setSelectedPin(null);
    setFault(null);
    setReviewing(false);
    setActivity([`${mode === 'half' ? 'Half' : 'Full'} Adder reference bench loaded.`]);
  }, [mode]);

  useEffect(() => {
    onStatusChange({ ready, fault, wireCount: wires.length });
  }, [fault, onStatusChange, ready, wires.length]);

  useEffect(() => {
    if (!reviewing) return undefined;
    const sequence = mode === 'half'
      ? [{ a: false, b: false, cin: false }, { a: false, b: true, cin: false }, { a: true, b: false, cin: false }, { a: true, b: true, cin: false }]
      : [
        { a: false, b: false, cin: false },
        { a: false, b: false, cin: true },
        { a: false, b: true, cin: false },
        { a: false, b: true, cin: true },
        { a: true, b: false, cin: false },
        { a: true, b: false, cin: true },
        { a: true, b: true, cin: false },
        { a: true, b: true, cin: true },
      ];
    let index = 0;
    onSetInputs(sequence[index]);
    const timer = window.setInterval(() => {
      index = (index + 1) % sequence.length;
      onSetInputs(sequence[index]);
    }, 900);
    return () => window.clearInterval(timer);
  }, [mode, onSetInputs, reviewing]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const board = document.querySelector<HTMLElement>('[data-workbench-stage]');
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const nextX = Math.max(100, Math.min(900, ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH - drag.offsetX));
      const nextY = Math.max(70, Math.min(440, ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT - drag.offsetY));
      const snappedX = Math.round(nextX / 25) * 25;
      const snappedY = Math.round(nextY / 25) * 25;
      setGates((current) => current.map((gate) => gate.id === drag.id ? { ...gate, x: snappedX, y: snappedY } : gate));
    };
    const up = () => {
      if (dragRef.current) {
        const gate = gates.find((item) => item.id === dragRef.current?.id);
        if (gate) appendActivity(`Snapped ${gate.kind} gate to the breadboard grid.`);
      }
      dragRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [gates]);

  function appendActivity(message: string) {
    setActivity((current) => [message, ...current].slice(0, 5));
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>, gate: GateNode) {
    const board = event.currentTarget.closest<HTMLElement>('[data-workbench-stage]');
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;
    dragRef.current = { id: gate.id, offsetX: x - gate.x, offsetY: y - gate.y };
    event.preventDefault();
  }

  function createWire(firstPinId: string, secondPinId: string) {
    const first = getPin(firstPinId);
    const second = getPin(secondPinId);
    if (!first || !second) return;
    if (first.kind === second.kind) {
      setFault(first.kind === 'output' ? 'Incorrect Connection: two output pins cannot be joined.' : 'Incorrect Connection: two input pins cannot share a jumper.');
      appendActivity('Fault: incompatible pin types selected.');
      setSelectedPin(null);
      return;
    }
    const from = first.kind === 'output' ? first.id : second.id;
    const to = first.kind === 'input' ? first.id : second.id;
    if (wires.some((wire) => wire.to === to)) {
      setFault(`Incorrect Connection: ${getPin(to)?.label ?? 'input'} is already occupied.`);
      appendActivity(`Fault: ${getPin(to)?.label ?? 'input'} input already has a wire.`);
      setSelectedPin(null);
      return;
    }
    setWires((current) => [...current, { id: `wire-${Date.now()}-${from}-${to}`, from, to }]);
    setFault(null);
    appendActivity(`Jumper connected: ${getPin(from)?.label ?? from} → ${getPin(to)?.label ?? to}.`);
    setSelectedPin(null);
  }

  function getPin(pinId: string): Pin | undefined {
    if (pinId === 'switch-a-out') return { id: pinId, owner: 'switch-a', label: 'A', kind: 'output' };
    if (pinId === 'switch-b-out') return { id: pinId, owner: 'switch-b', label: 'B', kind: 'output' };
    if (pinId === 'switch-cin-out') return { id: pinId, owner: 'switch-cin', label: 'Cin', kind: 'output' };
    if (pinId === 'led-sum-in') return { id: pinId, owner: 'led-sum', label: 'SUM', kind: 'input' };
    if (pinId === 'led-carry-in') return { id: pinId, owner: 'led-carry', label: 'CARRY', kind: 'input' };
    for (const gate of gates) {
      const pin = gatePins(gate).find((item) => item.id === pinId);
      if (pin) return pin;
    }
    return undefined;
  }

  function handlePinClick(pinId: string) {
    setFault(null);
    if (!selectedPin) {
      setSelectedPin(pinId);
      appendActivity(`Pin selected: ${getPin(pinId)?.label ?? pinId}. Select a destination pin.`);
      return;
    }
    if (selectedPin === pinId) {
      setSelectedPin(null);
      return;
    }
    createWire(selectedPin, pinId);
  }

  function resetScene() {
    setGates(defaultGates(mode));
    setWires(defaultWires(mode));
    setSelectedPin(null);
    setFault(null);
    appendActivity('Reference layout restored with all required jumpers.');
  }

  function clearWires() {
    setWires([]);
    setSelectedPin(null);
    setFault('Required input floating: connect each highlighted pin before running the circuit.');
    appendActivity('All jumper wires removed. The logic engine is waiting for a complete path.');
  }

  function placeGate(kind: GateKind) {
    setLibraryPulse(kind);
    window.setTimeout(() => setLibraryPulse(null), 350);
    const spare = { id: `spare-${kind.toLowerCase()}-${Date.now()}`, kind, x: 240 + (gates.length % 3) * 180, y: 450 };
    setGates((current) => [...current, spare]);
    appendActivity(`${kind} gate placed from the component library. Drag it onto a snapped hole.`);
  }

  async function enterImmersiveView() {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported?: (mode: string) => Promise<boolean>; requestSession?: (mode: string) => Promise<{ end: () => Promise<void>; addEventListener?: (type: string, listener: () => void) => void }> } }).xr;
    if (!xr?.requestSession) {
      setImmersiveMessage('Browser preview · WebXR not available');
      appendActivity('Immersive view is unavailable in this browser; the responsive bench remains active.');
      return;
    }
    try {
      const supported = xr.isSessionSupported ? await xr.isSessionSupported('immersive-vr') : true;
      if (!supported) {
        setImmersiveMessage('WebXR device not detected');
        return;
      }
      const session = await xr.requestSession('immersive-vr');
      setImmersiveMessage('Immersive session active');
      session.addEventListener?.('end', () => setImmersiveMessage('WebXR-ready scene'));
    } catch {
      setImmersiveMessage('Immersive request cancelled');
    }
  }

  const sourcePins = mode === 'half'
    ? [
      { id: 'switch-a-out', label: 'A', value: inputs.a, y: 158 },
      { id: 'switch-b-out', label: 'B', value: inputs.b, y: 325 },
    ]
    : [
      { id: 'switch-a-out', label: 'A', value: inputs.a, y: 92 },
      { id: 'switch-b-out', label: 'B', value: inputs.b, y: 260 },
      { id: 'switch-cin-out', label: 'Cin', value: inputs.cin, y: 430 },
    ];

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0d1721] shadow-[0_20px_65px_rgba(3,10,18,.35)]" aria-label="3D procedural component workbench">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[.08] bg-[#111d29] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/[.08] text-cyan-300"><Box size={17} /></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">3D Component Workbench</h2>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-emerald-300">60 FPS target</span>
            </div>
            <p className="mono mt-1 text-[10px] uppercase tracking-[.15em] text-slate-500">Breadboard / procedural wiring / {mode === 'half' ? 'half adder' : 'full adder'} module</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setSpectator((current) => !current)} className={`focus-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-medium uppercase tracking-wider transition ${spectator ? 'border-violet-300/40 bg-violet-300/10 text-violet-200' : 'border-white/[.1] text-slate-400 hover:text-slate-200'}`} aria-pressed={spectator}>
            <Eye size={13} /> {spectator ? 'Spectator on' : 'Spectator mode'}
          </button>
          <button type="button" onClick={enterImmersiveView} className="focus-ring flex items-center gap-2 rounded-lg border border-white/[.1] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-200">
            <MonitorUp size={13} /> Immersive view
          </button>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[.16em] text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Scene live</span>
              <span className="flex items-center gap-1.5"><Grid3X3 size={12} /> Snap grid 25 px</span>
              <span className="flex items-center gap-1.5"><Wifi size={12} /> {immersiveMessage}</span>
            </div>
            <span className="mono text-[10px] text-slate-600">DRAG GATES · CLICK PINS TO WIRE</span>
          </div>

          <ThreeDScene
            mode={mode}
            inputs={inputs}
            values={values}
            gates={gates}
            wires={wires}
            selectedPin={selectedPin}
            onToggleInput={(name) => onSetInputs({ ...inputs, [name]: !inputs[name] })}
            onPinClick={handlePinClick}
          />

          <div className="my-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[.15em] text-slate-600">
            <span className="flex items-center gap-2"><Cable size={12} /> Procedural wiring map</span>
            <span>Use this view for exact pin selection</span>
          </div>

          <div data-workbench-stage className="workbench-stage relative overflow-hidden rounded-xl border border-cyan-200/10 bg-[#08111a]" style={{ aspectRatio: `${VIEWBOX_WIDTH} / ${VIEWBOX_HEIGHT}` }}>
            <div className="workbench-breadboard absolute inset-[3%] rounded-[18px] border border-white/[.06] opacity-80" />
            <div className="workbench-hole-field pointer-events-none absolute inset-[6%] opacity-50" />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} role="img" aria-label="Jumper wires connecting logic gate pins">
              {wires.map((wire) => {
                const from = pinCoordinates(mode, gates, wire.from);
                const to = pinCoordinates(mode, gates, wire.to);
                const high = sourceValue(wire.from, inputs) || outputValue(wire.from, values);
                const bend = Math.max(34, Math.abs(to.x - from.x) * .35);
                return (
                  <g key={wire.id}>
                    <path d={`M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`} className={`bench-wire ${high ? 'bench-wire-high' : 'bench-wire-low'}`} />
                    {high && <circle r="4" className="wire-pulse"><animateMotion dur="1.25s" repeatCount="indefinite" path={`M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`} /></circle>}
                  </g>
                );
              })}
            </svg>

            {sourcePins.map((source) => (
              <div key={source.id} className="absolute z-20" style={{ left: '10%', top: `${(source.y / VIEWBOX_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}>
                <button type="button" onClick={() => onSetInputs({ ...inputs, [source.label.toLowerCase()]: !source.value })} className={`bench-switch focus-ring ${source.value ? 'bench-switch-on' : ''}`} aria-pressed={source.value} aria-label={`Toggle ${source.label} input`}>
                  <span className="bench-switch-toggle"><span /></span>
                  <span className="mono text-[10px] font-medium">{source.label}</span>
                  <span className="mono text-[8px] text-slate-500">{source.value ? 'HIGH' : 'LOW'}</span>
                </button>
                <button type="button" onClick={() => handlePinClick(source.id)} className={`bench-pin bench-pin-output ${selectedPin === source.id ? 'bench-pin-selected' : ''}`} style={{ right: '-16px', top: '50%' }} aria-label={`Wire from ${source.label} output`} />
              </div>
            ))}

            {gates.map((gate) => {
              const pins = gatePins(gate);
              const active = outputValue(`${gate.id}-out`, values);
              return (
                <div key={gate.id} onPointerDown={(event) => beginDrag(event, gate)} className={`bench-gate bench-gate-${gate.kind.toLowerCase()} ${active ? 'bench-gate-active' : ''}`} style={{ left: `${(gate.x / VIEWBOX_WIDTH) * 100}%`, top: `${(gate.y / VIEWBOX_HEIGHT) * 100}%` }}>
                  <div className="bench-gate-header"><span className="mono text-[8px] uppercase tracking-widest opacity-60">IC · {gate.id}</span><MousePointer2 size={11} /></div>
                  <div className="text-sm font-semibold tracking-wide">{gate.kind}</div>
                  <span className="mono text-[8px] opacity-60">{active ? 'OUTPUT HIGH' : 'OUTPUT LOW'}</span>
                  {pins.filter((pin) => pin.kind === 'input').map((pin, index) => <button key={pin.id} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => handlePinClick(pin.id)} className={`bench-pin bench-pin-input ${selectedPin === pin.id ? 'bench-pin-selected' : ''}`} style={{ top: `${index === 0 ? 28 : 58}%`, left: '-7px' }} aria-label={`Wire to ${gate.kind} ${pin.label} input`} />)}
                  <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => handlePinClick(`${gate.id}-out`)} className={`bench-pin bench-pin-output ${selectedPin === `${gate.id}-out` ? 'bench-pin-selected' : ''}`} style={{ top: '50%', right: '-7px' }} aria-label={`Wire from ${gate.kind} output`} />
                </div>
              );
            })}

            <div className="absolute z-20" style={{ right: '10%', top: `${(mode === 'half' ? 170 : 130) / VIEWBOX_HEIGHT * 100}%`, transform: 'translate(50%, -50%)' }}>
              <div className={`bench-led ${values.sum ? 'bench-led-on' : ''}`}><span className="bench-led-light" /><span className="mono text-[9px]">SUM</span><span className="mono text-[8px] text-slate-500">{values.sum ? 'HIGH' : 'LOW'}</span></div>
              <button type="button" onClick={() => handlePinClick('led-sum-in')} className={`bench-pin bench-pin-input ${selectedPin === 'led-sum-in' ? 'bench-pin-selected' : ''}`} style={{ left: '-16px', top: '50%' }} aria-label="Wire to SUM LED" />
            </div>
            <div className="absolute z-20" style={{ right: '10%', top: `${(mode === 'half' ? 330 : 325) / VIEWBOX_HEIGHT * 100}%`, transform: 'translate(50%, -50%)' }}>
              <div className={`bench-led bench-led-amber ${values.carry ? 'bench-led-on' : ''}`}><span className="bench-led-light" /><span className="mono text-[9px]">CARRY</span><span className="mono text-[8px] text-slate-500">{values.carry ? 'HIGH' : 'LOW'}</span></div>
              <button type="button" onClick={() => handlePinClick('led-carry-in')} className={`bench-pin bench-pin-input ${selectedPin === 'led-carry-in' ? 'bench-pin-selected' : ''}`} style={{ left: '-16px', top: '50%' }} aria-label="Wire to CARRY LED" />
            </div>

            <div className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/[.1] bg-[#07101a]/90 px-3 py-1.5 text-center text-[9px] uppercase tracking-widest text-slate-500 backdrop-blur">
              {selectedPin ? `PIN SELECTED · ${getPin(selectedPin)?.label ?? selectedPin} · SELECT DESTINATION` : 'BREADBOARD ACTIVE · GRID SNAP ENABLED'}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className={`flex items-center gap-2 text-xs ${ready ? 'text-emerald-300' : 'text-amber-300'}`}>
              {ready ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
              {ready ? 'Circuit path verified · all required inputs connected' : `${missingConnections.length} required connection${missingConnections.length === 1 ? '' : 's'} floating`}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={clearWires} className="focus-ring flex items-center gap-1.5 rounded-lg border border-white/[.1] px-3 py-2 text-[10px] uppercase tracking-wider text-slate-400 transition hover:border-rose-300/30 hover:text-rose-200"><Trash2 size={12} /> Clear wires</button>
              <button type="button" onClick={resetScene} className="focus-ring flex items-center gap-1.5 rounded-lg border border-cyan-300/20 px-3 py-2 text-[10px] uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-300/10"><RotateCcw size={12} /> Restore reference</button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-white/[.08] bg-[#101b26] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300"><Plug size={15} /><h3 className="text-xs font-semibold uppercase tracking-wider">Component library</h3></div>
              <span className="mono text-[9px] text-slate-600">CLICK TO PLACE</span>
            </div>
            <div className="space-y-2">
              {(['XOR', 'AND', 'OR'] as GateKind[]).map((kind) => <button type="button" key={kind} onClick={() => placeGate(kind)} className={`focus-ring flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${libraryPulse === kind ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/[.08] bg-[#0b141d] hover:border-cyan-300/30'}`}><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${kind === 'XOR' ? 'bg-cyan-300' : kind === 'AND' ? 'bg-amber-300' : 'bg-violet-300'}`} /><span className="mono text-[11px] text-slate-200">{kind} gate</span></span><span className="mono text-[9px] text-slate-600">PLACE</span></button>)}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-slate-600">Drag placed gates to a snapped breadboard position. Spare gates can be used to explore alternate paths.</p>
          </div>

          <div className="rounded-xl border border-white/[.08] bg-[#101b26] p-4">
            <div className="mb-3 flex items-center gap-2 text-amber-300"><Cable size={15} /><h3 className="text-xs font-semibold uppercase tracking-wider">Connection monitor</h3></div>
            <div className="mb-3 flex items-end justify-between"><span className="text-[11px] text-slate-500">Required jumpers</span><strong className="mono text-lg text-slate-200">{required.length === 0 ? 0 : required.length - missingConnections.length}<span className="text-xs text-slate-600"> / {required.length}</span></strong></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all ${ready ? 'bg-emerald-300' : 'bg-cyan-300'}`} style={{ width: `${Math.max(0, ((required.length - missingConnections.length) / required.length) * 100)}%` }} /></div>
            {fault && <div className="mt-3 flex gap-2 rounded-lg border border-rose-300/20 bg-rose-300/[.06] p-2.5 text-[10px] leading-4 text-rose-200"><XCircle size={13} className="mt-0.5 shrink-0" />{fault}</div>}
            {!fault && <div className="mt-3 flex gap-2 text-[10px] leading-4 text-slate-500"><CircleAlert size={13} className="mt-0.5 shrink-0 text-cyan-300" />Output-to-output and duplicate input connections are rejected automatically.</div>}
          </div>

          {ready && <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/[.06] p-4">
            <div className="mb-2 flex items-center gap-2 text-emerald-300"><CheckCircle2 size={15} /><h3 className="text-xs font-semibold uppercase tracking-wider">Verification success</h3></div>
            <p className="text-[10px] leading-4 text-slate-400">The {mode === 'half' ? 'Half' : 'Full'} Adder architecture is wired correctly. Cycle the inputs to compare every truth-table state.</p>
            <span className="mt-3 inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-widest text-emerald-200">Success · {required.length} paths verified</span>
          </div>}

          {spectator && <div className="rounded-xl border border-violet-300/20 bg-violet-300/[.05] p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-violet-200"><Radio size={15} /><h3 className="text-xs font-semibold uppercase tracking-wider">Instructor spectator</h3></div><span className="mono text-[9px] text-violet-300">REMOTE REVIEW</span></div>
            <p className="text-[10px] leading-4 text-slate-400">Observe the live wiring state and trigger a full truth-table sequence without touching the student controls.</p>
            <button type="button" onClick={() => setReviewing((current) => !current)} className={`focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider transition ${reviewing ? 'bg-violet-300 text-[#161225]' : 'border border-violet-300/30 text-violet-200 hover:bg-violet-300/10'}`}><Play size={12} /> {reviewing ? 'Stop test sequence' : `Run ${mode === 'half' ? '4' : '8'}-state review`}</button>
          </div>}

          <div className="rounded-xl border border-white/[.08] bg-[#101b26] p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-300"><Lightbulb size={15} className="text-amber-300" /><h3 className="text-xs font-semibold uppercase tracking-wider">Signal activity</h3></div>
            <div className="space-y-2">{activity.map((event, index) => <div key={`${event}-${index}`} className="flex gap-2 text-[10px] leading-4 text-slate-500"><span className="mono text-cyan-300/60">{String(index + 1).padStart(2, '0')}</span><span>{event}</span></div>)}</div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Workbench3D;