import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type LogEntry = {
  id: number;
  timestamp: string;
  protocol: string;
  src_ip: string;
  src_port: number;
  dst_port: number;
  latency_ms: number;
  osi_layer: number;
  osi_name: string;
};

const API = "http://localhost:8000";

function NetworkLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetch(`${API}/network-logs?token=${token}`)
      .then((res) => {
        if (res.status === 403) throw new Error("Admins only");
        return res.json();
      })
      .then(setLogs)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <button onClick={() => navigate("/chat")}>← Back</button>
        <h2 style={{ margin: 0 }}>Network Logs</h2>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Timestamp</th>
            <th style={{ padding: 8 }}>Protocol</th>
            <th style={{ padding: 8 }}>OSI Layer</th>
            <th style={{ padding: 8 }}>Src IP</th>
            <th style={{ padding: 8 }}>Src Port</th>
            <th style={{ padding: 8 }}>Dst Port</th>
            <th style={{ padding: 8 }}>Latency (ms)</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td style={{ padding: 8 }}>{log.protocol}</td>
              <td style={{ padding: 8 }}>
                L{log.osi_layer} — {log.osi_name}
              </td>
              <td style={{ padding: 8 }}>{log.src_ip}</td>
              <td style={{ padding: 8 }}>{log.src_port}</td>
              <td style={{ padding: 8 }}>{log.dst_port}</td>
              <td style={{ padding: 8 }}>{log.latency_ms}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NetworkLogs;
