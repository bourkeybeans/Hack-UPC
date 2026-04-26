import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const WS_BASE = API.replace(/^http/, "ws");

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

export default function ProcessedWaves({ status, handleDisconnectDevice }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState(null);

  const wsRef = useRef(null);
  const chartRef = useRef(null);
  const chartCanvasRef = useRef(null);

  const maxPoints = 120;
  
  // Chart data state
  const chartDataRef = useRef({
    labels: [],
    datasets: [
      { label: 'Delta', data: [], borderColor: 'red', tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Theta', data: [], borderColor: 'orange', tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Alpha', data: [], borderColor: 'green', tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Beta', data: [], borderColor: 'blue', tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Gamma', data: [], borderColor: 'purple', tension: 0.4, pointRadius: 0, borderWidth: 2 },
    ]
  });

  // Focus Timer Logic
  useEffect(() => {
    let interval = null;
    if (isStreaming) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
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

  const resetChartData = () => {
    chartDataRef.current.labels = [];
    chartDataRef.current.datasets.forEach(ds => ds.data = []);
    setFocus(null);
    if (chartRef.current) {
      chartRef.current.update("none");
    }
  };

  const stopStreaming = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
  };

  const startStreaming = () => {
    if (wsRef.current) return;
    setError("");
    resetChartData();
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

        const eeg = payload.eeg;
        if (!eeg) return;

        const delta = Number(eeg.delta);
        const theta = Number(eeg.theta);
        const alpha = Number(eeg.alpha);
        const beta  = Number(eeg.beta);
        const gamma = Number(eeg.gamma);

        if (isNaN(delta) || isNaN(theta) || isNaN(alpha) || isNaN(beta) || isNaN(gamma)) {
           return;
        }

        const data = chartDataRef.current;
        data.labels.push("");

        data.datasets[0].data.push(delta);
        data.datasets[1].data.push(theta);
        data.datasets[2].data.push(alpha);
        data.datasets[3].data.push(beta);
        data.datasets[4].data.push(gamma);

        // rolling window
        if (data.labels.length > maxPoints) {
            data.labels.shift();
            data.datasets.forEach(ds => ds.data.shift());
        }

        // focus display
        if (eeg.focus !== undefined) {
            const f = Number(eeg.focus);
            if (!isNaN(f)) {
                setFocus(f);
            }
        }

        if (chartRef.current) {
            chartRef.current.update("none");
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

  useEffect(() => {
    return () => stopStreaming(); // Cleanup on unmount (tab switch)
  }, []);

  // Initialize Chart
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    const context = chartCanvasRef.current.getContext("2d");
    chartRef.current = new Chart(context, {
      type: "line",
      data: chartDataRef.current,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { 
            display: true,
            labels: { color: "#666" }
          },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            grace: '15%',
            ticks: { color: "#999" }
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
  }, []);

  return (
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
              {isStreaming ? 'Waves Processing Active' : 'Protocol Idle'}
            </p>
            {focus !== null && (
               <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                 <p className="text-xs font-bold text-gray-400 uppercase mb-1">Focus Level</p>
                 <p className="text-2xl font-bold text-black">{focus.toFixed(2)}</p>
               </div>
            )}
            <div className="flex flex-col gap-3">
              <Button 
                variant={isStreaming ? "secondary" : "primary"}
                onClick={isStreaming ? stopStreaming : startStreaming}
                className="w-full h-14"
              >
                {isStreaming ? "Stop Streaming" : "Enter Flow State"}
              </Button>
              <Button 
                variant="ghost"
                onClick={handleDisconnectDevice}
                className="w-full h-12 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Disconnect Device
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-8 space-y-8">
        <Card title="Neural Waves Visualization" subtitle="Processed Alpha, Beta, Gamma, Delta, Theta">
          <div className="w-full h-[420px] bg-gray-50/50 rounded-3xl relative overflow-hidden p-4">
             <div className="w-full h-full relative">
               <canvas ref={chartCanvasRef} />
             </div>
             {!isStreaming && (
               <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                 <p className="text-sm font-medium text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                   Start session to activate wave telemetry
                 </p>
               </div>
             )}
          </div>
        </Card>
        
        {error && (
          <p className="text-red-500 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
