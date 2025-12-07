#!/bin/bash

# Insightly - Local Development Startup Script
# Starts all services (ML Service, Backend, Frontend) for local development

echo "🚀 Starting Insightly Services for Local Development..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT TERM

# Check if directories exist
if [ ! -d "ml_service" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Required directories not found!${NC}"
    echo "Make sure you're in the Insightly root directory."
    exit 1
fi

# Start ML Service
echo -e "${BLUE}📊 Starting ML Service (Python FastAPI) on port 8000...${NC}"
cd ml_service
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}   ❌ Failed to activate virtual environment${NC}"
    exit 1
fi

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "   Installing Python dependencies..."
    pip install -r requirements.txt
fi

uvicorn app:app --reload --host 0.0.0.0 --port 8000 > ../ml_service.log 2>&1 &
ML_PID=$!
cd ..
sleep 3

# Start Backend
echo -e "${BLUE}🔧 Starting Backend (Node.js/Express) on port 3001...${NC}"
cd backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}   ⚠️  .env file not found. Creating from template...${NC}"
    cat > .env << EOF
DATABASE_URL=postgresql://postgres.wekemzpplaowqdxyjgmt:WZLsZW6nwM2N3ylv@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://wekemzpplaowqdxyjgmt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTc3MDYsImV4cCI6MjA3NzI5MzcwNn0.3LBnE7J7eUJFAKZYwjMAKteQCnTd8k19C8W1YiSUFu0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTcxNzcwNiwiZXhwIjoyMDc3MjkzNzA2fQ.O7zW2XF6jwv3gYFLsrPyQyRyzo98AYKSg8zQiq3QswA
GROQ_API_KEY=your_groq_api_key_here
ML_SERVICE_URL=http://localhost:8000
EOF
    echo -e "${YELLOW}   ⚠️  Please update GROQ_API_KEY in backend/.env${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   Installing Node.js dependencies..."
    npm install
fi

npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 3

# Start Frontend
echo -e "${BLUE}⚛️  Starting Frontend (Next.js) on port 3000...${NC}"
cd frontend

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "   Creating .env.local for local development..."
    cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://wekemzpplaowqdxyjgmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTc3MDYsImV4cCI6MjA3NzI5MzcwNn0.3LBnE7J7eUJFAKZYwjMAKteQCnTd8k19C8W1YiSUFu0
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
EOF
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "   Installing Node.js dependencies..."
    npm install
fi

npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services to start
sleep 5

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📍 Service URLs:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📊 ML Service:    http://localhost:8000"
echo "   📊 ML Docs:       http://localhost:8000/docs"
echo "   🔧 Backend API:   http://localhost:3001"
echo "   🔧 Health Check:  http://localhost:3001/_health"
echo "   ⚛️  Frontend:      http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📝 View Logs:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   tail -f ml_service.log"
echo "   tail -f backend.log"
echo "   tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all background processes
wait

