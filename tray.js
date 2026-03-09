const { app, Tray, Menu, shell, Notification } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let tray = null;

const PM2_PATH = path.join(__dirname, 'node_modules', '.bin', 'pm2');

function startServices() {
    // Use delete all then start to ensure a clean state. Use & for Windows CMD compatibility.
    exec(`"${PM2_PATH}" delete all & "${PM2_PATH}" start ecosystem.config.js`, (err) => {
        if (err && !err.message.includes('Process not found')) {
            console.error('Failed to start services:', err);
            new Notification({ title: 'Mission Control', body: 'Failed to start services.' }).show();
        } else {
            new Notification({ title: 'Mission Control', body: 'All services are now active in the background.' }).show();
        }
    });
}

function stopServices() {
    exec(`"${PM2_PATH}" stop all & "${PM2_PATH}" delete all`, (err) => {
        if (err && !err.message.includes('Process not found')) {
            console.error('Failed to stop services:', err);
        } else {
            new Notification({ title: 'Mission Control', body: 'Services stopped.' }).show();
        }
    });
}

function openDashboard() {
    shell.openExternal('http://localhost:5173');
}

app.whenReady().then(() => {
    // Create Tray Icon
    const iconPath = path.join(__dirname, 'tray-icon.png');
    tray = new Tray(iconPath);

    // Define Context Menu
    const contextMenu = Menu.buildFromTemplate([
        { label: 'MISSION CONTROL', enabled: false },
        { type: 'separator' },
        { label: 'Open Dashboard', click: openDashboard },
        { type: 'separator' },
        { label: 'Start All Services', click: startServices },
        { label: 'Stop All Services', click: stopServices },
        { type: 'separator' },
        {
            label: 'Quit', click: () => {
                // Option: stop services on quit? 
                // For now, let's keep them running in background unless explicitly stopped.
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Mission Control Dashboard');
    tray.setContextMenu(contextMenu);

    // Automatically start services on launch
    startServices();
});

// Hide from dock on macOS (not applicable for Windows but good practice)
if (process.platform === 'darwin') {
    app.dock.hide();
}
