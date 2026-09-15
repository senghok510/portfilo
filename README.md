# Portfolio

My personal portfolio, built with [Next.js](https://nextjs.org/), React and Tailwind CSS. Blog posts are written in MDX under `content/blogs`.

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

### 3. Useful commands

| Task | Command |
| --- | --- |
| View logs | `docker compose logs -f` |
| Stop the app | `docker compose down` |
| Rebuild after changing code or blog posts | `docker compose up --build -d` |
| Remove the built image as well | `docker compose down --rmi local` |

### Change the port

Edit the `ports` entry in `docker-compose.yml`. For example, to serve on port 8080:

```yaml
ports:
  - "8080:3000"
```

### How the image is built

- `Dockerfile` is a three-stage build: install dependencies, run `next build`, then copy only the standalone server output into a small `node:22-alpine` runtime image that runs as a non-root user.
- `next.config.ts` sets `output: "standalone"` so Next.js emits a self-contained `server.js`.
- `content/` and `public/` are copied into the image because blog posts and assets are read at runtime.
