import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, CheckCircle2, XCircle, Clock, MapPin, Phone, Mail,
    ChevronDown, Pencil, Save, X, LogOut, RotateCcw, Send,
    Bell, Settings, Activity, FileText, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PHASES = [
    { value: '', label: 'Select Phase…' },
    { value: 'kickoff', label: '🚀 Kickoff' },
    { value: 'requirements', label: '📋 Specs' },
    { value: 'design', label: '🎨 Design' },
    { value: 'development', label: '💻 Build' },
    { value: 'testing', label: '🧪 Test' },
    { value: 'uat', label: '✅ UAT' },
    { value: 'deployment', label: '🚢 Release' },
    { value: 'completed', label: '🎉 Done' },
];

const PHASE_PCT = {
    '': 0, kickoff: 10, requirements: 25, design: 40,
    development: 65, testing: 80, uat: 90, deployment: 95, completed: 100,
};

const WorkerDashboard = () => {
    const navigate = useNavigate();
    const [teamName, setTeamName] = useState(localStorage.getItem('teamName') || 'My Team');
    const [teamId, setTeamId] = useState(localStorage.getItem('teamId'));
    const [activeTab, setActiveTab] = useState('contracts');
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [available, setAvailable] = useState(true);

    useEffect(() => {
        if (localStorage.getItem('teamToken') !== 'true' || !teamId) {
            navigate('/team-login');
            return;
        }
        fetchContracts();
    }, [navigate, teamId]);

    const fetchContracts = async () => {
        const { data, error } = await supabase
            .from('contracts')
            .select(`*, companies(name)`)
            .eq('team_id', parseInt(teamId));

        if (data) {
            const mapped = data.map(c => ({
                id: c.id,
                company: (c.companies && !Array.isArray(c.companies)) ? c.companies.name : (Array.isArray(c.companies) ? c.companies[0]?.name : 'Unknown'),
                project: c.title,
                value: c.value_str,
                deadline: c.deadline,
                details: c.details,
                status: c.status,
                phase: c.phase || '',
            }));
            setContracts(mapped);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('teamToken');
        navigate('/');
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#f5f5f7',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px'
        }}>

            {/* Top Bar */}
            <div className="glass" style={{
                padding: '12px 24px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderRadius: '30px', background: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '45px', height: '45px', background: '#ffcc00',
                        borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Users size={22} color="#000" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0 }}>{teamName}</h4>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TEAM PORTAL</p>
                    </div>
                </div>

                <nav style={{ display: 'flex', background: '#f1f5f9', borderRadius: '99px', padding: '4px' }}>
                    {[
                        { key: 'contracts', label: 'Pipeline', icon: <FileText size={18} /> },
                        { key: 'clients', label: 'Customers', icon: <Activity size={18} /> },
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            style={{
                                border: 'none', background: activeTab === item.key ? '#1a1a1a' : 'transparent',
                                color: activeTab === item.key ? '#fff' : '#64748b',
                                padding: '10px 24px', borderRadius: '99px', fontSize: '14px',
                                fontWeight: activeTab === item.key ? 600 : 500,
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setAvailable(!available)} style={{
                        border: 'none', background: available ? '#f0fdf4' : '#fef2f2',
                        color: available ? '#16a34a' : '#dc2626', padding: '8px 16px', borderRadius: '12px',
                        fontSize: '13px', fontWeight: 700
                    }}>
                        {available ? '🟢 Online' : '🔴 Focus Mode'}
                    </button>
                    <button onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: '#64748b' }}><LogOut size={20} /></button>
                </div>
            </div>

            <main style={{ flex: 1 }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'contracts' && (
                        <motion.div key="contracts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '28px' }}>Project Pipeline</h2>
                                <p style={{ color: '#64748b' }}>Overview of your current assignments and milestones.</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                                {contracts.map(contract => (
                                    <div key={contract.id} className="glass" style={{ padding: '24px', background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div>
                                                <h3 style={{ fontSize: '18px' }}>{contract.project}</h3>
                                                <p style={{ fontSize: '14px', color: '#64748b' }}>{contract.company}</p>
                                            </div>
                                            <div style={{
                                                background: contract.status === 'accepted' ? '#f0fdf4' : '#f8fafc',
                                                color: contract.status === 'accepted' ? '#16a34a' : '#64748b',
                                                padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700
                                            }}>
                                                {contract.status.toUpperCase()}
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.5, marginBottom: '20px' }}>{contract.details}</p>

                                        {/* Progress Section */}
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                                                <span color="#64748b">PROGRESS</span>
                                                <span color="#ffcc00">{PHASE_PCT[contract.phase]}%</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${PHASE_PCT[contract.phase]}%` }}
                                                    style={{ height: '100%', background: '#ffcc00' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
                                                <Clock size={14} />
                                                <span>DUE {contract.deadline}</span>
                                            </div>
                                            <button className="neumorphic" style={{ padding: '8px 16px', borderRadius: '12px', fontWeight: 600, fontSize: '13px', background: '#fff', border: '1px solid #e2e8f0' }}>Manage</button>
                                        </div>
                                    </div>
                                ))}
                                {contracts.length === 0 && !loading && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: '#fff', borderRadius: '30px' }} className="glass">
                                        <div style={{ width: '60px', height: '60px', background: '#f8fafc', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={24} color="#94a3b8" />
                                        </div>
                                        <h3 style={{ color: '#94a3b8' }}>No active contracts found</h3>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'clients' && (
                        <div style={{ textAlign: 'center', padding: '100px', background: '#fff', borderRadius: '40px' }} className="glass">
                            <h2 style={{ color: '#94a3b8' }}>Customer Directory refinement soon</h2>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default WorkerDashboard;
