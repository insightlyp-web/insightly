#!/bin/bash
# Start the Next.js frontend

echo "=========================================="
echo "Starting Insightly Frontend"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from example..."
    cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://wekemzpplaowqdxyjgmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indla2VtenBwbGFvd3FkeHlqZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTc3MDYsImV4cCI6MjA3NzI5MzcwNn0.3LBnE7J7eUJFAKZYwjMAKteQCnTd8k19C8W1YiSUFu0
NEXT_PUBLIC_API_URL=https://insightly-backend-f847.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://insightly-backend-f847.onrender.com
EOF
    echo "✓ .env.local created"
    echo ""
fi

echo "Starting Next.js development server..."
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

