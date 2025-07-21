# MaximAir

MaximAir is a modern radio station management system with podcast capabilities.

## Features

- Episode management
- Dynamic category system
- User authentication
- Admin dashboard
- Live streaming
- Playlists
- Community features

## Project Structure

- `frontend`: Next.js frontend application
- `backend`: Express.js backend API

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB

### Installation

1. Clone the repository
```bash
git clone https://github.com/Spythonian/MaximAir.git
cd MaximAir
```

2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables
```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```

4. Start development servers
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd ../frontend
npm run dev
```

## License

This project is licensed under the MIT License.