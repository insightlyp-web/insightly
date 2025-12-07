#!/bin/bash

# CampusAI - Start All Services Script
# This script starts ML Service, Backend, and Frontend simultaneously

echo "🚀 Starting CampusAI Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT TERM

# Start ML Service
echo -e "${BLUE}📊 Starting ML Service (Python FastAPI)...${NC}"
cd ml_service
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
uvicorn app:app --reload --port 8000 > ../ml_service.log 2>&1 &
ML_PID=$!
cd ..

# Wait a bit for ML service to start
sleep 2

# Start Backend
echo -e "${BLUE}🔧 Starting Backend (Node.js/Express)...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start Frontend
echo -e "${BLUE}⚛️  Starting Frontend (Next.js)...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services to start
sleep 3

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📊 ML Service:    http://localhost:8000"
echo "🔧 Backend API:   http://localhost:3001"
echo "⚛️  Frontend:      http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   - ML Service:  tail -f ml_service.log"
echo "   - Backend:     tail -f backend.log"
echo "   - Frontend:    tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background processes
wait

