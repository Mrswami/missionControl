const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const URL = 'http://localhost:3000/webhooks/github';
const SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your_secret_here';

const sendWebhook = async (event, payload) => {
    const body = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', SECRET);
    const signature = 'sha256=' + hmac.update(body).digest('hex');

    try {
        const response = await axios.post(URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-GitHub-Event': event,
                'X-Hub-Signature-256': signature
            }
        });
        console.log(`Sent ${event}: ${response.status} ${response.data}`);
    } catch (error) {
        console.error(`Error sending ${event}:`, error.response?.data || error.message);
    }
};

const runTest = async () => {
    // 1. Send an "In Progress" update
    await sendWebhook('workflow_run', {
        action: 'requested',
        workflow_run: {
            id: 12345,
            name: 'Production Build',
            status: 'in_progress',
            conclusion: null
        },
        repository: {
            full_name: 'acme/gitMonitor'
        },
        sender: {
            login: 'jdoe'
        }
    });

    await new Promise(r => setTimeout(r, 2000));

    // 2. Send another one (parallel)
    await sendWebhook('workflow_job', {
        action: 'in_progress',
        workflow_job: {
            id: 67890,
            run_id: 12345,
            name: 'Unit Tests',
            status: 'in_progress',
            conclusion: null
        },
        repository: {
            full_name: 'acme/gitMonitor'
        },
        sender: {
            login: 'jdoe'
        }
    });

    await new Promise(r => setTimeout(r, 5000));

    // 3. Complete them
    await sendWebhook('workflow_run', {
        action: 'completed',
        workflow_run: {
            id: 12345,
            name: 'Production Build',
            status: 'completed',
            conclusion: 'success'
        },
        repository: {
            full_name: 'acme/gitMonitor'
        },
        sender: {
            login: 'jdoe'
        }
    });
};

runTest();
