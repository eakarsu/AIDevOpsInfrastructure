#!/bin/bash

# ============================================================
# AI DevOps Infrastructure Platform - Start Script
# Cleans ports, seeds database, starts backend & frontend
# with hot-reload monitoring for code changes
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🚀 AI DevOps Infrastructure Platform         ║${NC}"
echo -e "${CYAN}║  Auto-Scaling • Incident Response • Deployment ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓${NC} Loaded .env configuration"
else
  echo -e "${RED}✗ .env file not found! Creating default...${NC}"
  cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_devops_infrastructure
DB_USER=postgres
DB_PASSWORD=postgres
SERVER_PORT=3001
CLIENT_PORT=3000
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
JWT_SECRET=ai-devops-infra-secret-key-2024
ENVEOF
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓${NC} Created default .env"
fi

SERVER_PORT=${SERVER_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-3000}

# ---- Step 1: Clean ports ----
echo ""
echo -e "${BLUE}[1/6]${NC} Cleaning ports ${SERVER_PORT} and ${CLIENT_PORT}..."

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${YELLOW}Killing processes on port $port${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  echo -e "  ${GREEN}✓${NC} Port $port free"
}

cleanup_port $SERVER_PORT
cleanup_port $CLIENT_PORT

# ---- Step 2: Install dependencies ----
echo ""
echo -e "${BLUE}[2/6]${NC} Installing dependencies..."

cd "$SCRIPT_DIR/server"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  npm install --silent 2>&1 | tail -1
  echo -e "  ${GREEN}✓${NC} Server dependencies installed"
else
  echo -e "  ${GREEN}✓${NC} Server dependencies up to date"
fi

cd "$SCRIPT_DIR/client"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  npm install --silent 2>&1 | tail -1
  echo -e "  ${GREEN}✓${NC} Client dependencies installed"
else
  echo -e "  ${GREEN}✓${NC} Client dependencies up to date"
fi

cd "$SCRIPT_DIR"

# ---- Step 3: Setup PostgreSQL ----
echo ""
echo -e "${BLUE}[3/6]${NC} Setting up PostgreSQL database..."

DB_NAME=${DB_NAME:-ai_devops_infrastructure}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT_DB=${DB_PORT:-5432}

if ! pg_isready -h $DB_HOST -p $DB_PORT_DB -q 2>/dev/null; then
  echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
  if command -v brew &>/dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  fi
  sleep 2
fi

if psql -h $DB_HOST -p $DB_PORT_DB -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  ${GREEN}✓${NC} Database '$DB_NAME' exists"
else
  echo -e "  ${YELLOW}Creating database '$DB_NAME'...${NC}"
  createdb -h $DB_HOST -p $DB_PORT_DB -U $DB_USER "$DB_NAME" 2>/dev/null || \
    psql -h $DB_HOST -p $DB_PORT_DB -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo -e "  ${GREEN}✓${NC} Database created"
fi

# ---- Step 4: Seed database ----
echo ""
echo -e "${BLUE}[4/6]${NC} Seeding database (15 items per feature)..."

cd "$SCRIPT_DIR/server"
node seed.js 2>&1 | while IFS= read -r line; do echo -e "  $line"; done

# ---- Step 5: Start backend with nodemon ----
echo ""
echo -e "${BLUE}[5/6]${NC} Starting backend on port ${SERVER_PORT} (hot-reload via nodemon)..."

cd "$SCRIPT_DIR/server"
npx nodemon --watch . --ext js,json --ignore node_modules index.js &
SERVER_PID=$!
echo -e "  ${GREEN}✓${NC} Backend starting (PID: $SERVER_PID)"
sleep 2

# ---- Step 6: Start frontend ----
echo ""
echo -e "${BLUE}[6/6]${NC} Starting frontend on port ${CLIENT_PORT} (React hot-reload)..."

cd "$SCRIPT_DIR/client"
BROWSER=none PORT=$CLIENT_PORT npm start &
CLIENT_PID=$!
echo -e "  ${GREEN}✓${NC} Frontend starting (PID: $CLIENT_PID)"

# ---- Ready ----
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 AI DevOps Infrastructure Platform is starting!${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}   http://localhost:${CLIENT_PORT}"
echo -e "  ${CYAN}Backend:${NC}    http://localhost:${SERVER_PORT}"
echo -e "  ${CYAN}Health:${NC}     http://localhost:${SERVER_PORT}/api/health"
echo ""
echo -e "  ${YELLOW}Login:${NC}      admin@devops.io / password123"
echo ""
echo -e "  ${YELLOW}Hot-reload active:${NC}"
echo -e "    Server → nodemon watches .js/.json changes"
echo -e "    Client → React dev server watches all changes"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop all services"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $SERVER_PID 2>/dev/null || true
  kill $CLIENT_PID 2>/dev/null || true
  cleanup_port $SERVER_PORT
  cleanup_port $CLIENT_PORT
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM
wait
