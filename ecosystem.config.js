module.exports = {
    apps: [
        {
            name: 'mission-backend',
            script: 'server.js',
            watch: true,
            env: {
                NODE_ENV: 'development',
            }
        },
        {
            name: 'mission-frontend',
            script: 'npm',
            args: 'run dev',
            cwd: './frontend',
            env: {
                NODE_ENV: 'development',
            }
        },
        {
            name: 'mission-tunnel',
            script: 'npx',
            args: 'localtunnel --port 3000 --subdomain swami',
            restart_delay: 5000, // wait 5s to ensure backend is up
        }
    ]
};
