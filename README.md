# Portfolio

My personal portfolio, built with [Next.js](https://nextjs.org/), React and Tailwind CSS, deployed in Vercel. Blog posts are written in MDX under `content/blogs`.
The url is: hokseng.dev
## Run locally (without Docker)

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Run with Docker Compose

### 1. Install Docker

Docker Compose ships with Docker Desktop. Install it for your platform:

- **macOS / Windows**: download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then start it.
- **Linux**: follow the [Docker Engine install guide](https://docs.docker.com/engine/install/) and add the Compose plugin:

  ```bash
  sudo apt-get install docker-compose-plugin
  ```

Verify the installation:

```bash
docker --version
docker compose version
```

### 2. Build and start the app

From the project root:

```bash
docker compose up --build
```

This builds the image (installs dependencies, runs `next build`) and starts the container. The first build takes a few minutes; later builds reuse cached layers.

Open http://localhost:3000.

To run it in the background instead:

```bash
docker compose up --build -d
```


