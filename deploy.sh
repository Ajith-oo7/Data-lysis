#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Datalysis deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production file with required environment variables"
    exit 1
fi

# Load environment variables
echo "📝 Loading environment variables..."
source .env.production

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose build
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose exec app npm run db:push

# Check if services are running
echo "🔍 Checking service health..."
if curl -s http://localhost:3000/health | grep -q "healthy"; then
    echo "✅ Application is healthy!"
else
    echo "❌ Application health check failed!"
    exit 1
fi

echo "✨ Deployment completed successfully!"
echo "🌐 Application is available at http://localhost:3000" 