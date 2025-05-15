# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating various processes in the ClasScorer Frontend project.

## Workflows

### 1. CI (Continuous Integration)

**File:** `ci.yml`

This workflow runs on push to main and on pull requests to main. It:
- Sets up a PostgreSQL test database
- Installs dependencies
- Generates Prisma client
- Runs database migrations
- Performs linting and type checking
- (Commented out) Runs tests when they are implemented

### 2. Docker Build Test

**File:** `docker-test.yml`

This workflow validates that our Docker setup works correctly:
- Builds the development Docker image
- Builds the production Docker image
- Tests Docker Compose setup
- Tests production Docker Compose build

### 3. Deploy Production

**File:** `deploy.yml`

This workflow handles deployment of the application:
- Builds the production Docker image
- Pushes it to GitHub Container Registry (GHCR)
- Tags it appropriately based on branch or version tag
- (Commented out) Deploys to a production server via SSH

## Triggering Workflows

- **CI** and **Docker Build Test** run automatically on pushes to main and on pull requests.
- **Deploy Production** runs automatically on pushes to main and when version tags are pushed.
- You can also manually trigger the **Deploy Production** workflow via the GitHub Actions UI.

## Setting Up Secrets

For the deployment workflow to function properly, you need to set up the following secrets in your GitHub repository:

- For Container Registry:
  - GitHub automatically provides `GITHUB_TOKEN` so no additional setup is needed.

- For Deployment (when uncommented):
  - `SSH_HOST`: The hostname or IP address of your deployment server
  - `SSH_USERNAME`: The username for SSH access
  - `SSH_PRIVATE_KEY`: The private SSH key for authentication

## Local Testing

You can test these workflows locally using [act](https://github.com/nektos/act), a tool for running GitHub Actions locally. 