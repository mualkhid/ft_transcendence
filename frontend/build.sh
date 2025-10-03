#!/bin/bash

# Build script for Powerpuff Pong Frontend
echo "🔨 Building Powerpuff Pong Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔧 Compiling TypeScript and building CSS..."
npm run build

# Check if build was successful
if [ -f "dist/main.js" ] && [ -f "dist/output.css" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Files created:"
    ls -la dist/
    
    # Check if browser history functionality is included
    if grep -q "setupBrowserHistory" dist/main.js; then
        echo "🔗 Browser history functionality is included in the build"
    else
        echo "⚠️  Warning: Browser history functionality not found in build"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
