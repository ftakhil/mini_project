import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, FileText, CheckCircle2, XCircle, Clock, MapPin, Phone, Mail,
    ChevronDown, Pencil, Save, X, LogOut, Users, RotateCcw, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ── Constants ─────────────────────────────────────────── */
const MOCK_WORKER = {
    name: 'Rohan Mehta',
    role: 'Senior Consultant',
    avatar: 'RM',
    team: 'Alpha Squad',
};

const MOCK_CLIENTS = [
    { id: 1, company: 'Global Systems', email: 'contact@globalsys.com', tier: 1, tierColor: '#fbbf24', since: 'Jan 2024' },
    { id: 2, company: 'Cloud Spire', email: 'admin@cloudspire.io', tier: 2, tierColor: '#ef4444', since: 'Mar 2024' },
    { id: 3, company: 'Alpha Tech', email: 'info@alphatech.com', tier: 3, tierColor: '#a855f7', since: 'Nov 2023' },
];

const PHASES = [
    { value: '', label: 'Select Phase…' },
    { value: 'kickoff', label: '🚀 Kickoff & Planning' },
    { value: 'requirements', label: '📋 Requirements Gathering' },
    { value: 'design', label: '🎨 Design & Architecture' },
    { value: 'development', label: '💻 Development' },
    { value: 'testing', label: '🧪 Testing & QA' },
    { value: 'uat', label: '✅ User Acceptance Testing' },
    { value: 'deployment', label: '🚢 Deployment' },
    { value: 'completed', label: '🎉 Project Completed' },
];

// Maps phase value → % progress (for the bar)
const PHASE_PCT = {
    '': 0, kickoff: 5, requirements: 15, design: 28,
    development: 50, testing: 68, uat: 80, deployment: 92, completed: 100,
};

const INITIAL_CONTRACTS = [
    {
        id: 1, company: 'Global Systems', project: 'ERP Migration Q2',
        value: '$28,000', deadline: 'Apr 30, 2026', status: 'pending',
        details: 'Full-stack ERP migration and staff training across 3 locations.',
        phase: '', submittedPhase: null,
    },
    {
        id: 2, company: 'Cloud Spire', project: 'Cloud Security Audit',
        value: '$15,500', deadline: 'Mar 15, 2026', status: 'accepted',
        details: 'Conduct security audit and penetration testing on AWS infrastructure.',
        phase: 'testing', submittedPhase: 'testing',
    },
    {
        id: 3, company: 'Nexus Innovations', project: 'API Modernisation',
        value: '$9,200', deadline: 'May 10, 2026', status: 'pending',
        details: 'Refactor REST APIs to GraphQL with full test coverage.',
        phase: '', submittedPhase: null,
    },
];

import { supabase } from '../lib/supabase';

/* ── Animated Availability Toggle ─────────────────────── */
const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '8px', padding: 0,
    }}>
        <div style={{
            width: '48px', height: '26px', borderRadius: '13px', position: 'relative',
            background: value ? 'linear-gradient(135deg,#fb923c,#f97316)' : 'rgba(255,255,255,0.15)',
            transition: 'background 0.3s',
            boxShadow: value ? '0 0 12px rgba(251,146,60,0.5)' : 'none',
        }}>
            <motion.div
                animate={{ x: value ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                    position: 'absolute', top: '3px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
            />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: value ? '#fb923c' : '#71717a' }}>
            {value ? 'Available' : 'On Leave'}
        </span>
    </button>
);

/* ── Custom Phase Dropdown (portal, position:fixed) ───── */
const PhaseSelect = ({ value, onChange, disabled }) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const btnRef = useRef(null);
    const rafRef = useRef(null);
    const current = PHASES.find(p => p.value === value) || PHASES[0];

    // Continuously sync dropdown position to button's live rect (follows scroll/resize)
    useEffect(() => {
        if (!open) {
            cancelAnimationFrame(rafRef.current);
            return;
        }
        const sync = () => {
            if (btnRef.current) {
                const r = btnRef.current.getBoundingClientRect();
                setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
            }
            rafRef.current = requestAnimationFrame(sync);
        };
        rafRef.current = requestAnimationFrame(sync);
        return () => cancelAnimationFrame(rafRef.current);
    }, [open]);

    // Close on outside click
    useEffect(() => {
        const h = (e) => {
            if (
                btnRef.current && !btnRef.current.contains(e.target) &&
                !document.getElementById('phase-portal')?.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const menu = (
        <AnimatePresence>
            {open && (
                <motion.div
                    id="phase-portal"
                    initial={{ opacity: 0, y: -6, scaleY: 0.92 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        background: '#1a1a24',
                        border: '1px solid rgba(255,255,255,0.16)',
                        borderRadius: '12px',
                        zIndex: 999999,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
                        transformOrigin: 'top',
                        maxHeight: '260px',
                        overflowY: 'auto',
                    }}
                >
                    {PHASES.map(ph => (
                        <button
                            key={ph.value}
                            onClick={() => { onChange(ph.value); setOpen(false); }}
                            style={{
                                width: '100%', padding: '10px 16px', textAlign: 'left',
                                fontSize: '13px',
                                color: value === ph.value ? '#8b5cf6' : ph.value === '' ? '#52525b' : '#e4e4e7',
                                background: value === ph.value ? 'rgba(139,92,246,0.18)' : 'transparent',
                                border: 'none', cursor: ph.value === '' ? 'default' : 'pointer',
                                fontFamily: 'inherit', transition: 'background .12s',
                                display: 'block',
                            }}
                            onMouseEnter={e => { if (value !== ph.value && ph.value !== '') e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = value === ph.value ? 'rgba(139,92,246,0.18)' : 'transparent'; }}
                        >
                            {ph.label}
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div style={{ position: 'relative', flex: 1 }}>
            <button
                ref={btnRef}
                disabled={disabled}
                onClick={() => { if (!disabled) setOpen(o => !o); }}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '8px', padding: '10px 14px',
                    background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
                    color: disabled ? '#52525b' : '#e4e4e7',
                    fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                }}
            >
                <span>{current.label}</span>
                <ChevronDown size={14} style={{
                    flexShrink: 0, transition: 'transform .2s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0)',
                    opacity: disabled ? 0.3 : 1,
                }} />
            </button>
            {ReactDOM.createPortal(menu, document.body)}
        </div>
    );
};

/* ── Progress Bar ──────────────────────────────────────── */
const ProgressBar = ({ phase }) => {
    const pct = PHASE_PCT[phase] ?? 0;
    const color = pct === 100 ? '#34d399' : pct >= 60 ? '#8b5cf6' : '#fbbf24';
    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Progress</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color }}>{pct}%</span>
            </div>
            <div style={{
                height: '6px', borderRadius: '99px',
                background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                        height: '100%', borderRadius: '99px',
                        background: pct === 100
                            ? 'linear-gradient(90deg,#059669,#34d399)'
                            : pct >= 60
                                ? 'linear-gradient(90deg,#fb923c,#f97316)'
                                : 'linear-gradient(90deg,#d97706,#fbbf24)',
                    }}
                />
            </div>
        </div>
    );
};

/* ── Worker Dashboard ─────────────────────────────────── */
const WorkerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('clients');
    const [available, setAvailable] = useState(true);
    const [contracts, setContracts] = useState([]);
    const [submitFeedback, setFeedback] = useState({});
    const [editingId, setEditingId] = useState(null);   // which contract is in edit mode
    const [editDraft, setEditDraft] = useState({});     // { value, deadline }
    const [loading, setLoading] = useState(true);
    const teamId = localStorage.getItem('teamId');
    const teamName = localStorage.getItem('teamName') || 'Team';

    // Initial Fetch
    useEffect(() => {
        if (localStorage.getItem('teamToken') !== 'true' || !teamId) {
            navigate('/team-login');
            return;
        }

        const fetchContracts = async () => {
            console.log('Fetching contracts for teamId:', teamId);
            const { data, error } = await supabase
                .from('contracts')
                .select(`*, companies(name)`)
                .eq('team_id', parseInt(teamId));

            if (error) {
                console.error('Contracts fetch error:', error.message);
            }

            if (data) {
                console.log('Fetched contracts raw:', data);
                const mapped = data.map(c => ({
                    id: c.id,
                    company: (c.companies && !Array.isArray(c.companies)) ? c.companies.name : (Array.isArray(c.companies) ? c.companies[0]?.name : 'Unknown'),
                    project: c.title,
                    value: c.value_str,
                    deadline: c.deadline,
                    details: c.details,
                    status: c.status,
                    phase: c.phase || '',
                    submittedPhase: c.submitted_phase || null,
                }));
                console.log('Mapped contracts:', mapped);
                setContracts(mapped);
            }
            setLoading(false);
        };
        fetchContracts();
    }, [navigate, teamId]);

    const handleToggleAvailability = async (val) => {
        setAvailable(val);
        // Map true -> 'available', false -> 'busy' (not working)
        const status = val ? 'available' : 'busy';
        await supabase.from('teams').update({ status }).eq('id', teamId);
    };

    const startEdit = (contract) => {
        setEditingId(contract.id);
        setEditDraft({ value: contract.value, deadline: contract.deadline });
    };
    const cancelEdit = () => { setEditingId(null); setEditDraft({}); };
    const saveEdit = async (id) => {
        const val = editDraft.value;
        const dead = editDraft.deadline;

        // Optimistic UI update
        setContracts(prev => prev.map(c => c.id === id ? { ...c, value: val, deadline: dead } : c));
        cancelEdit();

        // Save to Supabase
        await supabase.from('contracts').update({ value_str: val, deadline: dead }).eq('id', id);
    };

    const handleContractStatus = async (id, action) => {
        setContracts(prev => prev.map(c => c.id === id ? { ...c, status: action } : c));
        await supabase.from('contracts').update({ status: action }).eq('id', id);
    };

    const handlePhaseChange = (id, phase) =>
        setContracts(prev => prev.map(c => c.id === id ? { ...c, phase } : c));

    const handleSubmitPhase = async (id) => {
        const contract = contracts.find(c => c.id === id);
        if (!contract?.phase) {
            setFeedback(f => ({ ...f, [id]: 'error' }));
            setTimeout(() => setFeedback(f => ({ ...f, [id]: null })), 2500);
            return;
        }

        // UI update
        setContracts(prev => prev.map(c => c.id === id ? { ...c, submittedPhase: c.phase } : c));
        setFeedback(f => ({ ...f, [id]: 'success' }));
        setTimeout(() => setFeedback(f => ({ ...f, [id]: null })), 3000);

        // DB update
        await supabase.from('contracts').update({ phase: contract.phase, submitted_phase: contract.phase }).eq('id', id);
    };

    const statusStyle = (status) => {
        if (status === 'accepted') return { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' };
        if (status === 'rejected') return { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)' };
        return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' };
    };

    const navItems = [
        { key: 'clients', label: 'My Clients', icon: <Building2 size={18} /> },
        { key: 'contracts', label: 'Contracts', icon: <FileText size={18} /> },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', overflow: 'hidden' }}>

            {/* ── Sidebar ── */}
            <div className="glass" style={{
                width: '240px', flexShrink: 0, margin: '1rem', padding: '1.5rem',
                display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)',
            }}>
                {/* Team Profile */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '14px',
                        background: 'linear-gradient(135deg,#fb923c,#f97316)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '12px', boxShadow: '0 8px 16px rgba(251,146,60,0.2)',
                    }}>
                        <Users size={24} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>{teamName}</h2>
                    <p style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Project Team</p>
                </div>

                {/* Availability Toggle */}
                <div style={{
                    padding: '14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem',
                }}>
                    <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Availability</div>
                    <Toggle value={available} onChange={handleToggleAvailability} />
                </div>

                {/* Nav buttons */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {navItems.map(item => (
                        <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '11px 14px', borderRadius: '12px', border: 'none',
                            cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px',
                            fontWeight: activeTab === item.key ? 600 : 400,
                            background: activeTab === item.key
                                ? 'linear-gradient(135deg,#fb923c,#f97316)' : 'transparent',
                            color: activeTab === item.key ? '#fff' : '#a1a1aa',
                            boxShadow: activeTab === item.key ? '0 4px 14px rgba(251,146,60,0.35)' : 'none',
                            transition: 'all 0.25s',
                        }}>
                            {item.icon}
                            <span>{item.label}</span>
                            {item.key === 'contracts' && (
                                <span style={{
                                    marginLeft: 'auto', background: '#fbbf24',
                                    color: '#000', fontSize: '10px', fontWeight: 700,
                                    borderRadius: '99px', padding: '2px 7px',
                                }}>
                                    {contracts.filter(c => c.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <button onClick={() => {
                    localStorage.removeItem('teamToken');
                    localStorage.removeItem('teamId');
                    localStorage.removeItem('teamName');
                    navigate('/');
                }} style={{
                    marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 14px', borderRadius: '12px', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                    color: '#f87171', background: 'transparent', transition: 'background .2s',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <LogOut size={16} /><span>Logout</span>
                </button>
            </div>

            {/* ── Main Content ── */}
            <div style={{ flex: 1, padding: '2rem 2.5rem', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 700, color: '#fff' }}>
                            {activeTab === 'clients' ? 'My Clients' : 'Contracts'}
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#71717a' }}>
                            Team Portal · {teamName}
                        </p>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '99px',
                        background: available ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                        border: `1px solid ${available ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                    }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: available ? '#34d399' : '#f87171',
                            boxShadow: `0 0 8px ${available ? '#34d399' : '#f87171'}`,
                        }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: available ? '#34d399' : '#f87171' }}>
                            {available ? 'Available for Work' : 'Not Working / Busy'}
                        </span>
                    </div>
                </div>

                <AnimatePresence mode="wait">

                    {/* ── My Clients Tab ── */}
                    {activeTab === 'clients' && (
                        <motion.div key="clients"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'grid', gap: '16px' }}
                        >
                            {MOCK_CLIENTS.map(client => (
                                <div key={client.id} className="glass" style={{ padding: '22px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                                                background: `${client.tierColor}22`,
                                                border: `2px solid ${client.tierColor}55`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Building2 size={20} color={client.tierColor} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '17px', color: '#fff' }}>{client.company}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#a1a1aa', fontSize: '13px' }}>
                                                    <Mail size={12} />{client.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ textAlign: 'right', fontSize: '12px', color: '#71717a' }}>
                                                <div>Client since</div>
                                                <div style={{ color: '#a1a1aa', fontWeight: 600 }}>{client.since}</div>
                                            </div>
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '8px', fontSize: '11px',
                                                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                                                background: `${client.tierColor}22`, color: client.tierColor,
                                                border: `1px solid ${client.tierColor}44`,
                                            }}>Tier {client.tier}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── Contracts Tab ── */}
                    {activeTab === 'contracts' && (
                        <motion.div key="contracts"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'grid', gap: '24px' }}
                        >
                            {contracts.map(contract => {
                                const st = statusStyle(contract.status);
                                const fb = submitFeedback[contract.id];
                                const isAccepted = contract.status === 'accepted';
                                const submittedLabel = PHASES.find(p => p.value === contract.submittedPhase)?.label;

                                return (
                                    <div key={contract.id} className="glass" style={{ overflow: 'hidden' }}>
                                        {/* Top colour strip */}
                                        <div style={{
                                            height: '3px', background:
                                                contract.status === 'accepted' ? '#34d399' :
                                                    contract.status === 'rejected' ? '#f87171' : '#fbbf24',
                                        }} />

                                        <div style={{ padding: '22px 24px' }}>
                                            {/* Header row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>{contract.project}</div>
                                                    <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Building2 size={13} />{contract.company}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '8px', fontSize: '12px',
                                                    fontWeight: 700, background: st.bg, color: st.color, border: st.border,
                                                }}>
                                                    {contract.status === 'pending' ? '⏳ Pending' :
                                                        contract.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6 }}>
                                                {contract.details}
                                            </p>

                                            {/* Meta row – editable */}
                                            {editingId === contract.id ? (
                                                <div style={{
                                                    marginBottom: '16px', padding: '14px', borderRadius: '12px',
                                                    background: 'rgba(139,92,246,0.07)',
                                                    border: '1px solid rgba(139,92,246,0.25)',
                                                }}>
                                                    <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 600 }}>✏️ Edit Contract Details</div>
                                                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                        <div style={{ flex: 1, minWidth: '120px' }}>
                                                            <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '5px' }}>Value / Prize</label>
                                                            <input
                                                                value={editDraft.value}
                                                                onChange={e => setEditDraft(d => ({ ...d, value: e.target.value }))}
                                                                className="input-field"
                                                                style={{ padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                                                                placeholder="e.g. $25,000"
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: '140px' }}>
                                                            <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '5px' }}>Deadline</label>
                                                            <input
                                                                value={editDraft.deadline}
                                                                onChange={e => setEditDraft(d => ({ ...d, deadline: e.target.value }))}
                                                                className="input-field"
                                                                style={{ padding: '8px 12px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                                                                placeholder="e.g. Apr 30, 2026"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                            onClick={() => saveEdit(contract.id)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                padding: '8px 16px', border: 'none', borderRadius: '8px',
                                                                background: 'linear-gradient(135deg,#059669,#34d399)',
                                                                color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                                                                fontSize: '13px', fontWeight: 600,
                                                            }}>
                                                            <Save size={14} /> Save
                                                        </motion.button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                padding: '8px 14px', borderRadius: '8px',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                background: 'transparent', color: '#71717a',
                                                                cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                                                            }}>
                                                            <X size={13} /> Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', alignItems: 'center' }}>
                                                    <div style={{ fontSize: '13px' }}>
                                                        <span style={{ color: '#71717a' }}>Value: </span>
                                                        <span style={{ color: '#fff', fontWeight: 700 }}>{contract.value}</span>
                                                    </div>
                                                    <div style={{ fontSize: '13px' }}>
                                                        <span style={{ color: '#71717a' }}>Deadline: </span>
                                                        <span style={{ color: '#fff', fontWeight: 700 }}>{contract.deadline}</span>
                                                    </div>
                                                    {contract.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => startEdit(contract)}
                                                            title="Edit value & deadline"
                                                            style={{
                                                                marginLeft: 'auto', display: 'flex', alignItems: 'center',
                                                                gap: '5px', padding: '5px 10px', borderRadius: '7px',
                                                                border: '1px solid rgba(139,92,246,0.3)',
                                                                background: 'rgba(139,92,246,0.1)', color: '#a78bfa',
                                                                cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px',
                                                            }}>
                                                            <Pencil size={12} /> Edit
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* ── Progress Bar (only if phase submitted) ── */}
                                            {contract.submittedPhase && (
                                                <ProgressBar phase={contract.submittedPhase} />
                                            )}

                                            {/* ── Phase Completion Dropdown + Submit (accepted contracts only) ── */}
                                            {contract.status === 'accepted' && (
                                                <div style={{
                                                    marginBottom: '16px', padding: '16px',
                                                    borderRadius: '12px',
                                                    background: 'rgba(52,211,153,0.04)',
                                                    border: '1px solid rgba(52,211,153,0.15)',
                                                    position: 'relative', zIndex: 10,
                                                }}>
                                                    <div style={{ fontSize: '12px', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 600 }}>
                                                        📍 Project Phase
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <PhaseSelect
                                                            value={contract.phase}
                                                            onChange={(v) => handlePhaseChange(contract.id, v)}
                                                            disabled={false}
                                                        />
                                                        <motion.button
                                                            whileHover={{ scale: 1.04 }}
                                                            whileTap={{ scale: 0.96 }}
                                                            onClick={() => handleSubmitPhase(contract.id)}
                                                            style={{
                                                                flexShrink: 0, display: 'flex', alignItems: 'center',
                                                                gap: '6px', padding: '10px 18px',
                                                                border: 'none', borderRadius: '10px',
                                                                cursor: 'pointer',
                                                                fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                                                                background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
                                                                color: '#fff',
                                                                boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
                                                                transition: 'all 0.2s',
                                                            }}
                                                        >
                                                            <Send size={15} />
                                                            Submit
                                                        </motion.button>
                                                    </div>

                                                    {/* Submitted phase label */}
                                                    {contract.submittedPhase && (
                                                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#71717a' }}>
                                                            Last submitted: <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{submittedLabel}</span>
                                                        </div>
                                                    )}

                                                    {/* Feedback toast */}
                                                    <AnimatePresence>
                                                        {fb && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                                style={{
                                                                    marginTop: '10px', padding: '8px 14px',
                                                                    borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                                                    background: fb === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                                                                    color: fb === 'success' ? '#34d399' : '#f87171',
                                                                    border: `1px solid ${fb === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                                                                }}
                                                            >
                                                                {fb === 'success'
                                                                    ? '✅ Phase updated successfully!'
                                                                    : '⚠️ Please select a phase before submitting.'}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}

                                            {/* Accept / Reject */}
                                            {contract.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => handleContractStatus(contract.id, 'accepted')}
                                                        style={{
                                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            gap: '8px', padding: '11px', border: 'none', borderRadius: '10px',
                                                            cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600,
                                                            background: 'linear-gradient(135deg,#059669,#34d399)',
                                                            color: '#fff', boxShadow: '0 4px 14px rgba(52,211,153,0.3)',
                                                        }}
                                                    >
                                                        <CheckCircle2 size={17} /> Accept Contract
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => handleContractStatus(contract.id, 'rejected')}
                                                        style={{
                                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            gap: '8px', padding: '11px', borderRadius: '10px',
                                                            border: '1px solid rgba(248,113,113,0.3)',
                                                            cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600,
                                                            background: 'rgba(248,113,113,0.1)', color: '#f87171',
                                                        }}
                                                    >
                                                        <XCircle size={17} /> Decline
                                                    </motion.button>
                                                </div>
                                            )}

                                            {/* Reset (if already decided) */}
                                            {contract.status !== 'pending' && (
                                                <button
                                                    onClick={() => handleContractStatus(contract.id, 'pending')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                                                        color: '#71717a', borderRadius: '8px', padding: '8px 14px',
                                                        fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                                                    }}
                                                >
                                                    <RotateCcw size={12} /> Reset to Pending
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default WorkerDashboard;
