#!/bin/bash

# Docker Build Script for DevOps Sample Application
# This script builds and optionally pushes the Docker image

set -e

# Configuration
IMAGE_NAME="nomanawan408/devops-sample-app"
TAG="latest"
DOCKERFILE_PATH="./app"

# Parse command line arguments
PUSH_IMAGE=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --push)
      PUSH_IMAGE=true
      shift
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--push] [--tag TAG]"
      echo "  --push    Push image to Docker Hub after building"
      echo "  --tag     Use specific tag (default: latest)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "Building Docker image: ${FULL_IMAGE_NAME}"
echo "Dockerfile path: ${DOCKERFILE_PATH}"

# Build the Docker image
docker build -t "${FULL_IMAGE_NAME}" "${DOCKERFILE_PATH}"

echo "✅ Docker image built successfully!"

# Push to Docker Hub if requested
if [ "$PUSH_IMAGE" = true ]; then
  echo "Pushing image to Docker Hub..."
  docker push "${FULL_IMAGE_NAME}"
  echo "✅ Image pushed to Docker Hub successfully!"
fi

echo "Image details:"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
