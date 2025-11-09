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
# DevOps CA1 — simple overview

This repository contains a small DevOps project that provisions an Azure VM with Terraform, configures it with Ansible, and runs a simple single-page web app (SPA) served in a container. The SPA fetches cybersecurity news from a paid API when available and falls back to token-less sources (Reddit / Hacker News) or sample data.

Keep this README short — the important bits are below.

Project layout (top-level)
```
app/        # web app (HTML/CSS/JS, Dockerfile, nginx config)
ansible/    # Ansible playbooks to configure the VM and deploy the container
terraform/  # Terraform to provision Azure resources (VM, NSG, public IP)
.github/     # GitHub Actions workflow (CI/CD)
README.md
```

Run the app locally (quick)
- Option A: open `app/index.html` in a browser (works, but some browsers block API calls from file://)
- Option B (recommended): start a simple HTTP server in the `app/` folder:

PowerShell (Windows):
```powershell
cd app
python -m http.server 8000
# then open http://localhost:8000
```

Where to set the NewsAPI key
- Edit `app/index.html` and set a real key on the `<body>` element: `data-api-key="YOUR_REAL_KEY"`.
- If no valid key is present the app will automatically fall back to Reddit (r/cybersecurity, r/netsec) then Hacker News, then a bundled sample dataset.

Provision infrastructure (Terraform)
```powershell
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
terraform output    # shows VM public IP
```

Configure server (Ansible)
```powershell
cd ansible
# update inventory.ini with the VM IP from terraform output
ansible-playbook main.yml
```

What the Ansible playbook does (summary)
- Installs Docker and required packages
- Starts Docker and adds the deploy user to the docker group
- Deploys the web app container (Nginx) from the Docker image

Local development and CI/CD
- The GitHub Actions workflow builds and pushes a Docker image from `app/` when you push to main. It then triggers the deployment playbook via SSH (configured with repository secrets).

Notes on design and behavior
- UI uses Bootstrap (CDN) and a clean card-based layout.
- JavaScript fetches NewsAPI when a key is provided; handled HTTP errors (426/401/429) and uses token-less fallbacks automatically.
- Contact form is present as a demo and is handled client-side (no backend by default).

Troubleshooting (quick)
- If news do not load, check DevTools Console for errors and confirm the `data-api-key` value if you expect NewsAPI results.
- If Reddit/HN fallback is empty, your network may block those endpoints (CORS or firewall); consider running a small server-side proxy.

If you want, I can add a tiny Express proxy to keep API keys secret and avoid CORS — say the word and I will scaffold it and a short README section.

That's it — simple and focused. Use the folders above to inspect Terraform and Ansible details when you need to change the infra or provisioning steps.
