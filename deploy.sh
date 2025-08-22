#!/bin/bash

# ===========================================
# Script de Deploy para Produção
# ===========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
check_env_file() {
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found!"
        log_info "Please create .env.production based on .env.example"
        exit 1
    fi
    log_success ".env.production file found"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running!"
        log_info "Please start Docker and try again"
        exit 1
    fi
    log_success "Docker is running"
}

# Build and deploy
deploy() {
    log_info "Starting deployment process..."
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    
    # Remove old images
    log_info "Cleaning up old images..."
    docker system prune -f || true
    
    # Build new images
    log_info "Building new images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check health
    log_info "Checking application health..."
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Application is healthy!"
    else
        log_warning "Health check failed, but services are running"
    fi
    
    # Show running containers
    log_info "Running containers:"
    docker-compose -f docker-compose.prod.yml ps
    
    log_success "Deployment completed successfully!"
    log_info "Application is available at: http://localhost:3000"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    docker-compose -f docker-compose.prod.yml down
    # Here you could restore previous images if needed
    log_success "Rollback completed"
}

# Show logs
show_logs() {
    docker-compose -f docker-compose.prod.yml logs -f
}

# Main script
case "$1" in
    "deploy")
        check_env_file
        check_docker
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "logs")
        show_logs
        ;;
    "status")
        docker-compose -f docker-compose.prod.yml ps
        ;;
    "stop")
        log_info "Stopping all services..."
        docker-compose -f docker-compose.prod.yml down
        log_success "All services stopped"
        ;;
    "restart")
        log_info "Restarting services..."
        docker-compose -f docker-compose.prod.yml restart
        log_success "Services restarted"
        ;;
    "health")
        log_info "Checking application health..."
        if curl -f http://localhost:3000/api/health; then
            log_success "Application is healthy!"
        else
            log_error "Application health check failed!"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|logs|status|stop|restart|health}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application to production"
        echo "  rollback - Rollback the current deployment"
        echo "  logs     - Show application logs"
        echo "  status   - Show container status"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  health   - Check application health"
        exit 1
        ;;
esac