#!/bin/bash

# Resume Grader Setup Script for Unix/Linux/macOS

echo "🚀 Setting up Resume Grader v0.1..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js found: $NODE_VERSION"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install API dependencies
echo "📦 Installing API dependencies..."
cd api
npm install

# Install Web dependencies
echo "📦 Installing Web dependencies..."
cd ../web
npm install

# Go back to root
cd ..

# Create .env file if it doesn't exist
if [ ! -f "api/.env" ]; then
    echo "📝 Creating environment file..."
    cp api/env.example api/.env
    echo "✅ Created api/.env - Please edit with your API keys"
else
    echo "✅ Environment file already exists"
fi

# Initialize database
echo "🗄️ Initializing database..."
cd api
npx prisma generate
npx prisma db push
npm run db:seed

echo "✅ Database initialized with sample data"

# Go back to root
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit api/.env with your API keys (optional for development)"
echo "2. Run 'npm run dev' to start both servers"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "API will be available at http://localhost:8080"
echo "Web app will be available at http://localhost:3000"



