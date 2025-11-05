# DevOps Automation Project

This project demonstrates a complete DevOps pipeline for deploying a containerized web application to Azure infrastructure using Terraform, Ansible, Docker, and GitHub Actions.

## Project Structure

```
├── app/                    # Sample web application
│   ├── Dockerfile         # Container configuration
│   ├── index.html         # Main application
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── nginx.conf         # Nginx configuration
├── ansible/               # Infrastructure configuration
│   ├── main.yml           # Ansible playbook
│   ├── inventory.ini      # Server inventory
│   └── ansible.cfg        # Ansible configuration
├── terraform/             # Infrastructure provisioning
│   ├── main.tf            # Main Terraform configuration
│   ├── outputs.tf         # Output variables
│   └── versions.tf        # Provider versions
├── .github/workflows/     # CI/CD pipeline
│   └── main.yml           # GitHub Actions workflow
├── build-docker.sh        # Local Docker build script
└── README.md              # This file
```

## Prerequisites

- Azure subscription
- Terraform installed
- Ansible installed
- Docker installed
- Docker Hub account
- GitHub account
- SSH key pair for Azure VM access

## Setup Instructions

### 1. Configure Azure Credentials

```bash
# Login to Azure CLI
az login

# Set subscription (if multiple)
az account set --subscription "your-subscription-id"
```

### 2. Configure SSH Keys

Generate SSH keys if you don't have them:

```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

Update the public key path in `terraform/main.tf` (line 107):

```hcl
public_key = file("C:/Users/YOUR-USERNAME/.ssh/id_rsa.pub")
```

### 3. Configure GitHub Secrets

Navigate to your GitHub repository Settings > Secrets and variables > Actions and add the following secrets:

#### Required Secrets:

- **DOCKER_USERNAME**: Your Docker Hub username
- **DOCKER_PASSWORD**: Your Docker Hub password or access token
- **VM_HOST**: Your Azure VM public IP address (get from `terraform output`)
- **VM_USER**: Azure VM username (default: `azureuser`)
- **VM_SSH_KEY**: Your private SSH key content (copy the entire content of `id_rsa`)

#### Adding VM_SSH_KEY:

```bash
# Copy your private key to clipboard (Windows)
clip < ~/.ssh/id_rsa

# Or on Linux/Mac
pbcopy < ~/.ssh/id_rsa
```

Then paste the entire key content as the VM_SSH_KEY secret value.

## Deployment Steps

### 1. Provision Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply -auto-approve

# Get the VM IP address
terraform output
```

### 2. Configure Server with Ansible

```bash
cd ../ansible

# Update the inventory with your VM IP from terraform output
# Edit inventory.ini if needed

# Run the Ansible playbook
ansible-playbook main.yml
```

### 3. Build and Test Docker Image Locally

```bash
cd ..

# Make build script executable
chmod +x build-docker.sh

# Build the Docker image
./build-docker.sh

# Build and push to Docker Hub
./build-docker.sh --push

# Test locally
docker run -d -p 8080:80 --name test-app nomanawan408/devops-sample-app:latest
```

### 4. Verify Deployment

Access your web application at:
- Local test: http://localhost:8080
- Azure VM: http://<your-vm-ip>

## Configuration Management with Ansible

This project uses Ansible for both initial server configuration and ongoing deployment automation:

### 1. Initial Server Setup (`ansible/main.yml`)
- **Purpose**: One-time server configuration after Terraform provisioning
- **Tasks**:
  - Install Docker and required packages
  - Configure Docker service to start automatically on boot
  - Add user to docker group for permissions
  - Deploy initial web application container
- **Usage**: `ansible-playbook main.yml`

### 2. CI/CD Deployment (`ansible/deploy.yml`)
- **Purpose**: Automated deployment triggered by GitHub Actions
- **Tasks**:
  - Stop and remove existing container
  - Pull latest Docker image from registry
  - Deploy new container with updated application
- **Usage**: Automatically executed by CI/CD pipeline

### 3. Automation Flow
1. **Infrastructure Provisioning**: Terraform creates Azure VM
2. **Configuration Management**: Ansible sets up Docker environment
3. **Application Deployment**: GitHub Actions builds image and triggers Ansible deployment
4. **Continuous Updates**: Every code push triggers automated deployment

### Ansible Benefits
- **Idempotent**: Safe to run multiple times
- **Consistent**: Same configuration every deployment
- **Scalable**: Easy to add more servers
- **Version Controlled**: Infrastructure as code

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **Triggers** on pushes to main branch when files in `app/` directory change
2. **Builds** the Docker image using the Dockerfile in `app/`
3. **Pushes** the image to Docker Hub
4. **Deploys** the new container to your Azure VM via SSH

### Pipeline Workflow:

```yaml
on:
  push:
    branches: [main]
    paths: ['app/**']
```

## Application Features

The sample web application includes:
- Responsive single-page design
- Navigation between Home, About, and Contact sections
- Contact form with validation
- Modern CSS styling
- Interactive JavaScript functionality

## Monitoring and Maintenance

### Check Container Status on VM:

```bash
# SSH into your VM
ssh azureuser@<your-vm-ip>

# Check running containers
docker ps

# View container logs
docker logs webapp

# Stop/start container
docker stop webapp
docker start webapp
```

### Update Application:

1. Make changes to files in `app/` directory
2. Commit and push to GitHub main branch
3. CI/CD pipeline will automatically build and deploy

## Troubleshooting

### Common Issues:

1. **Docker group permissions**: After Ansible setup, you may need to logout and login again for docker group permissions to take effect.

2. **SSH connection issues**: Ensure your SSH key is properly configured and the VM_SSH_KEY secret contains the complete private key.

3. **Docker Hub authentication**: Use a Docker Hub access token instead of password for better security.

4. **Port conflicts**: Ensure port 80 is not in use by other services on the VM.

### Debugging CI/CD:

Check GitHub Actions logs for detailed error information. Common failures:
- Missing or incorrect secrets
- Docker Hub authentication issues
- SSH connection timeouts
- Image build failures

## Security Considerations

- Use Docker Hub access tokens instead of passwords
- Restrict SSH access to specific IP addresses in production
- Regularly update base images and dependencies
- Implement proper logging and monitoring
- Use HTTPS in production (add SSL certificate)

## Cost Optimization

- Use smaller VM sizes for development/testing
- Stop VM when not in use
- Monitor Azure resource usage
- Consider Azure Container Instances for production workloads

## Extensions

This project can be extended with:
- Database integration (PostgreSQL/MySQL)
- Load balancing with multiple containers
- SSL/TLS certificate management
- Monitoring with Prometheus/Grafana
- Log aggregation with ELK stack
- Automated testing in CI pipeline

## Clean Up

To remove all resources and avoid charges:

```bash
cd terraform
terraform destroy -auto-approve
```

This will remove:
- Azure VM and all networking components
- Resource group
- Public IP address
- All associated storage
