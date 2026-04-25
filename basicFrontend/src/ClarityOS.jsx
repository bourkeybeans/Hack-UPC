import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function ClarityOS() {
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState(null);
  const [view, setView] = useState("launch"); // launch | loading | connected
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState("");

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
      </div>
    );
  }

  return null;
}
