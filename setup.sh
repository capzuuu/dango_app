#!/bin/bash

# Dango App - Full Setup Script

echo "🚀 Setting up Dango App with Backend..."
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 To start developing:"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd server"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  npx expo start"
echo ""
echo "📚 Documentation:"
echo "  Frontend: README.md"
echo "  Backend:  server/README.md"
echo ""
