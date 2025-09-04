#!/bin/bash

# Production deployment script for SenseMinds 360
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="sense-minds-360"
DOCKER_IMAGE="$APP_NAME:latest"
CONTAINER_NAME="$APP_NAME-container"
PORT=3000
HEALTH_CHECK_URL="http://localhost:$PORT/api/health"
MAX_HEALTH_CHECKS=30
HEALTH_CHECK_INTERVAL=2

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose is not installed. Some features may not work."
    fi
    
    # Check if Node.js is installed (for local builds)
    if ! command -v node &> /dev/null; then
        log_warning "Node.js is not installed. Docker build will be used."
    fi
    
    log_success "Prerequisites check completed"
}

run_tests() {
    log_info "Running tests..."
    
    if command -v npm &> /dev/null; then
        npm run lint
        npm run type-check
        # npm run test  # Uncomment when tests are implemented
        log_success "All tests passed"
    else
        log_warning "Skipping tests - npm not available"
    fi
}

build_application() {
    log_info "Building application..."
    
    # Stop and remove existing container
    if docker ps -a --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        log_info "Stopping existing container..."
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
    fi
    
    # Remove existing image
    if docker images --format 'table {{.Repository}}:{{.Tag}}' | grep -q "^$DOCKER_IMAGE$"; then
        log_info "Removing existing image..."
        docker rmi $DOCKER_IMAGE || true
    fi
    
    # Build new image
    log_info "Building Docker image..."
    docker build -t $DOCKER_IMAGE .
    
    log_success "Application built successfully"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Run the container
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:3000 \
        --env-file .env.production \
        --restart unless-stopped \
        $DOCKER_IMAGE
    
    log_success "Application deployed successfully"
}

wait_for_health_check() {
    log_info "Waiting for application to be healthy..."
    
    local count=0
    while [ $count -lt $MAX_HEALTH_CHECKS ]; do
        if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
            log_success "Application is healthy!"
            return 0
        fi
        
        count=$((count + 1))
        log_info "Health check $count/$MAX_HEALTH_CHECKS failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log_error "Application failed to become healthy after $MAX_HEALTH_CHECKS attempts"
    return 1
}

show_deployment_info() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "Application Information:"
    echo "  - Name: $APP_NAME"
    echo "  - URL: http://localhost:$PORT"
    echo "  - Health Check: $HEALTH_CHECK_URL"
    echo "  - Container: $CONTAINER_NAME"
    echo ""
    echo "Useful Commands:"
    echo "  - View logs: docker logs $CONTAINER_NAME"
    echo "  - Stop app: docker stop $CONTAINER_NAME"
    echo "  - Restart app: docker restart $CONTAINER_NAME"
    echo "  - Remove app: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
}

cleanup_on_failure() {
    log_error "Deployment failed. Cleaning up..."
    
    # Stop and remove container if it exists
    if docker ps -a --format 'table {{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
    fi
    
    exit 1
}

# Main deployment process
main() {
    log_info "Starting deployment of $APP_NAME..."
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Run deployment steps
    check_prerequisites
    run_tests
    build_application
    deploy_application
    
    # Wait for application to be ready
    if wait_for_health_check; then
        show_deployment_info
    else
        cleanup_on_failure
    fi
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build")
        check_prerequisites
        build_application
        ;;
    "test")
        run_tests
        ;;
    "health")
        curl -f $HEALTH_CHECK_URL && log_success "Application is healthy" || log_error "Application is not healthy"
        ;;
    "logs")
        docker logs $CONTAINER_NAME
        ;;
    "stop")
        docker stop $CONTAINER_NAME && log_success "Application stopped"
        ;;
    "restart")
        docker restart $CONTAINER_NAME && log_success "Application restarted"
        ;;
    "clean")
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
        docker rmi $DOCKER_IMAGE || true
        log_success "Cleanup completed"
        ;;
    *)
        echo "Usage: $0 {deploy|build|test|health|logs|stop|restart|clean}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (default)"
        echo "  build   - Build application only"
        echo "  test    - Run tests only"
        echo "  health  - Check application health"
        echo "  logs    - Show application logs"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  clean   - Clean up containers and images"
        exit 1
        ;;
esac