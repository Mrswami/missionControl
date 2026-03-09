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
    console.log("🚀 Starting Mission Control Feature Test...");

    // 1. Send an "In Progress" update with branch and commit info
    await sendWebhook('workflow_run', {
        action: 'requested',
        workflow_run: {
            id: 12345,
            name: 'Production Build',
            status: 'in_progress',
            conclusion: null,
            head_branch: 'main',
            display_title: 'feat: add real-time telemetry to mission control'
        },
        repository: {
            full_name: 'acme/gitMonitor'
        },
        sender: {
            login: 'jmore'
        }
    });

    await new Promise(r => setTimeout(r, 2000));

    // 2. Send a job with step progress
    await sendWebhook('workflow_job', {
        action: 'in_progress',
        workflow_job: {
            id: 67890,
            run_id: 12345,
            name: 'Unit Tests',
            status: 'in_progress',
            conclusion: null,
            steps: [
                { name: 'Setup', status: 'completed' },
                { name: 'Install Deps', status: 'completed' },
                { name: 'Run Jest', status: 'in_progress' },
                { name: 'Upload Artifacts', status: 'queued' },
                { name: 'Cleanup', status: 'queued' }
            ]
        },
        repository: {
            full_name: 'acme/gitMonitor'
        },
        sender: {
            login: 'jmore'
        }
    });

    await new Promise(r => setTimeout(r, 3000));

    // 3. Update job progress
    await sendWebhook('workflow_job', {
        action: 'in_progress',
        workflow_job: {
            id: 67890,
            run_id: 12345,
            name: 'Unit Tests',
            status: 'in_progress',
            conclusion: null,
            steps: [
                { name: 'Setup', status: 'completed' },
                { name: 'Install Deps', status: 'completed' },
                { name: 'Run Jest', status: 'completed' },
                { name: 'Upload Artifacts', status: 'completed' },
                { name: 'Cleanup', status: 'in_progress' }
            ]
        },
        repository: {
            full_name: 'acme/gitMonitor'
        },
        sender: {
            login: 'jmore'
        }
    });

    await new Promise(r => setTimeout(r, 3000));

    // 4. Complete them both
    await sendWebhook('workflow_job', {
        action: 'completed',
        workflow_job: {
            id: 67890,
            run_id: 12345,
            name: 'Unit Tests',
            status: 'completed',
            conclusion: 'success',
            steps: [
                { name: 'Setup', status: 'completed' },
                { name: 'Install Deps', status: 'completed' },
                { name: 'Run Jest', status: 'completed' },
                { name: 'Upload Artifacts', status: 'completed' },
                { name: 'Cleanup', status: 'completed' }
            ]
        },
        repository: {
            full_name: 'acme/gitMonitor'
        },
        sender: {
            login: 'jmore'
        }
    });

    await sendWebhook('workflow_run', {
        action: 'completed',
        workflow_run: {
            id: 12345,
            name: 'Production Build',
            status: 'completed',
            conclusion: 'success',
            head_branch: 'main',
            display_title: 'feat: add real-time telemetry to mission control'
        },
        repository: {
            full_name: 'acme/gitMonitor'
        },
        sender: {
            login: 'jmore'
        }
    });

    console.log("✅ Test sequence complete.");
};

runTest();
