import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Activity, 
  Zap, 
  BarChart3, 
  Settings, 
  User, 
  LogOut, 
  Bluetooth, 
  CheckCircle2, 
  AlertCircle,
  BrainCircuit,
  ArrowRight,
  Timer,
  ShieldCheck,
  Waves,
  Focus
} from 'lucide-react';

/**
 * NEUROSPHERE - DEEP WORK INTERFACE
 * * A professional-grade, minimalist brainwave visualization and 
 * focus tracking application inspired by the ElevenLabs aesthetic.
 */

// --- Shared UI Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyles = "px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl active:scale-95",
    secondary: "bg-white border border-gray-200 text-black hover:bg-gray-50 active:scale-95",
    ghost: "bg-transparent text-gray-600 hover:text-black hover:bg-gray-100"
  };

  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

const Card = ({ children, title, subtitle, className = "", headerAction = null }) => (
  <div className={`bg-white rounded-3xl border border-gray-100 p-8 shadow-sm transition-all duration-500 hover:shadow-md ${className}`}>
    {(title || subtitle) && (
      <div className="mb-6 flex justify-between items-start">
        <div>
          {title && <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {headerAction}
      </div>
    )}
    {children}
  </div>
);

const AppLayout = ({ children, onLogout, view }) => (
  <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-black selection:text-white overflow-x-hidden">
    <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-gray-50 md:border-none">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
          <BrainCircuit className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight uppercase">ClarityOS</span>
      </div>
      <div className="hidden lg:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-gray-400">
        <a href="#" className="hover:text-black transition-colors">Protocol</a>
        <a href="#" className="hover:text-black transition-colors">Hardware</a>
        <a href="#" className="hover:text-black transition-colors">Insights</a>
      </div>
      <div className="flex items-center gap-4">
        {view === 'dashboard' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-tighter">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Link Active
          </div>
        )}
        <Button variant="secondary" className="px-4 py-2 text-sm border-none bg-gray-50" onClick={onLogout}>
          <User size={16} />
        </Button>
      </div>
    </nav>
    <main className="max-w-7xl mx-auto px-6 pb-20">
      {children}
    </main>
  </div>
);

// --- 1. Launch Page ---
const LaunchPage = ({ onConnect }) => {
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => onConnect(), 2800);
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-8 border border-gray-100">
          DEEP WORK OPTIMIZATION ENGINE
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.95]">
          Quantify your <br />
          <span className="text-gray-300">inner focus.</span>
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed font-light">
          Unlock your cognitive peak. Connect your EEG device to measure flow state, eliminate distractions, and master deep work.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={handleSearch} disabled={isSearching} className="w-full sm:w-80 h-16 text-lg shadow-2xl shadow-black/20">
            {isSearching ? (
              <>
                <Bluetooth className="animate-spin text-gray-400" size={20} />
                Scanning for Link...
              </>
            ) : (
              <>
                Connect Device
                <ArrowRight size={20} />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40">
        {['CALIBRATED', 'REAL-TIME', 'PRIVATE', 'ENCRYPTED'].map(text => (
          <div key={text} className="text-[10px] font-bold tracking-[0.3em] text-gray-400">{text}</div>
        ))}
      </div>
    </div>
  );
};

// --- 2. Loading Page ---
const LoadingPage = () => {
  const [step, setStep] = useState(0);
  const steps = [
    "Establishing neural handshake...",
    "Sampling baseline brain activity...",
    "Isolating focus bandwidths...",
    "Syncing Deep Work metrics...",
    "Calibration complete."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-40 space-y-16">
      <div className="relative">
        <div className="w-40 h-40 border-[1px] border-gray-100 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 border-[3px] border-black rounded-full border-t-transparent animate-spin duration-700"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <BrainCircuit className="text-black w-12 h-12" />
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-lg font-bold tracking-[0.2em] text-gray-400 uppercase mb-6">System Handshake</h2>
        <div className="space-y-3">
          {steps.map((text, i) => (
            <div 
              key={i} 
              className={`text-sm transition-all duration-700 flex items-center justify-center gap-3 ${
                i === step ? "text-black font-semibold translate-x-0" : 
                i < step ? "text-green-500 opacity-40 -translate-y-1" : "text-gray-200 opacity-20 translate-y-1"
              }`}
            >
              {i < step ? <CheckCircle2 size={16} /> : i === step ? <Activity size={16} className="animate-pulse" /> : <div className="w-4" />}
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 3. Dashboard Page ---
const DashboardPage = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [focusScore, setFocusScore] = useState(84);
  const canvasRef = useRef(null);

  // Session Timer Logic
  useEffect(() => {
    let interval = null;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
        setFocusScore(prev => {
          const drift = Math.random() > 0.6 ? 1 : -1;
          return Math.min(Math.max(prev + drift, 75), 98);
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // EEG Visualizer
  useEffect(() => {
    let frame = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 1;
      for(let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isSessionActive ? '#000' : '#E5E7EB';
      
      const amplitude = isSessionActive ? 35 : 15;
      const speed = isSessionActive ? 0.08 : 0.02;

      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + 
          Math.sin(x * 0.01 + frame * speed) * amplitude + 
          Math.sin(x * 0.04 + frame * speed * 2) * (amplitude / 2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isSessionActive]);

  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Card 
          title="Session Protocol" 
          subtitle="Deep work tracking"
          className={isSessionActive ? "ring-2 ring-black ring-offset-4" : ""}
        >
          <div className="text-center py-8">
            <div className={`text-7xl font-bold tracking-tighter tabular-nums mb-2 ${isSessionActive ? 'text-black' : 'text-gray-200'}`}>
              {formatTime(seconds)}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">
              {isSessionActive ? 'Flow State Active' : 'Protocol Idle'}
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant={isSessionActive ? "secondary" : "primary"}
                onClick={() => setIsSessionActive(!isSessionActive)}
                className="w-full h-14"
              >
                {isSessionActive ? "Stop Deep Work" : "Enter Flow State"}
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Focus Depth" subtitle="Live Neural Intensity">
           <div className="flex items-end gap-2 mb-4 h-24">
             {[40, 60, 45, 80, 70, 90, 85, 95, 80].map((h, i) => (
               <div 
                 key={i} 
                 className={`flex-1 rounded-t-lg transition-all duration-1000 ${isSessionActive ? 'bg-black' : 'bg-gray-100'}`} 
                 style={{ height: isSessionActive ? `${h}%` : '20%' }}
               />
             ))}
           </div>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-8">
        <Card title="Neural Visualization" subtitle="Pre-frontal Cortex Telemetry">
          <div className="w-full h-80 bg-gray-50/50 rounded-3xl relative overflow-hidden">
             <canvas ref={canvasRef} width={1200} height={400} className="w-full h-full" />
             {!isSessionActive && (
               <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                 <p className="text-sm font-medium text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100">
                   Start session to activate telemetry
                 </p>
               </div>
             )}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Distraction Immunity', value: isSessionActive ? 'High' : '--', icon: ShieldCheck },
            { label: 'Cognitive Load', value: isSessionActive ? 'Optimal' : '--', icon: Focus },
            { label: 'Peak Flow', value: isSessionActive ? `${focusScore}%` : '0%', icon: Waves },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-50 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center"><stat.icon size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App Entry ---
export default function App() {
  const [view, setView] = useState('launch');

  const handleConnect = () => {
    setView('loading');
    setTimeout(() => setView('dashboard'), 6000);
  };

  return (
    <AppLayout onLogout={() => setView('launch')} view={view}>
      {view === 'launch' && <LaunchPage onConnect={handleConnect} />}
      {view === 'loading' && <LoadingPage />}
      {view === 'dashboard' && <DashboardPage />}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-[600px] bg-gradient-to-b from-gray-50/50 to-transparent"></div>
    </AppLayout>
  );
}