# Gateway Configuration Setup

## Overview

The ClassScorer webapp communicates with a Gateway service for face detection and analysis. This document explains how to configure the gateway URL.

## Environment Variable Configuration

### For Development

1. Create a `.env.local` file in the `classcorer-webapp` directory:

```bash
cp env.example .env.local
```

2. Edit the `.env.local` file and set the `GATEWAY_URL`:

```bash
# Gateway Configuration
GATEWAY_URL="http://10.55.205.205:8000"
```

### For Production

Set the environment variable in your deployment environment:

```bash
export GATEWAY_URL="http://10.55.205.205:8000"
```

## Docker Configuration

The `docker-compose.yml` and `docker-compose.prod.yml` files have been pre-configured with the gateway URL.

### Development Docker
```yaml
environment:
  - GATEWAY_URL=http://10.55.205.205:8000
```

### Production Docker
```yaml
environment:
  - GATEWAY_URL=http://10.55.205.205:8000
```

## How It Works

1. **Frontend → Internal API**: The frontend makes requests to `/api/process-frame`
2. **Internal API → Gateway**: The internal API forwards requests to `${GATEWAY_URL}/api/process-frame`
3. **Gateway → Services**: The gateway routes requests to appropriate microservices

```
Frontend → /api/process-frame → http://10.55.205.205:8000/api/process-frame → Gateway Services
```

## Verification

To verify the gateway connection is working:

1. Start the webapp
2. Check the browser network tab for successful requests to `/api/process-frame`
3. Check the server logs for successful connections to the gateway URL

## Troubleshooting

### Connection Refused
- Ensure the gateway server is running on `10.55.205.205:8000`
- Check firewall settings
- Verify network connectivity

### API Errors
- Check gateway service logs
- Verify the gateway `/health` endpoint: `http://10.55.205.205:8000/health`
- Ensure all required microservices are running

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GATEWAY_URL` | Full URL to the gateway service | `http://localhost:8000` | Yes |

## Update Instructions

To change the gateway IP address:

1. Update the `GATEWAY_URL` environment variable
2. Restart the webapp service
3. No code changes required

Example for different IP:
```bash
GATEWAY_URL="http://192.168.1.100:8000"
``` 