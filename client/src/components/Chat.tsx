import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

type Conversation = {
  id: number;
  name: string;
  is_group: boolean;
};

type Message = {
  id: number;
  sender: string;
  text: string;
};

type UserItem = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
};

const API = "http://localhost:8000";

function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvID, setActiveConvID] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);

  const token = localStorage.getItem("token");

  const activeConv = conversations.find((conv) => conv.id === activeConvID);
  const ws = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeConvID || !token) return;

    const socket = new WebSocket(
      `ws://localhost:8000/ws/${activeConvID}?token=${token}`,
    );
    ws.current = socket;

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const newMessage: Message = {
        id: msg.id,
        sender: msg.sent_by || `User ${msg.sender_id}`,
        text: msg.content,
      };
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.onerror = () => console.error("WebSocket error");

    return () => socket.close();
  }, [activeConvID]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetch(`${API}/conversations?token=${token}`)
      .then((res) => res.json())
      .then(setConversations)
      .catch(console.error);
  }, []);

  const sendMessage = () => {
    if (
      !input.trim() ||
      !ws.current ||
      ws.current.readyState !== WebSocket.OPEN
    )
      return;
    ws.current.send(JSON.stringify({ content: input }));
    setInput("");
  };

  const openNewChat = () => {
    fetch(`${API}/users?token=${token}`)
      .then((res) => res.json())
      .then(setUsers)
      .catch(console.error);
    setShowNewChat(true);
  };

  const startChat = async (userID: number) => {
    const res = await fetch(`${API}/conversations?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: [userID] }),
    });
    const data = await res.json();
    setActiveConvID(data.conversation_id);
    setShowNewChat(false);
    fetch(`${API}/conversations?token=${token}`)
      .then((res) => res.json())
      .then(setConversations)
      .catch(console.error);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{ width: "250px", backgroundColor: "#f0f0f0", padding: "20px" }}
      >
        <p>Messages</p>
        <button onClick={openNewChat} style={{ marginBottom: "20px" }}>
          + New Chat
        </button>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => {
              setActiveConvID(conv.id);
              setMessages([]);
              fetch(`${API}/conversations/${conv.id}/messages?token=${token}`)
                .then((res) => res.json())
                .then((data) => {
                  const formatted = data.map((msg: any) => ({
                    id: msg.id,
                    sender: msg.sent_by || `User ${msg.sender_id}`,
                    text: msg.content,
                  }));
                  setMessages(formatted);
                })
                .catch(console.error);
            }}
            style={{
              padding: "10px",
              cursor: "pointer",
              backgroundColor:
                conv.id === activeConvID ? "#ddd" : "transparent",
            }}
          >
            {conv.name} {conv.is_group && "(Group)"}
          </div>
        ))}
        {showNewChat && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 8,
                padding: 24,
                width: 320,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <strong>New Chat</strong>
                <button onClick={() => setShowNewChat(false)}>✕</button>
              </div>
              {users.length === 0 ? (
                <div style={{ color: "#888" }}>No other users found</div>
              ) : (
                users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => startChat(u.id)}
                    style={{
                      padding: "10px 0",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {u.first_name} {u.last_name}{" "}
                    <span style={{ color: "#888" }}>@{u.username}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, padding: "20px" }}>
        <p>Main Chat</p>
        {activeConv ? (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            <strong style={{ display: "block", marginBottom: "10px" }}>
              {activeConv.name}
            </strong>
            {messages.map((message) => (
              <div key={message.id} style={{ marginBottom: "10px" }}>
                <strong>{message.sender}:</strong> {message.text}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                style={{ flex: 1 }}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        ) : (
          <div
            style={{ border: "1px solid #ccc", height: "80%", padding: "10px" }}
          >
            <strong>Select a conversation</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
