import React, { useState, useEffect, useRef } from 'react';
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
    Terminal,
    Volume2,
    VolumeX,
    GitBranch,
    Layers
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
    branch?: string;
    commitMessage?: string;
    stepsTotal?: number;
    stepsCompleted?: number;
}

function App() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [isSoundEnabled, setIsSoundEnabled] = useState(false);

    // Audio refs
    const successAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'));
    const failureAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3'));

    useEffect(() => {
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        socket.on('initial_state', (data: Workflow[]) => {
            const sorted = [...data].sort((a, b) => {
                if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
                if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
            setWorkflows(sorted.slice(0, 8));
        });

        socket.on('workflow_update', (data: Workflow) => {
            setWorkflows(prev => {
                const otherWorkflows = prev.filter(w => w.id !== data.id);
                const nextWorkflows = [data, ...otherWorkflows].sort((a, b) => {
                    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
                    if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

                // Trigger sound if status just became completed
                if (isSoundEnabled && data.status === 'completed') {
                    if (data.conclusion === 'success') successAudio.current.play().catch(() => { });
                    else if (data.conclusion === 'failure') failureAudio.current.play().catch(() => { });
                }

                return nextWorkflows.slice(0, 8);
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
    }, [isSoundEnabled]);

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
                <div className="header-actions">
                    <button
                        className={`sound-toggle ${isSoundEnabled ? 'on' : 'off'}`}
                        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    >
                        {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <div className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
                        {isConnected ? 'LIVE FEED CONNECTED' : 'RECONNECTING TO DISPATCHER...'}
                    </div>
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
                                className={`action-card ${wf.status}`}
                                style={{ borderLeftColor: getStatusColor(wf) }}
                            >
                                <div className="card-header">
                                    <div className="repo-info">
                                        <span className="org-name">{wf.repository.split('/')[0]}</span>
                                        <span className="repo-name">{wf.repository.split('/')[1]}</span>
                                    </div>
                                    {getStatusIcon(wf)}
                                </div>

                                <div className="workflow-details">
                                    <div className="workflow-title-row">
                                        <h2 className="workflow-name">{wf.name}</h2>
                                        {wf.branch && (
                                            <div className="branch-badge">
                                                <GitBranch size={12} />
                                                <span>{wf.branch}</span>
                                            </div>
                                        )}
                                    </div>
                                    {wf.commitMessage && <p className="commit-message">{wf.commitMessage}</p>}

                                    {wf.status === 'in_progress' && wf.stepsTotal && wf.stepsTotal > 0 && (
                                        <div className="progress-section">
                                            <div className="progress-label">
                                                <Layers size={12} />
                                                <span>Step {wf.stepsCompleted} of {wf.stepsTotal}</span>
                                            </div>
                                            <div className="progress-bar-bg">
                                                <motion.div
                                                    className="progress-bar-fill"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(wf.stepsCompleted! / wf.stepsTotal!) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

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
                                    <span className={`status-tag ${wf.status}`}>
                                        {wf.conclusion || wf.status}
                                    </span>
                                    <a href={`https://github.com/${wf.repository}/actions`} target="_blank" rel="noopener noreferrer" className="view-link">
                                        <ExternalLink size={18} />
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
