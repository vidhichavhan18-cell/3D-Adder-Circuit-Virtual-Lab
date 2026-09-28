import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  CircuitBoard,
  Cpu,
  Info,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Workbench3D, { type BenchStatus } from '@/components/Workbench3D';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

type Mode = 'half' | 'full';
type InputState = { a: boolean; b: boolean; cin: boolean };
type GateKind = 'XOR' | 'AND' | 'OR';

const halfRows = [
  { a: 0, b: 0, sum: 0, carry: 0 },
  { a: 0, b: 1, sum: 1, carry: 0 },
  { a: 1, b: 0, sum: 1, carry: 0 },
  { a: 1, b: 1, sum: 0, carry: 1 },
];

const fullRows = [
  { a: 0, b: 0, cin: 0, sum: 0, carry: 0 },
  { a: 0, b: 0, cin: 1, sum: 1, carry: 0 },
  { a: 0, b: 1, cin: 0, sum: 1, carry: 0 },
  { a: 0, b: 1, cin: 1, sum: 0, carry: 1 },
  { a: 1, b: 0, cin: 0, sum: 1, carry: 0 },
  { a: 1, b: 0, cin: 1, sum: 0, carry: 1 },
  { a: 1, b: 1, cin: 0, sum: 0, carry: 1 },
  { a: 1, b: 1, cin: 1, sum: 1, carry: 1 },
];

const quizQuestions = [
  {
    question: 'Which gate produces HIGH when its two inputs are different?',
    options: ['AND', 'OR', 'XOR', 'NOT'],
    answer: 2,
    note: 'XOR is the difference detector: it is HIGH only when exactly one input is HIGH.',
  },
  {
    question: 'For a Half Adder, what is the CARRY output formula?',
    options: ['A XOR B', 'A AND B', 'A OR B', 'A + B + 1'],
    answer: 1,
    note: 'Both bits must be HIGH to produce a carry, which is the AND operation.',
  },
  {
    question: 'How many input combinations does a Full Adder have?',
    options: ['2', '4', '6', '8'],
    answer: 3,
    note: 'Three binary inputs give 2³ = 8 possible combinations.',
  },
  {
    question: 'In a Full Adder, what is X1?',
    options: ['A AND B', 'A XOR B', 'C1 OR C2', 'SUM AND Cin'],
    answer: 1,
    note: 'X1 is the intermediate sum of A and B before Cin is added.',
  },
  {
    question: 'When A = 1, B = 1, and Cin = 1, what is the result?',
    options: ['Carry 0, Sum 1', 'Carry 1, Sum 0', 'Carry 1, Sum 1', 'Carry 0, Sum 0'],
    answer: 2,
    note: '1 + 1 + 1 = 3 in decimal, represented as binary 11: carry 1 and sum 1.',
  },
];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={LabPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function LabPage() {
  const [mode, setMode] = useState<Mode>('half');
  const [inputs, setInputs] = useState<InputState>({ a: false, b: false, cin: false });
  const [benchStatus, setBenchStatus] = useState<BenchStatus>({ ready: true, fault: null, wireCount: 6 });
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const calculated = useMemo(() => {
    const a = Number(inputs.a);
    const b = Number(inputs.b);
    const cin = Number(inputs.cin);
    const x1 = a ^ b;
    const sum = mode === 'half' ? x1 : x1 ^ cin;
    const c1 = a & b;
    const c2 = x1 & cin;
    const carry = mode === 'half' ? c1 : c1 | c2;
    return { a, b, cin, x1, c1, c2, sum, carry };
  }, [inputs, mode]);

  const toggleInput = (name: keyof InputState) => {
    setInputs((current) => ({ ...current, [name]: !current[name] }));
  };

  const resetCircuit = () => setInputs({ a: false, b: false, cin: false });
  const currentRow = mode === 'half'
    ? halfRows.findIndex((row) => row.a === calculated.a && row.b === calculated.b)
    : fullRows.findIndex((row) => row.a === calculated.a && row.b === calculated.b && row.cin === calculated.cin);
  const quizScore = quizQuestions.reduce((score, question, index) => (
    score + (quizAnswers[index] === question.answer ? 1 : 0)
  ), 0);

  return (
    <div className="lab-shell min-h-[100dvh]">
      <header className="border-b border-white/[.08] bg-[#111923]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/[.08] text-cyan-300 shadow-[0_0_22px_rgba(45,212,191,.14)]">
              <CircuitBoard size={22} strokeWidth={1.7} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-slate-100 sm:text-lg">Digital Electronics Virtual Lab</p>
              <p className="truncate text-[10px] uppercase tracking-[.16em] text-slate-500 sm:text-xs">Half Adder &amp; Full Adder Simulation</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-3 py-1.5 text-[11px] font-medium text-emerald-300 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b7]" />
            {benchStatus.ready ? 'CIRCUIT VERIFIED' : 'WIRING REQUIRED'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-7 sm:px-6 lg:px-8">
        <section className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.2em] text-cyan-300">
              <Zap size={13} /> Interactive workbench <span className="text-slate-700">/</span> logic lab
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-.04em] text-slate-100 sm:text-5xl">Build the bit. <span className="text-cyan-300">Read the result.</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Flip the input switches and follow every signal through the gates. The truth table, LEDs, and explanation update as you operate the circuit.</p>
          </div>
          <div className="flex items-center gap-3">
            <button data-testid="button-reset-circuit" type="button" onClick={resetCircuit} className="focus-ring group flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200">
              <RotateCcw size={14} className="transition-transform group-hover:-rotate-45" /> RESET CIRCUIT
            </button>
          </div>
        </section>

        <div className="mb-6 flex w-full max-w-xl rounded-xl border border-white/[.09] bg-[#121c27] p-1.5 shadow-xl">
          <button data-testid="tab-half-adder" type="button" onClick={() => setMode('half')} className={`focus-ring flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${mode === 'half' ? 'bg-cyan-300 text-[#0b151d] shadow-[0_0_18px_rgba(103,232,249,.2)]' : 'text-slate-400 hover:text-slate-200'}`}>
            <span className="mono text-[10px] opacity-70">01</span> Half Adder
          </button>
          <button data-testid="tab-full-adder" type="button" onClick={() => setMode('full')} className={`focus-ring flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${mode === 'full' ? 'bg-cyan-300 text-[#0b151d] shadow-[0_0_18px_rgba(103,232,249,.2)]' : 'text-slate-400 hover:text-slate-200'}`}>
            <span className="mono text-[10px] opacity-70">11</span> Full Adder
          </button>
        </div>

        <Workbench3D
          mode={mode}
          inputs={inputs}
          values={calculated}
          onSetInputs={setInputs}
          onStatusChange={setBenchStatus}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.75fr)]">
          <div className="glass-panel min-w-0 overflow-hidden rounded-2xl border border-white/[.09]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.08] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300"><Cpu size={16} /></div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">{mode === 'half' ? 'Half Adder' : 'Full Adder'} circuit</h2>
                  <p className="mono text-[10px] text-slate-500">LIVE LOGIC VIEW · {mode === 'half' ? '2' : '3'} INPUTS / 2 OUTPUTS</p>
                </div>
              </div>
              <div data-testid="status-live-simulation" className="mono flex items-center gap-2 text-[10px] text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> LIVE SIMULATION</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="mono text-[10px] uppercase tracking-[.2em] text-slate-500">Inputs → logic network → outputs</div>
                <div className="hidden items-center gap-3 text-[10px] text-slate-500 sm:flex"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cyan-300" /> HIGH</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-700" /> LOW</span></div>
              </div>
              <CircuitBoardView mode={mode} inputs={inputs} values={calculated} onToggle={toggleInput} />
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <FormulaPill label="SUM" formula={mode === 'half' ? 'A XOR B' : 'X1 XOR Cin'} active={Boolean(calculated.sum)} />
                <FormulaPill label={mode === 'half' ? 'CARRY' : 'CARRY OUT'} formula={mode === 'half' ? 'A AND B' : 'C1 OR C2'} active={Boolean(calculated.carry)} amber />
              </div>
            </div>
          </div>

          <aside className="glass-panel rounded-2xl border border-white/[.09] p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="mono text-[10px] uppercase tracking-[.2em] text-amber-300">Output register</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-100">Read the LEDs</h2>
              </div>
              <Lightbulb size={20} className="text-amber-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <OutputLED label="SUM" value={calculated.sum} />
              <OutputLED label={mode === 'half' ? 'CARRY' : 'CARRY OUT'} value={calculated.carry} amber />
            </div>
            <div className="mt-5 rounded-xl border border-white/[.07] bg-[#0d151e] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Current state</span>
                <span className="mono text-[11px] text-cyan-300">{mode === 'half' ? `${calculated.a}${calculated.b}` : `${calculated.a}${calculated.b}${calculated.cin}`}</span>
              </div>
              <div data-testid="text-current-result" className="mono text-2xl tracking-[.18em] text-slate-100">
                {mode === 'half' ? `${calculated.sum}${calculated.carry}` : `${calculated.carry}${calculated.sum}`}
                <span className="ml-2 text-xs tracking-normal text-slate-500">binary result</span>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-400">
              <Info size={15} className="mt-0.5 shrink-0 text-cyan-300" />
              <p>Bright cyan wires carry a HIGH signal. An unlit wire is LOW. Watch how each gate transforms the signal.</p>
            </div>
          </aside>
        </section>

        <section className="section-anchor mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]" id="truth-table">
          <div className="glass-panel rounded-2xl border border-white/[.09] p-5 sm:p-6">
            <SectionHeading icon={<CircuitBoard size={16} />} eyebrow="State matrix" title={`${mode === 'half' ? 'Half' : 'Full'} Adder truth table`} detail="The highlighted row is your live circuit state." />
            <TruthTable mode={mode} currentRow={currentRow} />
          </div>
          <Explanation mode={mode} values={calculated} />
        </section>

        {mode === 'full' && <BinaryAddition values={calculated} />}

        <HowItWorks mode={mode} />

        <ExperimentSection />

        <section className="section-anchor mt-8" id="knowledge-check">
          <Quiz answers={quizAnswers} setAnswers={setQuizAnswers} submitted={quizSubmitted} setSubmitted={setQuizSubmitted} score={quizScore} />
        </section>
      </main>
      <footer className="border-t border-white/[.07] bg-[#0d151e]/80">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <span className="mono">DIGITAL LOGIC / VIRTUAL INSTRUMENT</span>
          <span>Designed for practical learning and viva preparation.</span>
        </div>
      </footer>
    </div>
  );
}

function CircuitBoardView({ mode, inputs, values, onToggle }: { mode: Mode; inputs: InputState; values: ReturnType<typeof getValues>; onToggle: (name: keyof InputState) => void }) {
  const lanes = mode === 'half'
    ? [
      { label: 'SUM', gate: 'XOR' as GateKind, inputLabels: ['A', 'B'], inputValues: [inputs.a, inputs.b], output: Boolean(values.sum), outputLabel: 'SUM' },
      { label: 'CARRY', gate: 'AND' as GateKind, inputLabels: ['A', 'B'], inputValues: [inputs.a, inputs.b], output: Boolean(values.carry), outputLabel: 'CARRY' },
    ]
    : [
      { label: 'X1', gate: 'XOR' as GateKind, inputLabels: ['A', 'B'], inputValues: [inputs.a, inputs.b], output: Boolean(values.x1), outputLabel: 'X1' },
      { label: 'C1', gate: 'AND' as GateKind, inputLabels: ['A', 'B'], inputValues: [inputs.a, inputs.b], output: Boolean(values.c1), outputLabel: 'C1' },
      { label: 'SUM', gate: 'XOR' as GateKind, inputLabels: ['X1', 'Cin'], inputValues: [Boolean(values.x1), inputs.cin], output: Boolean(values.sum), outputLabel: 'SUM' },
      { label: 'C2', gate: 'AND' as GateKind, inputLabels: ['X1', 'Cin'], inputValues: [Boolean(values.x1), inputs.cin], output: Boolean(values.c2), outputLabel: 'C2' },
      { label: 'CARRY OUT', gate: 'OR' as GateKind, inputLabels: ['C1', 'C2'], inputValues: [Boolean(values.c1), Boolean(values.c2)], output: Boolean(values.carry), outputLabel: 'CARRY OUT' },
    ];
  return (
    <div className="rounded-xl border border-white/[.07] bg-[#0b141d] p-3 sm:p-5">
      <div className="mb-4 grid grid-cols-[80px_1fr] items-center gap-3 border-b border-white/[.06] pb-3 text-[10px] uppercase tracking-[.18em] text-slate-600 sm:grid-cols-[110px_1fr]">
        <span>Source</span><span>Signal path / gate network</span>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[110px_1fr] sm:items-center">
          <div className="flex flex-wrap gap-2">
            <InputSwitch name="A" active={inputs.a} onClick={() => onToggle('a')} />
            <InputSwitch name="B" active={inputs.b} onClick={() => onToggle('b')} />
            {mode === 'full' && <InputSwitch name="Cin" active={inputs.cin} onClick={() => onToggle('cin')} />}
          </div>
          <div className="hidden items-center gap-2 text-[10px] text-slate-600 sm:flex"><span className="h-px flex-1 bg-slate-800" /><span>flip a switch to inject a signal</span></div>
        </div>
        <div className="space-y-2.5 border-l border-dashed border-cyan-300/20 pl-2 sm:ml-[52px] sm:pl-4">
          {lanes.map((lane, index) => <GateLane key={`${lane.label}-${index}`} {...lane} />)}
        </div>
      </div>
    </div>
  );
}

function getValues(a = 0, b = 0, cin = 0) {
  const x1 = a ^ b;
  const c1 = a & b;
  const c2 = x1 & cin;
  return { a, b, cin, x1, c1, c2, sum: x1 ^ cin, carry: c1 | c2 };
}

function InputSwitch({ name, active, onClick }: { name: string; active: boolean; onClick: () => void }) {
  return (
    <button data-testid={`switch-input-${name.toLowerCase()}`} type="button" aria-pressed={active} aria-label={`Toggle input ${name}`} onClick={onClick} className={`focus-ring group flex min-w-[68px] items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${active ? 'border-cyan-300/45 bg-cyan-300/[.11]' : 'border-white/[.1] bg-slate-900/60 hover:border-slate-600'}`}>
      <span className={`relative h-5 w-9 rounded-full border p-0.5 transition ${active ? 'border-cyan-300/50 bg-cyan-300/25' : 'border-slate-700 bg-slate-800'}`}><span className={`block h-3.5 w-3.5 rounded-full transition-transform ${active ? 'translate-x-4 bg-cyan-200 shadow-[0_0_9px_#67e8f9]' : 'bg-slate-600'}`} /></span>
      <span><span className={`mono block text-xs font-medium ${active ? 'text-cyan-200' : 'text-slate-300'}`}>{name}</span><span className={`mono text-[9px] ${active ? 'text-cyan-300' : 'text-slate-600'}`}>{active ? 'HIGH' : 'LOW'}</span></span>
    </button>
  );
}

function GateLane({ label, gate, inputLabels, inputValues, output, outputLabel }: { label: string; gate: GateKind; inputLabels: string[]; inputValues: boolean[]; output: boolean; outputLabel: string }) {
  return (
    <div className="grid grid-cols-[39px_1fr] items-center gap-2 sm:grid-cols-[54px_1fr] sm:gap-3">
      <span className="mono text-[10px] font-medium text-slate-500">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <div className="flex min-w-[62px] flex-col gap-1 sm:min-w-[82px]">
          {inputLabels.map((input, index) => <SignalWire key={input} label={input} active={inputValues[index]} />)}
        </div>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${inputValues.some(Boolean) ? 'bg-cyan-300' : 'bg-slate-700'}`} />
        <GateBlock kind={gate} active={output} />
        <SignalWire label={outputLabel} active={output} output />
      </div>
    </div>
  );
}

function SignalWire({ label, active, output = false }: { label: string; active: boolean; output?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {!output && <span className="mono w-6 text-[9px] text-slate-600">{label}</span>}
      <span className={`h-1 min-w-[16px] flex-1 rounded-full transition ${active ? 'signal-high' : 'signal-low'}`} />
      {output && <span className={`mono w-[54px] truncate text-[9px] ${active ? 'text-cyan-300' : 'text-slate-600'}`}>{active ? 'HIGH' : 'LOW'}</span>}
    </div>
  );
}

function GateBlock({ kind, active }: { kind: GateKind; active: boolean }) {
  const color = kind === 'XOR' ? 'cyan' : kind === 'AND' ? 'amber' : 'violet';
  return (
    <div data-testid={`gate-${kind.toLowerCase()}`} className={`relative flex h-[58px] w-[76px] shrink-0 flex-col items-center justify-center rounded-[38%] border text-center transition sm:h-[64px] sm:w-[94px] ${color === 'cyan' ? 'border-cyan-300/45 bg-cyan-300/[.08] text-cyan-200' : color === 'amber' ? 'border-amber-300/40 bg-amber-300/[.08] text-amber-200' : 'border-violet-300/40 bg-violet-300/[.08] text-violet-200'} ${active ? 'shadow-[0_0_18px_rgba(103,232,249,.13)]' : ''}`}>
      <span className="absolute -left-1 top-1/3 h-2 w-2 rounded-full border border-slate-500 bg-[#0b141d]" />
      <span className="absolute -left-1 bottom-1/3 h-2 w-2 rounded-full border border-slate-500 bg-[#0b141d]" />
      <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-slate-500 bg-[#0b141d]" />
      <span className="mono text-[9px] tracking-[.16em] opacity-70">LOGIC</span>
      <span className="text-sm font-semibold">{kind}</span>
    </div>
  );
}

function OutputLED({ label, value, amber = false }: { label: string; value: number; amber?: boolean }) {
  return (
    <div data-testid={`output-led-${label.toLowerCase().replaceAll(' ', '-')}`} className={`rounded-xl border p-3 text-center transition ${value ? amber ? 'border-amber-300/45 bg-amber-300/[.09]' : 'border-cyan-300/45 bg-cyan-300/[.09]' : 'border-white/[.08] bg-[#0d151e]'}`}>
      <div className={`mx-auto mb-3 h-10 w-10 rounded-full border-4 ${value ? amber ? 'animate-amber-breathe border-amber-200 bg-amber-300' : 'animate-led-breathe border-cyan-100 bg-cyan-300' : 'border-slate-700 bg-slate-800'}`} />
      <div className="mono text-[10px] tracking-[.12em] text-slate-400">{label}</div>
      <div className={`mono mt-1 text-xl font-medium ${value ? amber ? 'text-amber-300' : 'text-cyan-300' : 'text-slate-600'}`}>{value}</div>
      <div className={`mt-1 text-[9px] uppercase tracking-[.14em] ${value ? 'text-slate-300' : 'text-slate-600'}`}>{value ? 'HIGH' : 'LOW'}</div>
    </div>
  );
}

function FormulaPill({ label, formula, active, amber = false }: { label: string; formula: string; active: boolean; amber?: boolean }) {
  return <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${amber ? 'border-amber-300/15 bg-amber-300/[.04]' : 'border-cyan-300/15 bg-cyan-300/[.04]'}`}><span className={`mono text-[10px] ${amber ? 'text-amber-300' : 'text-cyan-300'}`}>{label}</span><span className="mono text-[10px] text-slate-400">{formula}</span><span className={`h-1.5 w-1.5 rounded-full ${active ? amber ? 'bg-amber-300 shadow-[0_0_8px_#fcd34d]' : 'bg-cyan-300 shadow-[0_0_8px_#67e8f9]' : 'bg-slate-700'}`} /></div>;
}

function SectionHeading({ icon, eyebrow, title, detail }: { icon: ReactNode; eyebrow: string; title: string; detail: string }) {
  return <div className="mb-5 flex items-start gap-3"><div className="mt-0.5 text-cyan-300">{icon}</div><div><p className="mono text-[10px] uppercase tracking-[.2em] text-cyan-300">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold text-slate-100">{title}</h2><p className="mt-1 text-xs text-slate-500">{detail}</p></div></div>;
}

function TruthTable({ mode, currentRow }: { mode: Mode; currentRow: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[.08]">
      <table className="w-full min-w-[440px] border-collapse text-left">
        <thead className="bg-[#101b26]"><tr>{(mode === 'half' ? ['A', 'B', 'SUM', 'CARRY'] : ['A', 'B', 'Cin', 'SUM', 'CARRY OUT']).map((heading) => <th key={heading} className="mono border-b border-white/[.08] px-3 py-3 text-[10px] font-medium uppercase tracking-[.13em] text-slate-500">{heading}</th>)}</tr></thead>
        <tbody>{(mode === 'half' ? halfRows : fullRows).map((row, index) => {
          const cells = mode === 'half'
            ? [row.a, row.b, row.sum, row.carry]
            : [row.a, row.b, (row as typeof fullRows[number]).cin, row.sum, row.carry];
          return <tr data-testid={`truth-row-${index}`} key={index} className={`border-b border-white/[.06] transition last:border-0 ${index === currentRow ? 'bg-cyan-300/[.11]' : 'hover:bg-white/[.025]'}`}>{cells.map((cell, cellIndex) => <td key={cellIndex} className={`mono px-3 py-2.5 text-xs ${index === currentRow ? cellIndex >= (mode === 'half' ? 2 : 3) ? 'font-medium text-cyan-200' : 'text-slate-200' : cellIndex >= (mode === 'half' ? 2 : 3) ? 'text-slate-300' : 'text-slate-500'}`}>{cell}{index === currentRow && cellIndex === 0 && <span className="ml-2 inline-block h-1 w-1 rounded-full bg-cyan-300 align-middle" />}</td>)}</tr>;
        })}</tbody>
      </table>
    </div>
  );
}

function Explanation({ mode, values }: { mode: Mode; values: ReturnType<typeof getValues> }) {
  const a = values.a;
  const b = values.b;
  const cin = values.cin;
  const steps = mode === 'half'
    ? [
      { title: 'Read the inputs', text: `A is ${a ? 'HIGH' : 'LOW'} and B is ${b ? 'HIGH' : 'LOW'}.` },
      { title: 'XOR decides SUM', text: `A XOR B = ${values.sum}. XOR is HIGH when the inputs are different.` },
      { title: 'AND decides CARRY', text: `A AND B = ${values.carry}. A carry appears only when both inputs are HIGH.` },
    ]
    : [
      { title: 'First partial sum', text: `X1 = A XOR B = ${values.x1}. This adds the two main input bits.` },
      { title: 'Add the carry-in', text: `SUM = X1 XOR Cin = ${values.x1} XOR ${cin} = ${values.sum}.` },
      { title: 'Collect the carry paths', text: `C1 = ${values.c1} and C2 = ${values.c2}; C1 OR C2 = CARRY OUT ${values.carry}.` },
    ];
  return <div className="glass-panel rounded-2xl border border-white/[.09] p-5 sm:p-6"><SectionHeading icon={<Sparkles size={16} />} eyebrow="Signal narrative" title="Why is this the result?" detail="A live explanation of the current combination." /><div className="space-y-4">{steps.map((step, index) => <div data-testid={`explanation-step-${index}`} className="flex gap-3" key={step.title}><div className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/[.08] text-[10px] text-cyan-300">{String(index + 1).padStart(2, '0')}</div><div><h3 className="text-sm font-medium text-slate-200">{step.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{step.text}</p></div></div>)}</div><div className="mt-5 rounded-lg border border-amber-300/15 bg-amber-300/[.04] p-3 text-xs leading-5 text-slate-400"><Lightbulb size={14} className="mr-2 inline text-amber-300" />Tip: use the switches to find a row where the output changes, then explain the gate rule aloud.</div></div>;
}

function BinaryAddition({ values }: { values: ReturnType<typeof getValues> }) {
  return <section className="glass-panel mt-8 rounded-2xl border border-cyan-300/20 p-5 sm:p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="mono text-[10px] uppercase tracking-[.2em] text-cyan-300">Arithmetic readout</p><h2 className="mt-1 text-xl font-semibold text-slate-100">Full Adder Binary Addition Result</h2><p className="mt-1 text-xs text-slate-500">Three input bits represented as a two-bit binary result.</p></div><div data-testid="binary-addition-result" className="mono rounded-xl border border-cyan-300/20 bg-[#0b141d] px-5 py-4 text-center text-xl text-cyan-200 sm:text-2xl">{values.a} + {values.b} + {values.cin} = <span className="font-medium text-amber-300">{values.carry}</span><span className="text-slate-600"> </span><span className="font-medium text-cyan-300">{values.sum}</span></div></div><div className="mt-5 grid max-w-xl grid-cols-2 gap-3"><div className="rounded-lg border border-amber-300/15 bg-amber-300/[.04] px-4 py-3"><span className="block text-[10px] uppercase tracking-widest text-slate-500">Carry value</span><strong data-testid="text-carry-value" className="mono mt-1 block text-xl text-amber-300">{values.carry}</strong></div><div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[.04] px-4 py-3"><span className="block text-[10px] uppercase tracking-widest text-slate-500">Sum value</span><strong data-testid="text-sum-value" className="mono mt-1 block text-xl text-cyan-300">{values.sum}</strong></div></div></section>;
}

function HowItWorks({ mode }: { mode: Mode }) {
  const formulas = mode === 'half'
    ? [
      ['SUM', 'A XOR B', 'XOR is HIGH when exactly one input is HIGH.'],
      ['CARRY', 'A AND B', 'AND is HIGH only when both inputs are HIGH.'],
    ]
    : [
      ['X1', 'A XOR B', 'The first XOR creates the partial sum.'],
      ['SUM', 'X1 XOR Cin', 'The second XOR adds the incoming carry.'],
      ['C1', 'A AND B', 'Carry generated by the main inputs.'],
      ['C2', 'X1 AND Cin', 'Carry generated by the partial sum and Cin.'],
      ['CARRY OUT', 'C1 OR C2', 'Either carry path can raise the final carry.'],
    ];
  return <section className="glass-panel mt-8 rounded-2xl border border-white/[.09] p-5 sm:p-6"><div className="grid gap-6 lg:grid-cols-[.55fr_1.45fr] lg:items-center"><div><div className="mb-3 flex items-center gap-2 text-cyan-300"><Info size={16} /><span className="mono text-[10px] uppercase tracking-[.2em]">Quick orientation</span></div><h2 className="text-xl font-semibold text-slate-100">How it works</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Binary addition separates the answer into a SUM bit and a CARRY bit. Each gate below is one small, inspectable decision in that process.</p></div><div className={`grid gap-2 ${mode === 'full' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>{formulas.map(([name, formula, description], index) => <div data-testid={`formula-card-${index}`} key={name} className="rounded-lg border border-white/[.07] bg-[#0d151e] p-3"><div className="flex items-center justify-between gap-2"><span className="mono text-[10px] text-slate-400">{name}</span><ChevronRight size={13} className="text-slate-700" /></div><div className="mono mt-2 text-sm text-cyan-200">{formula}</div><p className="mt-1 text-[10px] leading-4 text-slate-600">{description}</p></div>)}</div></div></section>;
}

function ExperimentSection() {
  return <section className="section-anchor mt-8" id="experiment"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="mono text-[10px] uppercase tracking-[.2em] text-amber-300">Practical notebook</p><h2 className="mt-1 text-2xl font-semibold text-slate-100">Experiment</h2></div><BookOpen size={20} className="text-slate-600" /></div><div className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]"><div className="glass-panel rounded-2xl border border-white/[.09] p-5 sm:p-6"><div className="mb-5 flex items-center gap-2 text-cyan-300"><BookOpen size={16} /><span className="text-sm font-semibold">Lab brief</span></div><div className="space-y-5"><div><h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Aim</h3><p className="mt-2 text-sm leading-6 text-slate-300">To verify the operation of Half Adder and Full Adder circuits using logic gates and their truth tables.</p></div><div><h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Learning objectives</h3><ul className="mt-2 space-y-2 text-sm text-slate-400"><li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />Trace binary signals through XOR, AND, and OR gates.</li><li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />Construct and interpret complete truth tables.</li><li className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />Explain how a Full Adder handles carry-in.</li></ul></div></div></div><div className="glass-panel overflow-hidden rounded-2xl border border-white/[.09] p-5 sm:p-6"><div className="mb-5 flex items-center gap-2"><ShieldCheck size={16} className="text-amber-300" /><h3 className="text-sm font-semibold text-slate-200">Half Adder vs Full Adder</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-xs"><thead><tr className="border-b border-white/[.08] text-[10px] uppercase tracking-widest text-slate-500"><th className="pb-3 pr-4 font-medium">Property</th><th className="pb-3 px-4 font-medium text-cyan-300">Half Adder</th><th className="pb-3 pl-4 font-medium text-amber-300">Full Adder</th></tr></thead><tbody className="text-slate-400"><tr className="border-b border-white/[.06]"><td className="py-3 pr-4 text-slate-300">Inputs</td><td className="px-4 mono">A, B</td><td className="pl-4 mono">A, B, Cin</td></tr><tr className="border-b border-white/[.06]"><td className="py-3 pr-4 text-slate-300">Carry handling</td><td className="px-4">No carry-in</td><td className="pl-4">Accepts carry-in</td></tr><tr className="border-b border-white/[.06]"><td className="py-3 pr-4 text-slate-300">Gate network</td><td className="px-4">1 XOR + 1 AND</td><td className="pl-4">2 XOR + 2 AND + 1 OR</td></tr><tr><td className="pt-3 pr-4 text-slate-300">Truth rows</td><td className="px-4 mono">4</td><td className="pl-4 mono">8</td></tr></tbody></table></div></div></div></section>;
}

function Quiz({ answers, setAnswers, submitted, setSubmitted, score }: { answers: Record<number, number>; setAnswers: (answers: Record<number, number>) => void; submitted: boolean; setSubmitted: (submitted: boolean) => void; score: number }) {
  return <div className="glass-panel rounded-2xl border border-white/[.09] p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-amber-300"><CircleHelp size={17} /><span className="mono text-[10px] uppercase tracking-[.2em]">Knowledge check</span></div><h2 className="text-2xl font-semibold text-slate-100">Test your knowledge</h2><p className="mt-1 text-sm text-slate-500">Five quick checks on the concepts you just operated.</p></div>{submitted && <div data-testid="text-quiz-score" className="rounded-xl border border-emerald-300/25 bg-emerald-300/[.08] px-4 py-3 text-center"><span className="block text-[10px] uppercase tracking-widest text-emerald-300">Your score</span><strong className="mono text-xl text-slate-100">{score} / {quizQuestions.length}</strong></div>}</div><div className="mt-6 grid gap-4 lg:grid-cols-2">{quizQuestions.map((question, index) => <div data-testid={`quiz-question-${index}`} key={question.question} className={`rounded-xl border p-4 ${submitted ? answers[index] === question.answer ? 'border-emerald-300/25 bg-emerald-300/[.04]' : 'border-rose-300/20 bg-rose-300/[.03]' : 'border-white/[.08] bg-[#0d151e]'}`}><div className="flex gap-3"><span className="mono text-[10px] text-cyan-300">0{index + 1}</span><p className="text-sm font-medium leading-5 text-slate-200">{question.question}</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => { const selected = answers[index] === optionIndex; const correct = submitted && question.answer === optionIndex; return <button data-testid={`quiz-option-${index}-${optionIndex}`} type="button" key={option} onClick={() => { setAnswers({ ...answers, [index]: optionIndex }); setSubmitted(false); }} className={`focus-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${selected ? 'border-cyan-300/45 bg-cyan-300/[.1] text-cyan-100' : 'border-white/[.07] text-slate-400 hover:border-slate-600 hover:text-slate-200'} ${correct ? 'border-emerald-300/50 bg-emerald-300/[.1] text-emerald-200' : ''}`}><span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${selected ? 'border-cyan-300 bg-cyan-300 text-[#0b151d]' : 'border-slate-700'}`}>{selected && <Check size={10} />}</span>{option}</button>; })}</div>{submitted && <p className={`mt-3 text-[11px] leading-4 ${answers[index] === question.answer ? 'text-emerald-300' : 'text-amber-300'}`}>{answers[index] === question.answer ? 'Correct. ' : `Correct answer: ${question.options[question.answer]}. `}{question.note}</p>}</div>)}</div><div className="mt-6 flex flex-wrap items-center gap-3"><button data-testid="button-submit-quiz" type="button" onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < quizQuestions.length} className="focus-ring flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-[#0b151d] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">SUBMIT QUIZ <ChevronRight size={14} /></button><span className="text-xs text-slate-600">{Object.keys(answers).length} of {quizQuestions.length} answered</span></div></div>;
}

export default App;