# Flow CRM Frontend - Justfile
# Simple task runner for development

# Load environment variables from .env.development
set dotenv-load := true
set dotenv-filename := ".env.dev"

# Default recipe (runs when you just type 'just')
default:
    @just --list

# Run the development server
dev:
    @echo "🚀 Starting Flow CRM Frontend Development Server..."
    @echo "📡 API URL: ${VITE_API_BASE_URL}"
    @echo "🔌 WebSocket URL: ${VITE_WS_URL}"
    @echo ""
    bun run dev

# Alternative alias for 'dev'
serve: dev

# Build for production
build:
    @echo "🏗️  Building for production..."
    bun run build

# Preview production build
preview:
    @echo "👀 Previewing production build..."
    bun run preview

# Install dependencies
install:
    @echo "📦 Installing dependencies..."
    bun install

# Run linter
lint:
    @echo "🔍 Running linter..."
    bun run lint

# Clean build artifacts
clean:
    @echo "🧹 Cleaning build artifacts..."
    rm -rf dist
    rm -rf node_modules/.vite

# Show environment variables
env:
    @echo "Environment Configuration:"
    @echo "=========================="
    @echo "API_BASE_URL: ${VITE_API_BASE_URL}"
    @echo "WS_URL: ${VITE_WS_URL}"
    @echo "APP_NAME: ${VITE_APP_NAME}"
    @echo "APP_VERSION: ${VITE_APP_VERSION}"

