# Use a lightweight Nginx base image
FROM nginx:alpine

# Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy a simple Nginx configuration that points to the correct folder
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy your application files into the Nginx content directory
COPY . /usr/share/nginx/html

# Expose port 80 (where Nginx serves content)
EXPOSE 80

# Nginx starts automatically by default in the alpine image, so no CMD needed