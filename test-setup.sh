#!/bin/bash

# Test Script for DevOps Project Setup
# Validates that all components are properly configured

set -e

echo "🔍 Testing DevOps Project Setup..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
}

test_file_exists() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 does not exist${NC}"
        return 1
    fi
}

test_directory_exists() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1 directory exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 directory does not exist${NC}"
        return 1
    fi
}

# Test required tools
echo -e "\n${YELLOW}📦 Testing Required Tools:${NC}"
test_command "terraform"
test_command "ansible"
test_command "docker"
test_command "az"

# Test project structure
echo -e "\n${YELLOW}📁 Testing Project Structure:${NC}"
test_directory_exists "app"
test_directory_exists "ansible"
test_directory_exists "terraform"
test_directory_exists ".github/workflows"

# Test critical files
echo -e "\n${YELLOW}📄 Testing Critical Files:${NC}"
test_file_exists "app/Dockerfile"
test_file_exists "app/index.html"
test_file_exists "ansible/main.yml"
test_file_exists "ansible/inventory.ini"
test_file_exists "terraform/main.tf"
test_file_exists ".github/workflows/main.yml"
test_file_exists "build-docker.sh"

# Test Docker functionality
echo -e "\n${YELLOW}🐳 Testing Docker:${NC}"
if docker info &> /dev/null; then
    echo -e "${GREEN}✅ Docker daemon is running${NC}"
else
    echo -e "${RED}❌ Docker daemon is not running${NC}"
fi

# Test SSH key
echo -e "\n${YELLOW}🔑 Testing SSH Configuration:${NC}"
if [ -f "$HOME/.ssh/id_rsa" ]; then
    echo -e "${GREEN}✅ SSH private key exists${NC}"
else
    echo -e "${RED}❌ SSH private key not found at ~/.ssh/id_rsa${NC}"
fi

if [ -f "$HOME/.ssh/id_rsa.pub" ]; then
    echo -e "${GREEN}✅ SSH public key exists${NC}"
else
    echo -e "${RED}❌ SSH public key not found at ~/.ssh/id_rsa.pub${NC}"
fi

# Test Azure login
echo -e "\n${YELLOW}☁️ Testing Azure Connection:${NC}"
if az account show &> /dev/null; then
    echo -e "${GREEN}✅ Azure CLI is logged in${NC}"
    az account show --query name -o tsv | sed 's/^/   Subscription: /'
else
    echo -e "${RED}❌ Azure CLI is not logged in. Run 'az login'${NC}"
fi

# Test Terraform configuration
echo -e "\n${YELLOW}🏗️ Testing Terraform Configuration:${NC}"
cd terraform
if terraform fmt -check -recursive &> /dev/null; then
    echo -e "${GREEN}✅ Terraform configuration is properly formatted${NC}"
else
    echo -e "${YELLOW}⚠️ Terraform configuration needs formatting${NC}"
fi

if terraform validate &> /dev/null; then
    echo -e "${GREEN}✅ Terraform configuration is valid${NC}"
else
    echo -e "${RED}❌ Terraform configuration has errors${NC}"
fi
cd ..

# Test Ansible configuration
echo -e "\n${YELLOW}⚙️ Testing Ansible Configuration:${NC}"
cd ansible
if ansible-playbook --syntax-check main.yml &> /dev/null; then
    echo -e "${GREEN}✅ Ansible playbook syntax is valid${NC}"
else
    echo -e "${RED}❌ Ansible playbook has syntax errors${NC}"
fi
cd ..

# Summary
echo -e "\n${YELLOW}📋 Setup Test Summary:${NC}"
echo "Run the following commands to complete your setup:"
echo ""
echo "1. Configure Azure CLI: az login"
echo "2. Update SSH key path in terraform/main.tf if needed"
echo "3. Add GitHub secrets for CI/CD pipeline"
echo "4. Provision infrastructure: cd terraform && terraform apply"
echo "5. Configure server: cd ansible && ansible-playbook main.yml"
echo ""
echo -e "${GREEN}🎉 Project structure validation complete!${NC}"
