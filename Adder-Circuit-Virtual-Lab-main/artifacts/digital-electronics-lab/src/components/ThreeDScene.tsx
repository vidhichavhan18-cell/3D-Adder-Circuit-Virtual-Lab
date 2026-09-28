import { Html, Line, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, Vector3, type Mesh } from 'three';
import type { BenchGate, BenchInputState, BenchMode, BenchValues, BenchWire } from './Workbench3D';

type PinKind = 'input' | 'output';
type ThreeDSceneProps = {
  mode: BenchMode;
  inputs: BenchInputState;
  values: BenchValues;
  gates: BenchGate[];
  wires: BenchWire[];
  selectedPin: string | null;
  onToggleInput: (name: keyof BenchInputState) => void;
  onPinClick: (pinId: string) => void;
};

type Point = [number, number, number];

const gatePalette = {
  XOR: { body: '#153c4a', edge: '#67e8f9', glow: '#22d3ee' },
  AND: { body: '#45351d', edge: '#fcd34d', glow: '#f59e0b' },
  OR: { body: '#302344', edge: '#d8b4fe', glow: '#a855f7' },
} as const;

function boardZ(y: number) {
  return (y - 255) / 52;
}

function gatePosition(gate: BenchGate): Point {
  return [(gate.x - 500) / 65, 0.7, boardZ(gate.y)];
}

function pinPosition(mode: BenchMode, gates: BenchGate[], pinId: string): Point {
  const sourceY = mode === 'half' ? { a: 158, b: 325 } : { a: 92, b: 260, cin: 430 };
  const ledY = mode === 'half' ? { sum: 170, carry: 330 } : { sum: 130, carry: 325 };
  if (pinId === 'switch-a-out') return [-6.4, 0.82, boardZ(sourceY.a)];
  if (pinId === 'switch-b-out') return [-6.4, 0.82, boardZ(sourceY.b)];
  if (pinId === 'switch-cin-out') return [-6.4, 0.82, boardZ(sourceY.cin ?? 430)];
  if (pinId === 'led-sum-in') return [6.25, 0.82, boardZ(ledY.sum)];
  if (pinId === 'led-carry-in') return [6.25, 0.82, boardZ(ledY.carry)];

  const gate = gates.find((item) => pinId.startsWith(`${item.id}-`));
  if (!gate) return [0, 0.82, 0];
  const [x, y, z] = gatePosition(gate);
  if (pinId === `${gate.id}-out`) return [x + 1.03, y + 0.1, z];
  const isSecond = pinId.endsWith('-in-b') || pinId.endsWith('-in-cin') || pinId.endsWith('-in-c2');
  return [x - 1.03, y + 0.1, z + (isSecond ? 0.28 : -0.28)];
}

function pinColor(kind: PinKind, selected: boolean) {
  if (selected) return '#fcd34d';
  return kind === 'output' ? '#22d3ee' : '#94a3b8';
}

function canUseWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function FallbackBench({ mode, inputs, values }: Pick<ThreeDSceneProps, 'mode' | 'inputs' | 'values'>) {
  const gates = mode === 'half' ? ['XOR', 'AND'] : ['XOR', 'AND', 'XOR', 'AND', 'OR'];
  return (
    <div className="three-d-fallback" role="img" aria-label="3D workbench fallback preview">
      <div className="three-d-fallback-grid" />
      <div className="three-d-fallback-title">
        <span className="mono">WEBGL FALLBACK PREVIEW</span>
        <strong>Interactive bench layout</strong>
        <small>Orbitable 3D rendering will activate when WebGL is available.</small>
      </div>
      <div className="three-d-fallback-row">
        <div className="three-d-fallback-switch"><span className={inputs.a ? 'is-high' : ''} /><strong>A</strong><small>{inputs.a ? 'HIGH' : 'LOW'}</small></div>
        <div className="three-d-fallback-switch"><span className={inputs.b ? 'is-high' : ''} /><strong>B</strong><small>{inputs.b ? 'HIGH' : 'LOW'}</small></div>
        {mode === 'full' && <div className="three-d-fallback-switch"><span className={inputs.cin ? 'is-high' : ''} /><strong>Cin</strong><small>{inputs.cin ? 'HIGH' : 'LOW'}</small></div>}
        <div className="three-d-fallback-gates">{gates.map((gate, index) => <span key={`${gate}-${index}`} className={`fallback-gate fallback-${gate.toLowerCase()}`}>{gate}</span>)}</div>
        <div className={`three-d-fallback-led ${values.sum ? 'is-high' : ''}`}><span /><strong>SUM</strong></div>
        <div className={`three-d-fallback-led fallback-led-amber ${values.carry ? 'is-high' : ''}`}><span /><strong>CARRY</strong></div>
      </div>
      <div className="three-d-fallback-hint">Drag to orbit · click pins to wire · signal pulse preview active</div>
    </div>
  );
}

function ScenePin({ position, kind, selected, onClick, label }: { position: Point; kind: PinKind; selected: boolean; onClick: () => void; label: string }) {
  return (
    <mesh position={position} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <sphereGeometry args={[0.11, 16, 16]} />
      <meshStandardMaterial color={pinColor(kind, selected)} emissive={pinColor(kind, selected)} emissiveIntensity={selected ? 2.5 : 0.7} metalness={0.7} roughness={0.25} />
      <Html distanceFactor={10} position={[0, 0.2, 0]} center style={{ pointerEvents: 'none' }}>
        <span className={`three-d-pin-label ${selected ? 'three-d-pin-label-selected' : ''}`}>{label}</span>
      </Html>
    </mesh>
  );
}

function SceneGate({ gate, active, selectedPin, onPinClick }: { gate: BenchGate; active: boolean; selectedPin: string | null; onPinClick: (pinId: string) => void }) {
  const palette = gatePalette[gate.kind];
  const [x, y, z] = gatePosition(gate);
  const firstInput = `${gate.id}-in-a`;
  const secondInput = gate.kind === 'OR' ? `${gate.id}-in-c2` : gate.id === 'xor-2' || gate.id === 'and-2' ? `${gate.id}-in-cin` : `${gate.id}-in-b`;
  return (
    <group position={[x, y, z]} rotation={[0.08, 0, 0]}>
      <RoundedBox args={[2, 0.75, 1.15]} radius={0.14} smoothness={5}>
        <meshStandardMaterial color={palette.body} emissive={active ? palette.glow : '#000000'} emissiveIntensity={active ? 0.48 : 0.05} metalness={0.72} roughness={0.28} />
      </RoundedBox>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[1.65, 0.035, 0.72]} />
        <meshStandardMaterial color={palette.edge} emissive={palette.edge} emissiveIntensity={active ? 1.8 : 0.35} metalness={0.5} roughness={0.32} />
      </mesh>
      <Html distanceFactor={8} center position={[0, 0.08, 0.59]} style={{ pointerEvents: 'none' }}>
        <div className="three-d-gate-label" style={{ color: palette.edge }}>
          <strong>{gate.kind}</strong>
          <small>{active ? 'OUTPUT HIGH' : 'OUTPUT LOW'}</small>
        </div>
      </Html>
      <ScenePin position={[-1.08, 0.12, -0.28]} kind="input" label={gate.kind === 'OR' ? 'C1' : gate.id === 'xor-2' || gate.id === 'and-2' ? 'X1' : 'A'} selected={selectedPin === firstInput} onClick={() => onPinClick(firstInput)} />
      <ScenePin position={[-1.08, 0.12, 0.28]} kind="input" label={gate.kind === 'OR' ? 'C2' : gate.id === 'xor-2' || gate.id === 'and-2' ? 'Cin' : 'B'} selected={selectedPin === secondInput} onClick={() => onPinClick(secondInput)} />
      <ScenePin position={[1.08, 0.12, 0]} kind="output" label="OUT" selected={selectedPin === `${gate.id}-out`} onClick={() => onPinClick(`${gate.id}-out`)} />
    </group>
  );
}

function SceneSwitch({ label, value, position, pinId, selectedPin, onToggle, onPinClick }: { label: string; value: boolean; position: Point; pinId: string; selectedPin: string | null; onToggle: () => void; onPinClick: (pinId: string) => void }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.25, 0.72, 1.08]} radius={0.12} smoothness={4} onClick={(event) => { event.stopPropagation(); onToggle(); }}>
        <meshStandardMaterial color={value ? '#123f4b' : '#1c2937'} emissive={value ? '#06b6d4' : '#000000'} emissiveIntensity={value ? 0.55 : 0.03} metalness={0.7} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, value ? -0.45 : 0.45]}>
        <boxGeometry args={[0.62, 0.08, 0.12]} />
        <meshStandardMaterial color={value ? '#67e8f9' : '#64748b'} emissive={value ? '#22d3ee' : '#000000'} emissiveIntensity={value ? 1.8 : 0} />
      </mesh>
      <Html distanceFactor={8} center position={[0, 0.03, 0.57]} style={{ pointerEvents: 'none' }}>
        <div className="three-d-switch-label"><strong>{label}</strong><small>{value ? 'HIGH · CLICK' : 'LOW · CLICK'}</small></div>
      </Html>
      <ScenePin position={[0.78, 0.12, 0]} kind="output" label="OUT" selected={selectedPin === pinId} onClick={() => onPinClick(pinId)} />
    </group>
  );
}

function SceneLed({ label, value, amber, position, pinId, selectedPin, onPinClick }: { label: string; value: boolean; amber?: boolean; position: Point; pinId: string; selectedPin: string | null; onPinClick: (pinId: string) => void }) {
  const color = amber ? '#f59e0b' : '#22d3ee';
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, 0.32, 32]} />
        <meshStandardMaterial color="#1b2937" metalness={0.8} roughness={0.23} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color={value ? color : '#334155'} emissive={value ? color : '#000000'} emissiveIntensity={value ? 2.2 : 0.03} metalness={0.25} roughness={0.2} />
      </mesh>
      <Html distanceFactor={8} center position={[0, -0.5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="three-d-led-label"><strong>{label}</strong><small>{value ? 'HIGH' : 'LOW'}</small></div>
      </Html>
      <ScenePin position={[-0.78, 0.12, 0]} kind="input" label="IN" selected={selectedPin === pinId} onClick={() => onPinClick(pinId)} />
    </group>
  );
}

function SignalPulse({ from, to, color }: { from: Point; to: Point; color: string }) {
  const ref = useRef<Mesh>(null);
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const progress = (clock.getElapsedTime() * 0.7) % 1;
    ref.current.position.lerpVectors(start, end, progress);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function SceneContent({ mode, inputs, values, gates, wires, selectedPin, onToggleInput, onPinClick }: ThreeDSceneProps) {
  const ledY = mode === 'half' ? { sum: 170, carry: 330 } : { sum: 130, carry: 325 };
  const wireSignal = (from: string) => from.startsWith('switch-')
    ? from === 'switch-a-out' ? inputs.a : from === 'switch-b-out' ? inputs.b : inputs.cin
    : from === 'xor-1-out' ? Boolean(values.x1)
      : from === 'and-1-out' ? Boolean(values.c1)
        : from === 'xor-2-out' ? Boolean(values.sum)
          : from === 'and-2-out' ? Boolean(values.c2)
            : Boolean(values.carry);

  return (
    <>
      <color attach="background" args={['#061018']} />
      <fog attach="fog" args={['#061018', 12, 27]} />
      <ambientLight intensity={0.55} />
      <pointLight position={[-4, 7, 4]} intensity={18} distance={18} color="#22d3ee" />
      <pointLight position={[5, 4, -4]} intensity={11} distance={16} color="#f59e0b" />
      <directionalLight position={[0, 9, 2]} intensity={1.2} color="#dbeafe" />

      <group position={[0, -0.05, 0]}>
        <RoundedBox args={[17.4, 0.28, 9.4]} radius={0.2} smoothness={6}>
          <meshStandardMaterial color="#172536" metalness={0.4} roughness={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[16.7, 0.07, 8.7]} />
          <meshStandardMaterial color="#0b1824" metalness={0.25} roughness={0.8} />
        </mesh>
        {Array.from({ length: 18 }).flatMap((_, row) => Array.from({ length: 12 }).map((__, column) => (
          <mesh key={`${row}-${column}`} position={[-7.4 + column * 1.35, 0.24, -3.95 + row * 0.47]}>
            <cylinderGeometry args={[0.035, 0.035, 0.035, 10]} />
            <meshStandardMaterial color="#304354" emissive="#0e7490" emissiveIntensity={0.1} />
          </mesh>
        )))}
        <mesh position={[0, 0.25, -4.18]}>
          <boxGeometry args={[16.4, 0.04, 0.16]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 0.25, 4.18]}>
          <boxGeometry args={[16.4, 0.04, 0.16]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {wires.map((wire) => {
        const from = pinPosition(mode, gates, wire.from);
        const to = pinPosition(mode, gates, wire.to);
        const high = wireSignal(wire.from);
        const midpoint: Point = [(from[0] + to[0]) / 2, 0.98, (from[2] + to[2]) / 2];
        return (
          <group key={wire.id}>
            <Line points={[from, midpoint, to]} color={high ? '#22d3ee' : '#526477'} lineWidth={high ? 2.4 : 1.25} transparent opacity={high ? 0.95 : 0.55} />
            {high && <SignalPulse from={from} to={to} color="#a5f3fc" />}
          </group>
        );
      })}

      {gates.filter((gate) => !gate.id.startsWith('spare-')).map((gate) => (
        <SceneGate key={gate.id} gate={gate} active={wireSignal(`${gate.id}-out`)} selectedPin={selectedPin} onPinClick={onPinClick} />
      ))}
      {gates.filter((gate) => gate.id.startsWith('spare-')).map((gate) => (
        <SceneGate key={gate.id} gate={gate} active={false} selectedPin={selectedPin} onPinClick={onPinClick} />
      ))}

      <SceneSwitch label="A" value={inputs.a} position={[-7.15, 0.72, boardZ(mode === 'half' ? 158 : 92)]} pinId="switch-a-out" selectedPin={selectedPin} onToggle={() => onToggleInput('a')} onPinClick={onPinClick} />
      <SceneSwitch label="B" value={inputs.b} position={[-7.15, 0.72, boardZ(mode === 'half' ? 325 : 260)]} pinId="switch-b-out" selectedPin={selectedPin} onToggle={() => onToggleInput('b')} onPinClick={onPinClick} />
      {mode === 'full' && <SceneSwitch label="Cin" value={inputs.cin} position={[-7.15, 0.72, boardZ(430)]} pinId="switch-cin-out" selectedPin={selectedPin} onToggle={() => onToggleInput('cin')} onPinClick={onPinClick} />}

      <SceneLed label="SUM" value={Boolean(values.sum)} position={[7.05, 0.75, boardZ(ledY.sum)]} pinId="led-sum-in" selectedPin={selectedPin} onPinClick={onPinClick} />
      <SceneLed label="CARRY" value={Boolean(values.carry)} amber position={[7.05, 0.75, boardZ(ledY.carry)]} pinId="led-carry-in" selectedPin={selectedPin} onPinClick={onPinClick} />

      <gridHelper args={[18, 36, new Color('#1e5266'), new Color('#102b3a')]} position={[0, 0.34, 0]} rotation={[0, 0, 0]} />
      <OrbitControls makeDefault minDistance={8} maxDistance={22} maxPolarAngle={Math.PI / 2.15} minPolarAngle={0.45} target={[0, 0.4, 0]} />
    </>
  );
}

export default function ThreeDScene(props: ThreeDSceneProps) {
  if (!canUseWebGL()) {
    return (
      <div className="three-d-scene relative overflow-hidden rounded-xl border border-cyan-300/20" aria-label="Interactive 3D electronics bench">
        <FallbackBench {...props} />
        <div className="three-d-hud pointer-events-none absolute left-4 top-4 rounded-lg border border-white/[.1] bg-[#07111b]/75 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> WebGL fallback</div>
          <p className="mt-1 text-[10px] text-slate-500">The wiring map below remains fully interactive.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="three-d-scene relative overflow-hidden rounded-xl border border-cyan-300/20" aria-label="Interactive 3D electronics bench">
      <Canvas shadows camera={{ position: [0, 10, 14], fov: 42 }} dpr={[1, 1.6]}>
        <SceneContent {...props} />
      </Canvas>
      <div className="three-d-hud pointer-events-none absolute left-4 top-4 rounded-lg border border-white/[.1] bg-[#07111b]/75 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cyan-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Live 3D scene</div>
        <p className="mt-1 text-[10px] text-slate-500">Drag to orbit · scroll to zoom · click pins to wire</p>
      </div>
    </div>
  );
}