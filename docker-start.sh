#!/bin/bash

# Docker Quick Start Script for Contract Management System
# This script helps you quickly get started with Docker

set -e

echo "🐳 Contract Management System - Docker Quick Start"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f env.docker.example ]; then
        cp env.docker.example .env
        echo "✅ Created .env from env.docker.example"
        echo "📝 Please edit .env file with your actual Supabase credentials before continuing."
        echo "   Required variables:"
        echo "   - NEXT_PUBLIC_SUPABASE_URL"
        echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "   - SUPABASE_SERVICE_ROLE_KEY"
        echo ""
        read -p "Press Enter after editing .env file to continue..."
    else
        echo "❌ env.docker.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Function to start development environment
start_dev() {
    echo "🚀 Starting development environment..."
    docker-compose -f docker-compose.dev.yml up --build
}

# Function to start production environment
start_prod() {
    echo "🚀 Starting production environment..."
    docker-compose up --build
}

# Function to stop all services
stop_services() {
    echo "🛑 Stopping all services..."
    docker-compose down
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    docker-compose ps
}

# Function to show logs
show_logs() {
    echo "📋 Recent logs:"
    docker-compose logs --tail=20
}

# Function to clean up
cleanup() {
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
}

# Main menu
while true; do
    echo ""
    echo "Choose an option:"
    echo "1) 🚀 Start Development Environment (with hot reload)"
    echo "2) 🚀 Start Production Environment"
    echo "3) 🛑 Stop All Services"
    echo "4) 📊 Show Service Status"
    echo "5) 📋 Show Recent Logs"
    echo "6) 🧹 Clean Up Docker Resources"
    echo "7) ❌ Exit"
    echo ""
    read -p "Enter your choice (1-7): " choice

    case $choice in
        1)
            start_dev
            break
            ;;
        2)
            start_prod
            break
            ;;
        3)
            stop_services
            ;;
        4)
            show_status
            ;;
        5)
            show_logs
            ;;
        6)
            cleanup
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please enter a number between 1-7."
            ;;
    esac
done

echo ""
echo "✅ Setup complete! Your application should be running at:"
echo "   🌐 http://localhost:3000"
echo "   🗄️  Database: localhost:5432"
echo ""
echo "📚 For more information, see DOCKER_SETUP.md"
echo "🔍 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
