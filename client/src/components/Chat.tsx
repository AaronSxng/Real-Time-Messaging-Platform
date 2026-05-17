import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Types: descripe shape of data
type Conversation = {
  id: number;
  name: string;
  username?: string;
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

type CurrentUser = {
  username: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
};

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

function Chat() {
  // State variables: hold data and UI state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvID, setActiveConvID] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Refs and navigation
  const token = localStorage.getItem("token");
  const activeConv = conversations.find((conv) => conv.id === activeConvID);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Effect: manage WebSocket connection for active conversation
  useEffect(() => {
    if (!activeConvID || !token) return;

    const socket = new WebSocket(`${WS}/ws/${activeConvID}?token=${token}`);
    ws.current = socket;

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const newMessage: Message = {
        id: msg.id,
        sender: msg.full_name || msg.sent_by || `User ${msg.sender_id}`,
        text: msg.content,
      };
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.onerror = () => console.error("WebSocket error");
    return () => socket.close();
  }, [activeConvID]); // reconnect when active conversation changes

  // Effect: fetch conversations on mount and check auth
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetch(`${API}/conversations?token=${token}`)
      .then((res) => res.json())
      .then(setConversations)
      .catch(console.error);
    fetch(`${API}/auth/me?token=${token}`)
      .then((res) => res.json())
      .then(setCurrentUser)
      .catch(console.error);
  }, []);

  // Effect: scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const startChat = async (user: UserItem) => {
    const existing = conversations.find(
      (conv) => !conv.is_group && conv.username === user.username,
    );
    if (existing) {
      setActiveConvID(existing.id);
      setMessages([]);
      fetch(`${API}/conversations/${existing.id}/messages?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(
            data.map(
              (msg: {
                id: number;
                sender_id: number;
                full_name: string;
                sent_by: string;
                content: string;
              }) => ({
                id: msg.id,
                sender: msg.full_name || msg.sent_by || `User ${msg.sender_id}`,
                text: msg.content,
              }),
            ),
          );
        });
      setShowNewChat(false);
      return;
    }
    const res = await fetch(`${API}/conversations?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: [user.id] }),
    });
    const data = await res.json();
    setActiveConvID(data.conversation_id);
    setShowNewChat(false);
    fetch(`${API}/conversations?token=${token}`)
      .then((res) => res.json())
      .then(setConversations)
      .catch(console.error);
  };

  const logout = () => {
    ws.current?.close();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{ width: "250px", backgroundColor: "#f0f0f0", padding: "20px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <p style={{ fontWeight: "bold", margin: 0 }}>Messages</p>
          <button onClick={logout}>Logout</button>
          {currentUser?.is_admin && (
            <button onClick={() => navigate("/network-logs")}>
              Network Logs
            </button>
          )}
        </div>
        {currentUser && (
          <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>
            {`@${currentUser.username} | ${currentUser.first_name} ${currentUser.last_name}`}
          </p>
        )}
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
                  const formatted = data.map(
                    (msg: {
                      id: number;
                      sender_id: number;
                      full_name: string;
                      sent_by: string;
                      content: string;
                    }) => ({
                      id: msg.id,
                      sender:
                        msg.full_name || msg.sent_by || `User ${msg.sender_id}`,
                      text: msg.content,
                    }),
                  );
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
                    onClick={() => startChat(u)}
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
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 80px)",
              border: "1px solid #ccc",
              padding: "10px",
            }}
          >
            <strong style={{ display: "block", marginBottom: "10px" }}>
              {activeConv.username
                ? `@${activeConv.username} | ${activeConv.name}`
                : activeConv.name}
            </strong>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{ marginBottom: "10px", textAlign: "left" }}
                >
                  <strong>{message.sender}:</strong> {message.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
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
