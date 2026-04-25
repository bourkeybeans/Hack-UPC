import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { 
  Activity, 
  User, 
  Bluetooth, 
  CheckCircle2, 
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Waves,
  Focus
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const WS_BASE = API.replace(/^http/, "ws");
const SAMPLE_RATE = 256;
const WINDOW_SECONDS = 5;
const MAX_SAMPLES = SAMPLE_RATE * WINDOW_SECONDS;
const CHANNEL_SPACING = 300;
const CHANNEL_COLORS = ["#00bcd4", "#f44336", "#4caf50", "#ff9800", "#9c27b0"];

Chart.register(...registerables);

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

const AppLayout = ({ children, onDisconnect, view }) => (
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
        {view === 'connected' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-tighter">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Link Active
          </div>
        )}
        <Button variant="secondary" className="px-4 py-2 text-sm border-none bg-gray-50" onClick={onDisconnect}>
          <User size={16} />
        </Button>
      </div>
    </nav>
    <main className="max-w-7xl mx-auto px-6 pb-20">
      {children}
    </main>
  </div>
);

// --- Launch Page ---
const LaunchPage = ({ discover, devices, connect, isDiscovering, error }) => {
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
          <Button onClick={discover} disabled={isDiscovering} className="w-full sm:w-80 h-16 text-lg shadow-2xl shadow-black/20">
            {isDiscovering ? (
              <>
                <Bluetooth className="animate-spin text-gray-400" size={20} />
                Scanning for Link...
              </>
            ) : (
              <>
                Discover Muse Devices
                <ArrowRight size={20} />
              </>
            )}
          </Button>
        </div>

        {error && (
          <p className="mt-6 text-red-500 max-w-xl mx-auto">{error}</p>
        )}

        {devices.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <h3 className="text-sm font-bold tracking-[0.2em] text-gray-400 uppercase mb-2">Available Devices</h3>
            {devices.map((d) => (
              <div key={d.address} className="flex items-center gap-4 bg-white px-6 py-4 rounded-full border border-gray-100 shadow-sm w-full max-w-md justify-between hover:shadow-md transition-shadow">
                <span className="font-medium text-gray-800">{d.name} <span className="text-xs text-gray-400">({d.address})</span></span>
                <Button variant="secondary" className="px-4 py-2 text-sm" onClick={() => connect(d.address)}>
                  Connect
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40">
        {['CALIBRATED', 'REAL-TIME', 'PRIVATE', 'ENCRYPTED'].map(text => (
          <div key={text} className="text-[10px] font-bold tracking-[0.3em] text-gray-400">{text}</div>
        ))}
      </div>
    </div>
  );
};

// --- Loading Page ---
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

// --- Main ClarityOS Component ---
export default function ClarityOS() {
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState(null);
  const [view, setView] = useState("launch"); // launch | loading | connected
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState("");
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);
  const chartRef = useRef(null);
  const chartCanvasRef = useRef(null);
  const eegBuffersRef = useRef(Array.from({ length: 5 }, () => []));

  // Session state
  const [seconds, setSeconds] = useState(0);
  const [focusScore, setFocusScore] = useState(84);

  // Focus Timer Logic
  useEffect(() => {
    let interval = null;
    if (isStreaming) {
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
  }, [isStreaming]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const discover = async () => {
    setIsDiscovering(true);
    setError("");

    try {
      const res = await fetch(`${API}/devices/discover-devices`);
      if (!res.ok) throw new Error(`Discover failed (${res.status})`);
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      setError(`Could not discover devices. Ensure backend is running on ${API}. ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const connect = async (address) => {
    setView("loading");
    setError("");

    try {
      const res = await fetch(`${API}/devices/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) throw new Error(`Connect failed (${res.status})`);
      waitForConnection();
    } catch (err) {
      setError(`Connection failed. ${err.message}`);
      setView("launch");
    }
  };

  const waitForConnection = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/devices/connection-status`);
        if (!res.ok) throw new Error(`Status failed (${res.status})`);
        const data = await res.json();
        setStatus(data);

        if (data.isConnected) {
          clearInterval(interval);
          setView("connected");
        }
      } catch (err) {
        clearInterval(interval);
        setError(`Could not read connection status. ${err.message}`);
        setView("launch");
      }
    }, 500);
  };

  const stopStreaming = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
  };

  const updateChart = () => {
    if (!chartRef.current) return;
    const buffers = eegBuffersRef.current;
    const length = buffers[0]?.length || 0;
    chartRef.current.data.labels = Array.from({ length }, (_, i) => i);
    chartRef.current.data.datasets.forEach((dataset, channelIndex) => {
      const channel = buffers[channelIndex] || [];
      dataset.data = channel.map((value) => value + channelIndex * CHANNEL_SPACING);
    });
    chartRef.current.update("none");
  };

  const pushEegFrame = (frame) => {
    const channels = frame?.data;
    if (!Array.isArray(channels)) return;

    channels.forEach((samples, index) => {
      if (!Array.isArray(samples) || !eegBuffersRef.current[index]) return;
      eegBuffersRef.current[index].push(...samples.map(Number));
      if (eegBuffersRef.current[index].length > MAX_SAMPLES) {
        eegBuffersRef.current[index] = eegBuffersRef.current[index].slice(-MAX_SAMPLES);
      }
    });
    updateChart();
  };

  const resetEegBuffers = () => {
    eegBuffersRef.current = Array.from({ length: 5 }, () => []);
    if (chartRef.current) {
      chartRef.current.data.labels = [];
      chartRef.current.data.datasets.forEach((dataset) => {
        dataset.data = [];
      });
      chartRef.current.update("none");
    }
  };

  const startStreaming = () => {
    if (wsRef.current) return;
    setError("");
    resetEegBuffers();
    const socket = new WebSocket(`${WS_BASE}/eeg/stream`);
    wsRef.current = socket;

    socket.onopen = () => setIsStreaming(true);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.error) {
          setError(payload.error);
          stopStreaming();
          return;
        }
        if (payload.eeg) {
          pushEegFrame(payload.eeg);
        }
      } catch {
        setError("Invalid EEG stream payload.");
      }
    };
    socket.onerror = () => setError("Could not open EEG websocket.");
    socket.onclose = () => {
      wsRef.current = null;
      setIsStreaming(false);
    };
  };

  const handleDisconnectDevice = async () => {
    stopStreaming();
    try {
      await fetch(`${API}/devices/disconnect`, { method: "POST" });
    } catch (e) {
      console.warn("Disconnect request failed", e);
    }
    setView("launch");
    setDevices([]);
    setStatus(null);
    resetEegBuffers();
  };

  useEffect(() => {
    return () => stopStreaming();
  }, []);

  // Initialize Chart when entering 'connected' view
  useEffect(() => {
    if (view !== "connected" || !chartCanvasRef.current) return;

    const context = chartCanvasRef.current.getContext("2d");
    chartRef.current = new Chart(context, {
      type: "line",
      data: {
        labels: [],
        datasets: Array.from({ length: 5 }, (_, index) => ({
          label: `Ch ${index + 1}`,
          data: [],
          borderColor: CHANNEL_COLORS[index],
          borderWidth: 1.4,
          pointRadius: 0,
          tension: 0.15,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: {
            display: false,
            suggestedMin: -500,
            suggestedMax: CHANNEL_SPACING * 5,
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [view]);

  return (
    <AppLayout onDisconnect={handleDisconnectDevice} view={view}>
      {view === 'launch' && (
        <LaunchPage 
          discover={discover} 
          devices={devices} 
          connect={connect} 
          isDiscovering={isDiscovering} 
          error={error} 
        />
      )}
      {view === 'loading' && <LoadingPage />}
      {view === 'connected' && (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card 
              title="Session Protocol" 
              subtitle={`Device: ${status?.address || 'Unknown'}`}
              className={isStreaming ? "ring-2 ring-black ring-offset-4" : ""}
            >
              <div className="text-center py-8">
                <div className={`text-7xl font-bold tracking-tighter tabular-nums mb-2 ${isStreaming ? 'text-black' : 'text-gray-200'}`}>
                  {formatTime(seconds)}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">
                  {isStreaming ? 'Flow State Active' : 'Protocol Idle'}
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    variant={isStreaming ? "secondary" : "primary"}
                    onClick={isStreaming ? stopStreaming : startStreaming}
                    className="w-full h-14"
                  >
                    {isStreaming ? "Stop Streaming" : "Enter Flow State"}
                  </Button>
                </div>
              </div>
            </Card>

            <Card title="Focus Depth" subtitle="Live Neural Intensity">
               <div className="flex items-end gap-2 mb-4 h-24">
                 {[40, 60, 45, 80, 70, 90, 85, 95, 80].map((h, i) => (
                   <div 
                     key={i} 
                     className={`flex-1 rounded-t-lg transition-all duration-1000 ${isStreaming ? 'bg-black' : 'bg-gray-100'}`} 
                     style={{ height: isStreaming ? `${h}%` : '20%' }}
                   />
                 ))}
               </div>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <Card title="Neural Visualization" subtitle="Pre-frontal Cortex Telemetry">
              <div className="w-full h-80 bg-gray-50/50 rounded-3xl relative overflow-hidden flex items-center justify-center p-4">
                 <div className="w-full h-full relative">
                   <canvas ref={chartCanvasRef} />
                 </div>
                 {!isStreaming && (
                   <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                     <p className="text-sm font-medium text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                       Start session to activate telemetry
                     </p>
                   </div>
                 )}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Distraction Immunity', value: isStreaming ? 'High' : '--', icon: ShieldCheck },
                { label: 'Cognitive Load', value: isStreaming ? 'Optimal' : '--', icon: Focus },
                { label: 'Peak Flow', value: isStreaming ? `${focusScore}%` : '0%', icon: Waves },
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

            {error && (
              <p className="text-red-500 font-medium">{error}</p>
            )}
          </div>
        </div>
      )}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-[600px] bg-gradient-to-b from-gray-50/50 to-transparent"></div>
    </AppLayout>
  );
}
