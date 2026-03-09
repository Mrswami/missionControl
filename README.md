# Git Monitor (Mission Control)

This application provides a real-time, multi-pane dashboard for monitoring GitHub Actions across repositories or organizations.

## Project Structure
- **/server.js**: Node.js backend that listens for GitHub Webhooks and broadcasts events via Socket.io.
- **/frontend**: React (Vite + TypeScript) dashboard with a dynamic grid layout.
- **ARCHITECTURE.md**: Detailed system design and data flow.

## Getting Started

### 1. Setup Backend
1. In the root directory, run `npm install`.
2. Create/edit the `.env` file and set your `GITHUB_WEBHOOK_SECRET`.
3. Start the backend: `npm run dev`.
   - The backend runs on `http://localhost:3000`.

### 2. Setup Frontend
1. Navigate to `/frontend` and run `npm install`.
2. Start the frontend: `npm run dev`.
   - The dashboard runs on `http://localhost:5173` (or `5174`).

### 3. Exposing to GitHub
Since GitHub needs to send POST requests to your local machine, you need a public tunnel.

#### localtunnel (Zero installation)
Run this in a separate terminal:
```bash
npx localtunnel --port 3000
```
- It will give you a URL like `https://blue-zebras-send.loca.lt`.
- **Note**: When you first open the URL, it might ask for your "Tunnel Password" (which is your public IP).

#### Add Webhook to GitHub
1.  In your GitHub Repo/Org settings, go to **Webhooks > Add webhook**.
2.  **Payload URL**: `<your-tunnel-url>/webhooks/github`
3.  **Content type**: `application/json`
4.  **Secret**: (Must match your `.env` GITHUB_WEBHOOK_SECRET)
5.  **Events**: Select "Workflow runs" and "Workflow jobs".

## Simulated Testing
You can test the UI without actual GitHub events by running:
```bash
node test-webhook.js
```
This will send three mock events to the local backend.
