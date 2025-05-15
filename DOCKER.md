# Docker Setup for ClasScorer Frontend

This document describes how to run the ClasScorer Frontend application using Docker and Docker Compose.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system

## Development Setup

To run the application in development mode:

1. Copy the environment variables example file and modify as needed:
   ```
   cp .env.example .env
   ```

2. Start the development environment:
   ```
   docker-compose up
   ```

3. The application will be available at `http://localhost:3000`

4. Changes to the codebase will be reflected in real-time thanks to Next.js hot-reloading.

## Production Setup

To run the application in production mode:

1. Set up the production environment variables:
   ```
   cp .env.example .env
   ```
   
   Edit the `.env` file and set secure values for production:
   - Generate a secure value for `NEXTAUTH_SECRET`
   - Set strong passwords for database users
   - Set `NODE_ENV=production`

2. Start the production environment:
   ```
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. The application will be available at `http://localhost:3000`

## Database Management

### Running Migrations

To run Prisma migrations inside the Docker container:

```
docker-compose exec webapp npx prisma migrate dev
```

### Accessing PostgreSQL Database

To access the PostgreSQL database:

```
docker-compose exec postgres psql -U postgres -d classcorer
```

## Stopping the Application

To stop the application:

```
docker-compose down
```

To stop the production application:

```
docker-compose -f docker-compose.prod.yml down
```

To completely remove containers, volumes, and networks:

```
docker-compose down -v
```

## Troubleshooting

### Prisma Client Issues

If you encounter Prisma client issues, regenerate the Prisma client inside the Docker container:

```
docker-compose exec webapp npx prisma generate
```

### Container Won't Start

Check the container logs:

```
docker-compose logs webapp
```

### Database Connection Issues

Ensure the PostgreSQL container is running:

```
docker-compose ps
```

Check database logs:

```
docker-compose logs postgres
``` 