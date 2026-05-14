function Chat() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{ width: "250px", backgroundColor: "#f0f0f0", padding: "20px" }}
      >
        <p>Sidebar</p>
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, padding: "20px" }}>
        <p>Main Chat</p>
      </div>
    </div>
  );
}

export default Chat;
