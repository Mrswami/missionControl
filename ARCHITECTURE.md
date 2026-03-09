# Mission Control - GitHub Actions Dashboard

## Overview
A real-time, multi-pane dashboard designed to monitor up to 8 GitHub Actions parallelly. The app uses webhooks to receive push events from GitHub and broadcasts the status to the frontend via WebSockets.

## Architecture Architecture

### 1. Backend (The Dispatcher)
*   **Technology**: Node.js with Fastify or Express.
*   **Role**:
    *   **Webhook Receiver**: Expose an endpoint (e.g., `/webhooks/github`) to receive POST payloads from GitHub Organization/Repository webhooks.
    *   **Authentication & Security**: Verify the `X-Hub-Signature-256` header to ensure payloads legitimately come from GitHub.
    *   **State Management**: Maintain an in-memory or Redis-backed list of "active" workflow runs, updating their state (queued, in_progress, completed, failed, cancelled) as new webhooks stream in.
    *   **WebSocket Server**: Use Socket.io to push real-time updates of the active actions to connected frontend clients.

### 2. Frontend (The Dashboard)
*   **Technology**: React with Vite, styled with Tailwind CSS or standard CSS (glassmorphism/dark mode vibes).
*   **Role**:
    *   **Live Connection**: Connect to the backend via WebSocket to receive real-time payload updates.
    *   **Dynamic Grid Layout**: Expand or collapse viewing panes dynamically depending on how many active actions there are (1 to 8 maximum). If there are more than 8, prioritize the most recently started actions.
    *   **Visual Indicators**: Provide clear feedback for workflow progress (e.g., spinning indicators for 'in progress', green checks for 'success', red crosses for 'failure').
    *   **Cold Start Handling**: On initial load, fetch the currently running actions from the backend REST API to populate the board before any new webhooks arrive.

### 3. Deployment & Infrastructure
*   **Local Setup**: Use `ngrok` or `localtunnel` to expose the local backend to the internet so GitHub can send webhooks to it during development.
*   **Production**: Deploy the backend to a stable service like Render, Heroku, or a VPS. Deploy the frontend to Vercel or Netlify.

## Data Flow Diagram
1. **Developer pushes code** to a GitHub Repository.
2. **GitHub triggers a workflow** and fires a `workflow_run` (and `workflow_job`) webhook.
3. **Mission Control Backend** receives the POST payload.
4. **Backend verifies** the signature, parses the repo name, status, and conclusion.
5. **Backend emits** a `"workflow_updated"` event over WebSockets.
6. **Frontend receives** the event and updates or creates a tile in the dashboard grid.

## Next Steps
1. Initialize the backend project (`npm init -y`, `npm install express socket.io ...`).
2. Create the webhook listener and verify payloads.
3. Test receiving payloads using `ngrok` + a test GitHub repo.
4. Initialize the frontend React project.
5. Connect the frontend to the backend via Socket.io and build out the dynamic tile grid.
