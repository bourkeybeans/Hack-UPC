import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const WS_BASE = API.replace(/^http/, "ws");
const SAMPLE_RATE = 256;
const WINDOW_SECONDS = 5;
const MAX_SAMPLES = SAMPLE_RATE * WINDOW_SECONDS;
const CHANNEL_SPACING = 300;
const CHANNEL_COLORS = ["#00bcd4", "#f44336", "#4caf50", "#ff9800", "#9c27b0"];

Chart.register(...registerables);

export default function ClarityOS() {
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState(null);
  const [view, setView] = useState("launch"); // launch | loading | connected
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);
  const chartRef = useRef(null);
  const chartCanvasRef = useRef(null);
  const eegBuffersRef = useRef(Array.from({ length: 5 }, () => []));

  const discover = async () => {
    setIsDiscovering(true);
    setError("");

    try {
      const res = await fetch(`${API}/devices/discover-devices`);
      if (!res.ok) {
        throw new Error(`Discover failed (${res.status})`);
      }
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      setError(
        `Could not discover devices. Ensure backend is running on ${API}. ${err.message}`
      );
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

      if (!res.ok) {
        throw new Error(`Connect failed (${res.status})`);
      }

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
        if (!res.ok) {
          throw new Error(`Status failed (${res.status})`);
        }
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
    if (wsRef.current) {
      return;
    }

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

    socket.onerror = () => {
      setError("Could not open EEG websocket.");
    };

    socket.onclose = () => {
      wsRef.current = null;
      setIsStreaming(false);
    };
  };

  useEffect(() => {
    return () => stopStreaming();
  }, []);

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
          legend: { position: "top" },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            title: { display: true, text: "Samples (rolling window)" },
            ticks: { maxTicksLimit: 8 },
          },
          y: {
            title: { display: true, text: "Amplitude (uV), channel-stacked" },
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

  if (view === "launch") {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>ClarityOS</h1>

        <button onClick={discover} disabled={isDiscovering}>
          {isDiscovering ? "Discovering..." : "Discover Muse Devices"}
        </button>

        {error && (
          <p style={{ marginTop: 12, color: "crimson", maxWidth: 680 }}>{error}</p>
        )}

        <div style={{ marginTop: 20 }}>
          {devices.map((d) => (
            <div key={d.address} style={{ marginBottom: 10 }}>
              <span>{d.name}</span>
              <button style={{ marginLeft: 10 }} onClick={() => connect(d.address)}>
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "loading") {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h2>Connecting...</h2>
        <p>Waiting for Muse headset connection</p>
      </div>
    );
  }

  if (view === "connected") {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>Connected ✅</h1>

        <p>Device: {status?.address}</p>
        <p>Status: {status?.isConnected ? "Live" : "Disconnected"}</p>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={startStreaming} disabled={isStreaming}>
            {isStreaming ? "Streaming..." : "Start EEG Stream"}
          </button>
          <button onClick={stopStreaming} disabled={!isStreaming}>
            Stop EEG Stream
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            width: "100%",
            maxWidth: 1100,
            height: 420,
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 10,
            background: "#fff",
          }}
        >
          <canvas ref={chartCanvasRef} />
        </div>

        <button
          onClick={async () => {
            stopStreaming();
            await fetch(`${API}/devices/disconnect`, {
              method: "POST",
            });

            setView("launch");
            setDevices([]);
            setStatus(null);
            resetEegBuffers();
          }}
          style={{ marginTop: 12 }}
        >
          Disconnect
        </button>

        {error && (
          <p style={{ marginTop: 12, color: "crimson", maxWidth: 680 }}>{error}</p>
        )}
      </div>
    );
  }

  return null;
}
