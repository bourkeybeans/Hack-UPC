import { useState } from "react";

const API = "http://localhost:8000";

export default function ClarityOS() {
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState(null);
  const [view, setView] = useState("launch"); // launch | loading | connected


  // discover
  const discover = async () => {
    const res = await fetch(`${API}/devices/discover-devices`);
    const data = await res.json();
    setDevices(data);
  };

  // connect call
  const connect = async (address) => {
    setView("loading");

    await fetch(`${API}/devices/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    waitForConnection();
  };

  // connection wait
  const waitForConnection = () => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API}/devices/connection-status`);
      const data = await res.json();

      setStatus(data);

      if (data.isConnected) {
        clearInterval(interval);
        setView("connected");
      }
    }, 500);
  };

  // UI
  if (view === "launch") {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>ClarityOS</h1>

        <button onClick={discover}>
          Pair Brain Scanner
        </button>

        <div style={{ marginTop: 20 }}>
          {devices.map((d) => (
            <div key={d.address} style={{ marginBottom: 10 }}>
              <span>{d.name}</span>
              <button
                style={{ marginLeft: 10 }}
                onClick={() => connect(d.address)}
              >
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
        <p>Waiting for EEG connection</p>
      </div>
    );
  }

  if (view === "connected") {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>Connected ✅</h1>

        <p>Device: {status?.address}</p>
        <p>Status: {status?.isConnected ? "Live" : "Disconnected"}</p>

        <button
          onClick={async () => {
            await fetch(`${API}/devices/disconnect`, {
              method: "POST",
            });

            setView("launch");
            setDevices([]);
            setStatus(null);
          }}
        >
          Disconnect
        </button>
        <button onClick={startStream} >
          Start EEG Stream
        </button>
      </div>
    );
  }

  return null;
}