
# Real-Time Messaging Platform

Full-stack secure messaging application built with React, FastAPI, and PostgreSQL. Features real-time chat using WebSockets, JWT authentication, and an admin network monitoring dashboard.

**Live Demo:** https://real-time-messaging-platform-client.onrender.com

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| Backend | FastAPI, SQLAlchemy, Python 3.12 |
| Database | PostgreSQL |
| Real-time | WebSockets |
| Auth | JWT |
| DevOps | Docker, GitHub Actions CI/CD, Render |

---

## Features

- Real-time messaging with WebSocket connections
- JWT-based authentication (register / login)
- Direct message conversations
- Admin network log dashboard -- monitors HTTP and WebSocket traffic
- CI/CD pipeline via GitHub Actions with auto-deploy to Render

---

---

## Project Structure

```
├── client/                        # React frontend
│   ├── public/
│   │   └── favicon.svg            # Website icon
│   └── src/
│       ├── components/
│       │   ├── Login.tsx          # Login form
│       │   ├── Register.tsx       # Registration form
│       │   ├── Chat.tsx           # Main chat UI with WebSocket messaging
│       │   └── NetworkLogs.tsx    # Admin network monitoring dashboard
│       ├── App.tsx                # Route definitions
│       └── main.tsx               # React entry point
│
├── server/                        # FastAPI backend
│   ├── models/
│   │   ├── conversation.py        # Conversations table
│   │   ├── conversationMember.py  # Links users to conversations
│   │   ├── messages.py            # Messages table
│   │   ├── network_log.py         # Network events table
│   │   └── user.py                # Users table
│   ├── routers/
│   │   ├── auth.py                # Register, login, /me endpoints
│   │   ├── messages.py            # Conversations and users endpoints
│   │   ├── network_log.py         # Network event logger and /network-logs endpoint
│   │   └── websocket.py           # WebSocket handler and message broadcast
│   ├── database.py                # SQLAlchemy async database connection
│   └── main.py                    # App entry point, middleware, router registration
│
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI pipeline
├── docker-compose.yml              # Runs backend, frontend, and database containers
└── README.md
```


## Screenshots

**Login**
![Login](https://github.com/user-attachments/assets/ad1fd250-8ff0-4eae-ae6d-187ad3467139)

**Register**
![Register](https://github.com/user-attachments/assets/79f87ecc-7d57-433c-9bc5-511da347a078)

**Chat**
![Chat](https://github.com/user-attachments/assets/ae7c87b8-a925-4579-9151-655e31943e31)

**Network Logs**
![Network Logs](https://github.com/user-attachments/assets/8255c670-d1bd-4ccb-b303-241eb007d6a2)

---

## Installation

### Prerequisites
- [Git](https://git-scm.com/)
- [Docker + Docker Compose](https://docs.docker.com/get-docker/) (Method 1)
- [Node.js 20+](https://nodejs.org/) and [Python 3.12+](https://www.python.org/) (Method 2)

---

### Method 1: Docker (Recommended)

**1. Clone the repo**
```bash
git clone https://github.com/AaronSxng/Real-Time-Messaging-Platform.git
cd Real-Time-Messaging-Platform
```

**2. Create `client/.env.development`**

```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

**3. Start all services**

```bash
docker compose up --build
```

**4. Open** `http://localhost:5173`

----------

### Method 2: Without Docker

**1. Database**

Requires PostgreSQL running locally. Create a database called `mydb` with user `myuser` and password `mypassword`.

**2. Backend**

```bash
cd server
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `server/.env`:

```
SECRET_KEY=your-secret-key
DB_HOST=localhost
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=mydb
```

Start the server:

```bash
uvicorn main:app --reload
```

**3. Frontend**

```bash
cd client
npm install
```

Create `client/.env.development`:

```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

**4. Open** `http://localhost:5173`

----------

## Admin Setup

After registering an account, grant admin access by running:

```bash
docker exec -it postgres_db psql -U myuser -d mydb -c "UPDATE users SET is_admin = TRUE WHERE username = 'yourusername';"
```

Replace `yourusername` with your account username. Admins can access the network log dashboard from the sidebar.
