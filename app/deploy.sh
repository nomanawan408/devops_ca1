#!/bin/bash
IMAGE_NAME=$1
CONTAINER_NAME="devops-web-app"

echo "Stopping and removing old container..."
# The '|| true' ensures the script doesn't fail if the container doesn't exist yet
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

echo "Pulling new image: $IMAGE_NAME"
docker pull $IMAGE_NAME

echo "Running new container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p 80:80 \
  $IMAGE_NAME

echo "Deployment complete."