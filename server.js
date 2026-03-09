const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow testing across local dev ports
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

// Middleware to capture raw body for HMAC signature verification
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cors());

// Webhook Verification Middleware
const verifySignature = (req, res, next) => {
    // Skip verification for local testing from localhost
    if (req.headers['host'].includes('localhost') || req.headers['host'].includes('127.0.0.1')) {
        return next();
    }

    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        return res.status(401).send('No signature found');
    }

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    if (signature !== digest) {
        return res.status(401).send('Invalid signature');
    }

    next();
};

// In-memory state for active workflows
let activeWorkflows = {};

// Root health check
app.get('/', (req, res) => {
    res.send('Mission Control Backend - Live');
});

// GitHub Webhook Endpoint
app.post('/webhooks/github', verifySignature, (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    console.log(`Received GitHub Event: ${event}`);

    // We primarily care about workflow_run and workflow_job
    if (event === 'workflow_run' || event === 'workflow_job') {
        const data = {
            event,
            action: payload.action,
            repository: payload.repository.full_name,
            sender: payload.sender.login,
            timestamp: new Date().toISOString()
        };

        if (event === 'workflow_run') {
            data.id = payload.workflow_run.id;
            data.status = payload.workflow_run.status;
            data.conclusion = payload.workflow_run.conclusion;
            data.name = payload.workflow_run.name;
            data.branch = payload.workflow_run.head_branch;
            data.commitMessage = payload.workflow_run.display_title;
        }

        if (event === 'workflow_job') {
            data.id = payload.workflow_job.id;
            data.run_id = payload.workflow_job.run_id;
            data.status = payload.workflow_job.status;
            data.conclusion = payload.workflow_job.conclusion;
            data.name = payload.workflow_job.name;
            data.stepsTotal = payload.workflow_job.steps ? payload.workflow_job.steps.length : 0;
            data.stepsCompleted = payload.workflow_job.steps ? payload.workflow_job.steps.filter(s => s.status === 'completed').length : 0;
        }

        // Update internal state
        activeWorkflows[data.id] = data;

        // Update internal state
        activeWorkflows[data.id] = data;

        // Keep memory limited to the last 20 actions
        const keys = Object.keys(activeWorkflows);
        if (keys.length > 20) {
            delete activeWorkflows[keys[0]];
        }

        // Broadcast to all connected clients
        console.log(`Broadcasting update for ${data.name} (${data.status})`);
        io.emit('workflow_update', data);
    }

    res.status(200).send('Event processed');
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('Client connected to Mission Control');

    // Send current active workflows on join
    socket.emit('initial_state', Object.values(activeWorkflows));

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Mission Control Backend running on http://localhost:${PORT}`);
    console.log(`Listening for GitHub Webhooks...`);
});
