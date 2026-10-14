# Latency-Optimized API Proxy

A high-performance, cloud-native API gateway and reverse proxy built with TypeScript and Express. It sits at the edge of the network to intercept client traffic, serving cached responses directly from memory via Redis, achieving up to a **~60%** reduction in network latency.

![Dashboard Latency Metrics](./docs/dashboard.png)

![Use Walkthrough](./docs/latency.gif)

---

### Live Proxy Routing

Once the server is running, the gateway intercepts requests and dynamically manages cached telemetry. The logs below demonstrate the complete caching lifecycle: an initial cache miss querying PostgreSQL (132ms), a subsequent high-speed cache hit from Redis (79ms), and the system correctly reverting to a database query (422ms) immediately after a cache flush.

![Terminal Gateway Logs](./docs/logs.png)

---

### Prerequisites
Make sure you have Node.js and npm installed. You will also need a local Redis instance and ensure the frontend and backend services are running locally on your machine.

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SaharshBhatnagar/Latency-Optimized-API-Proxy-gateway.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Latency-Optimized-API-Proxy-gateway
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create your environment file:
   Create a .env file in the root and add your `PORT`, `REDIS_URL` and `JWT_SECRET`:
   ```bash
   PORT=8000
   REDIS_URL=redis://127.0.0.1:6380
   JWT_SECRET=your_secure_jwt_secret
   ```

   > **Note:** In production on EC2, Redis runs containerized in Docker (`redis://127.0.0.1:6380` or `redis://127.0.0.1:6379`), eliminating managed caching service costs while keeping in-memory latency under 1ms.

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Production Build

1. Compile the TypeScript Code:
   ```bash
   npm run build
   ```

2. Start the Compiled Server:
   ```bash
   npm start
   ```

### Docker Deployment

The proxy can be run as a container by mapping the ports and providing an environment variable file:

```bash
docker build -t latency-optimized-api-proxy-gateway .
docker run -p 8000:8000 --env-file .env latency-optimized-api-proxy-gateway
```

If you need to connect the Docker container to a local backend network, run it via docker-compose:

```bash
docker compose up -d gateway
```

## Directory Structure

```plaintext
Latency-Optimized-API-Proxy/
├── .github/workflows/deploy.yml
├── src/
│   ├── config/              
│   │   ├── gateway.json     
│   │   └── redisClient.ts   
│   ├── middlewares/         
│   │   ├── auth.ts          
│   │   ├── cache.ts         
│   │   └── rateLimiter.ts   
│   ├── routes/
│   │   └── proxy.ts         
│   └── server.ts           
├── Dockerfile             
├── package.json             
└── tsconfig.json           
```

## CI/CD Pipeline

> This repository includes a GitHub Actions workflow (`deploy.yml`) that automatically builds the Docker image, pushes it to Amazon Elastic Container Registry (ECR), and automatically deploys to your EC2 instance via SSH upon pushes to the main branch. Ensure your AWS IAM credentials and EC2 SSH secrets are stored safely in GitHub Repository Secrets.

## Additional Documentation

> The Redis client utilizes a singleton pattern with a 4-minute pingInterval to prevent idle connection drops.

**Tech Stack:** TypeScript, Redis (Docker), AWS (ECR, EC2, RDS), Docker, Node.js, Express

**Included packages:** cors, helmet, http-proxy-middleware, jsonwebtoken, and redis.

---

## Full Architecture Stack

This gateway proxy is one component of a complete cloud-native ecosystem. You can explore the other microservices in this architecture here:

* **Frontend:** [Dashboard Repository](https://github.com/SaharshBhatnagar/Latency-Optimized-API-Proxy-frontend)

* **Backend:** [Latency Optimized API Proxy Backend](https://github.com/SaharshBhatnagar/Latency-Optimized-API-Proxy-backend)
