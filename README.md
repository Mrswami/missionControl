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

## Background & System Tray Operations
You can now run Mission Control as a persistent background service with a system tray icon.

### 1. Start in Background (with Tray Icon)
Run this command to launch the system tray app, which will automatically start the backend and tunnel in the background:
```bash
npm run tray:silent
```
- **Silent Mode**: This command will "poof" the icon into your system tray and then immediately free up your terminal. You can safely close the window, and the radar icon will stay active!
- **Tray Icon**: Look for the Mission Control logo in your Windows system tray (near the clock).
- **Menu**: Right-click the icon to open the dashboard or stop services.

### 2. Manual Background Control (PM2)
If you just want the services without the icon:
- **Start**: `npm run bg:start`
- **Stop**: `npm run bg:stop`
- **Status**: `npx pm2 list`

### 3. Open Dashboard
The dashboard will be available at:
- **Local**: `http://localhost:5173`
- **External**: Check your tunnel URL (configured in `ecosystem.config.js`).

## Simulated Testing
...
