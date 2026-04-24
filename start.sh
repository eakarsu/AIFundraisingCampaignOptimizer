#!/bin/bash

# AI Fundraising Campaign Optimizer - Start Script
# This script sets up and starts the entire application

set -e

echo "============================================"
echo "  AI Fundraising Campaign Optimizer"
echo "  Starting Application..."
echo "============================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Project root
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# ==========================================
# 1. Kill processes on ports 3000 and 3001
# ==========================================
echo -e "\n${YELLOW}[1/6] Cleaning up ports...${NC}"

kill_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  Port $port is free"
  fi
}

kill_port 3000
kill_port 3001

# ==========================================
# 2. Check for .env file
# ==========================================
echo -e "\n${YELLOW}[2/6] Checking environment...${NC}"
if [ ! -f .env ]; then
  echo -e "${RED}ERROR: .env file not found!${NC}"
  echo "Create a .env file with:"
  echo "  DATABASE_URL=postgresql://fundraiser_user:fundraiser_pass@localhost:5432/fundraiser_db"
  echo "  OPENROUTER_API_KEY=your-key-here"
  echo "  OPENROUTER_MODEL=anthropic/claude-haiku-4.5"
  echo "  JWT_SECRET=your-secret"
  echo "  SERVER_PORT=3001"
  echo "  CLIENT_PORT=3000"
  exit 1
fi
echo -e "  ${GREEN}.env file found${NC}"

# Load env vars
set -a
source .env
set +a

# ==========================================
# 3. Check PostgreSQL and setup database
# ==========================================
echo -e "\n${YELLOW}[3/6] Setting up PostgreSQL...${NC}"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
  echo -e "${RED}ERROR: PostgreSQL is not installed.${NC}"
  echo "Install with: brew install postgresql@15"
  exit 1
fi

# Try to start PostgreSQL if not running
if ! pg_isready -q 2>/dev/null; then
  echo -e "  Starting PostgreSQL..."
  brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi

if pg_isready -q 2>/dev/null; then
  echo -e "  ${GREEN}PostgreSQL is running${NC}"
else
  echo -e "${RED}ERROR: Could not connect to PostgreSQL${NC}"
  echo "Please start PostgreSQL manually"
  exit 1
fi

# Create user and database if they don't exist
echo -e "  Setting up database..."
psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='fundraiser_user'" | grep -q 1 || \
  psql postgres -c "CREATE USER fundraiser_user WITH PASSWORD 'fundraiser_pass' CREATEDB;" 2>/dev/null || true

psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='fundraiser_db'" | grep -q 1 || \
  psql postgres -c "CREATE DATABASE fundraiser_db OWNER fundraiser_user;" 2>/dev/null || true

echo -e "  ${GREEN}Database ready${NC}"

# ==========================================
# 4. Install dependencies
# ==========================================
echo -e "\n${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  Installing server dependencies..."
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1

echo -e "  Installing client dependencies..."
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1

echo -e "  ${GREEN}Dependencies installed${NC}"

# ==========================================
# 5. Seed database
# ==========================================
echo -e "\n${YELLOW}[5/6] Seeding database...${NC}"
cd "$PROJECT_DIR/server"
node seed.js
echo -e "  ${GREEN}Database seeded${NC}"

# ==========================================
# 6. Start application with hot-reload
# ==========================================
echo -e "\n${YELLOW}[6/6] Starting application...${NC}"

# Start server with nodemon (auto-reload)
cd "$PROJECT_DIR/server"
echo -e "  Starting backend on port ${SERVER_PORT:-3001}..."
npx nodemon index.js &
SERVER_PID=$!

# Start client with Vite (hot-reload built in)
cd "$PROJECT_DIR/client"
echo -e "  Starting frontend on port ${CLIENT_PORT:-3000}..."
npx vite --port ${CLIENT_PORT:-3000} &
CLIENT_PID=$!

# Wait for services to start
sleep 3

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Application is running!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:${CLIENT_PORT:-3000}"
echo -e "  ${BLUE}Backend:${NC}   http://localhost:${SERVER_PORT:-3001}"
echo ""
echo -e "  ${YELLOW}Login:${NC}     admin@fundraiser.org / password123"
echo -e "  ${YELLOW}Hot reload:${NC} Enabled for both frontend and backend"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services"
echo ""

# Trap to clean up on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill $SERVER_PID 2>/dev/null || true
  kill $CLIENT_PID 2>/dev/null || true
  kill_port 3000
  kill_port 3001
  echo -e "${GREEN}Goodbye!${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
