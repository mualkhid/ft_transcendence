#!/bin/bash

echo "🎮 Starting Powerpuff Pong..."
echo "📦 Building project..."
npm run build

echo "🐳 Starting Docker container..."
npm run docker:compose

echo "✅ Game is starting up!"
echo "🌐 Open your browser and go to: http://localhost:8080"
echo ""
echo "🎯 Commands:"
echo "  Stop game: npm run docker:stop"
echo "  View logs: docker-compose logs -f"
echo "  Restart:  docker-compose restart"
