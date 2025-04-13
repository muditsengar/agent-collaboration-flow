#!/bin/bash

# Function to handle errors
handle_error() {
    echo "Error occurred on line $1"
    exit 1
}

# Set error handling
trap 'handle_error $LINENO' ERR

# Store the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Print header
echo "🚀 Starting Multi-Agent Collaboration System Setup..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
pip3 install -r requirements.txt

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$SCRIPT_DIR"
sudo npm install

# Start both services in parallel
echo "🚀 Starting services..."
cd "$SCRIPT_DIR/backend" && python3 main.py &
cd "$SCRIPT_DIR" && sudo npm run dev &

# Wait for both processes
wait

# Note: To stop both services, press Ctrl+C
echo "✅ Services started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:8000" 