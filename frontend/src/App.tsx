import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    ExternalLink,
    Loader2,
    Terminal
} from 'lucide-react';
import './App.css';

const socket = io('http://localhost:3000');

interface Workflow {
    id: number;
    run_id?: number;
    name: string;
    status: string;
    conclusion: string | null;
    repository: string;
    sender: string;
    timestamp: string;
}

function App() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        socket.on('initial_state', (data: Workflow[]) => {
            setWorkflows(data);
        });

        socket.on('workflow_update', (data: Workflow) => {
            setWorkflows(prev => {
                const index = prev.findIndex(w => w.id === data.id);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = data;
                    return updated;
                } else {
                    // Keep max 8
                    const news = [data, ...prev].slice(0, 8);
                    return news;
                }
            });
        });

        socket.on('workflow_removed', (id: number) => {
            setWorkflows(prev => prev.filter(w => w.id !== id));
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('initial_state');
            socket.off('workflow_update');
            socket.off('workflow_removed');
        };
    }, []);

    const getStatusColor = (workflow: Workflow) => {
        if (workflow.status === 'in_progress') return '#3fb950';
        if (workflow.status === 'queued') return '#d29922';
        if (workflow.conclusion === 'success') return '#3fb950';
        if (workflow.conclusion === 'failure') return '#f85149';
        if (workflow.conclusion === 'cancelled') return '#8b949e';
        return '#8b949e';
    };

    const getStatusIcon = (workflow: Workflow) => {
        if (workflow.status === 'in_progress') return <Loader2 className="animate-spin text-green-400" size={24} />;
        if (workflow.status === 'queued') return <Clock className="text-yellow-400" size={24} />;
        if (workflow.conclusion === 'success') return <CheckCircle2 className="text-green-400" size={24} />;
        if (workflow.conclusion === 'failure') return <XCircle className="text-red-400" size={24} />;
        return <Clock className="text-gray-400" size={24} />;
    };

    return (
        <div className="mission-control">
            <header className="header">
                <div className="logo-container">
                    <Activity className="pulse-icon" />
                    <h1>GIT MONITOR <span className="subtitle">MISSION CONTROL</span></h1>
                </div>
                <div className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
                    {isConnected ? 'LIVE FEED CONNECTED' : 'RECONNECTING TO DISPATCHER...'}
                </div>
            </header>

            <main className={`grid-container ${workflows.length > 0 ? `grid-${Math.min(workflows.length, 8)}` : 'empty'}`}>
                <AnimatePresence>
                    {workflows.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="empty-state"
                        >
                            <Terminal size={48} />
                            <p>Waiting for GitHub webhooks... Push some code to see the magic.</p>
                        </motion.div>
                    ) : (
                        workflows.map((wf) => (
                            <motion.div
                                key={wf.id}
                                layout
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="action-card"
                                style={{ borderColor: getStatusColor(wf) }}
                            >
                                <div className="card-header">
                                    <div className="repo-info">
                                        <span className="repo-name">{wf.repository.split('/')[1]}</span>
                                        <span className="org-name">{wf.repository.split('/')[0]}</span>
                                    </div>
                                    {getStatusIcon(wf)}
                                </div>

                                <div className="workflow-details">
                                    <h2 className="workflow-name">{wf.name}</h2>
                                    <div className="meta">
                                        <div className="meta-item">
                                            <User size={14} />
                                            <span>{wf.sender}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Clock size={14} />
                                            <span>{new Date(wf.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <span className={`status-pill ${wf.status}`}>
                                        {wf.conclusion || wf.status}
                                    </span>
                                    <a href={`https://github.com/${wf.repository}/actions`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default App;
