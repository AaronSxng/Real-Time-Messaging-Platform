import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import NetworkLogs from "./components/NetworkLogs";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/chat"
          element={token ? <Chat /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route
          path="/network-logs"
          element={token ? <NetworkLogs /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
