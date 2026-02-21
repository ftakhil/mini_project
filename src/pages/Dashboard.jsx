import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Building, CheckCircle2,
    LogOut, Mail, ChevronRight, ChevronDown, Briefcase, Activity, Clock, Plus, Save, X, Pencil
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MOCK_COMPANIES = [
    { id: 1, name: "Global Systems", email: "contact@globalsys.com", tier: 1 },
    { id: 2, name: "Nexus Innovations", email: "hello@nexus.io", tier: 2 },
    { id: 3, name: "Alpha Tech", email: "info@alphatech.com", tier: 3 },
    { id: 4, name: "Beta Solutions", email: "support@beta.net", tier: 3 },
    { id: 5, name: "Zephyr Energy", email: "zephyr@energy.com", tier: 4 },
    { id: 6, name: "Unknown Data", email: "missing@info.com", tier: 0 },
    { id: 7, name: "Prime Logistics", email: "ops@prime.com", tier: 1 },
    { id: 8, name: "Cloud Spire", email: "admin@cloudspire.io", tier: 2 },
];

const TIER_CONFIG = {
    1: { label: 'Tier 1', subtitle: 'Gold', color: '#fbbf24' },
    2: { label: 'Tier 2', subtitle: 'Red', color: '#ef4444' },
    3: { label: 'Tier 3', subtitle: 'Purple', color: '#a855f7' },
    4: { label: 'Tier 4', subtitle: 'Green', color: '#10b981' },
    0: { label: 'Unknown', subtitle: 'Grey', color: '#71717a' },
};

const SORT_OPTIONS = [
    { value: 'none', label: 'Sort By' },
    { value: 'tier-asc', label: 'Tier (1 → 4)' },
    { value: 'tier-desc', label: 'Tier (4 → 1)' },
];

// Tier filter pills: 'all' means show everything
const FILTER_PILLS = [
    { value: 'all', label: 'All', color: '#fb923c' },
    { value: 1, label: '🥇 Tier 1', color: '#fbbf24' },
    { value: 2, label: '🔴 Tier 2', color: '#ef4444' },
    { value: 3, label: '🟣 Tier 3', color: '#a855f7' },
    { value: 4, label: '🟢 Tier 4', color: '#10b981' },
    { value: 0, label: '⚪ Unknown', color: '#71717a' },
];

const PHASE_PCT_ADMIN = {
    none: 0, kickoff: 5, requirements: 15, design: 28,
    development: 50, testing: 68, uat: 80, deployment: 92, completed: 100,
};

// MOCK_TEAMS removed - now fetched from DB

const MOCK_ONGOING_PROJECTS = [
    { id: 101, title: 'ERP Migration Q2', client: 'Global Systems', team: 'Alpha Squad', phase: 'testing', value: '$28,000', deadline: 'Apr 30, 2026' },
    { id: 102, title: 'Data Lake Integration', client: 'Nexus Innovations', team: 'Beta Force', phase: 'development', value: '$45,000', deadline: 'Jul 15, 2026' },
    { id: 103, title: 'Smart Factory IoT', client: 'Zephyr Energy', team: 'Gamma Unit', phase: 'uat', value: '$60,000', deadline: 'May 10, 2026' },
    { id: 104, title: 'Customer Portal Revamp', client: 'Alpha Tech', team: 'Delta Core', phase: 'deployment', value: '$18,500', deadline: 'Mar 28, 2026' },
];

/* ── Custom Dark Sort Dropdown ─────────────────────────── */
const CustomSelect = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', minWidth: '160px' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '8px',
                    padding: '9px 16px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px', color: '#ffffff',
                    fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                }}
            >
                {current.label}
                <ChevronDown size={15} style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        style={{
                            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                            minWidth: '100%', background: '#1e1e28',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '12px', overflow: 'hidden', zIndex: 999,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}
                    >
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    width: '100%', padding: '10px 16px', textAlign: 'left',
                                    fontSize: '14px',
                                    color: value === opt.value ? '#fb923c' : '#e4e4e7',
                                    background: value === opt.value ? 'rgba(251,146,60,0.15)' : 'transparent',
                                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? 'rgba(251,146,60,0.15)' : 'transparent'}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ── Dashboard ─────────────────────────────────────────── */
const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('analytics');
    const [sortBy, setSortBy] = useState('none');
    const [filterTier, setFilterTier] = useState('all');
    const navigate = useNavigate();

    // Teams State
    const [teams, setTeams] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(true);
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editTeamDraft, setEditTeamDraft] = useState({ username: '', password: '' });

    // Add New Team State
    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [newTeamDraft, setNewTeamDraft] = useState({ name: '', lead_name: '', total_members: 1, available_members: 1, skills: '', status: 'available', username: '', password: '' });

    // Analytics State
    const [analyticsData, setAnalyticsData] = useState({
        meetings: [],
        projectsHistory: []
    });
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);

    useEffect(() => {
        if (localStorage.getItem('adminToken') !== 'true') {
            navigate('/admin-login');
            return;
        }

        const fetchTeams = async () => {
            const { data, error } = await supabase.from('teams').select('*, contracts(title, phase, status)').order('id', { ascending: true });
            if (!error && data) {
                const mapped = data.map(t => {
                    const activeC = t.contracts.find(c => c.status === 'accepted');
                    return {
                        ...t,
                        project: activeC?.title || null,
                        phase: activeC?.phase || 'none'
                    };
                });
                setTeams(mapped);
            }
            setLoadingTeams(false);
        };
        fetchTeams();

        const fetchAnalytics = async () => {
            setLoadingAnalytics(true);

            // 1. Meeting Success (Leads)
            const { data: leads } = await supabase.from('leads').select('status');
            if (leads) {
                const successStatuses = ['routed', 'qualified', 'success'];
                const successCount = leads.filter(l => successStatuses.includes(l.status)).length;
                const failedCount = leads.filter(l => l.status === 'rejected' || l.status === 'failed').length;
                const otherCount = leads.length - (successCount + failedCount);

                setAnalyticsData(prev => ({
                    ...prev,
                    meetings: [
                        { name: 'Successful', value: successCount || 12 }, // Fallback to mock if empty
                        { name: 'Failed', value: failedCount || 4 },
                        { name: 'In Progress', value: otherCount || 8 }
                    ]
                }));
            }

            // 2. Projects History (Contracts) - Enhanced Mock Data
            const { data: contracts } = await supabase.from('contracts').select('status, created_at');

            // Comprehensive mock history for visualization
            const months = ['Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
            const history = [
                { month: 'Sept', completed: 4, revenue: 12000 },
                { month: 'Oct', completed: 7, revenue: 18500 },
                { month: 'Nov', completed: 5, revenue: 15000 },
                { month: 'Dec', completed: 12, revenue: 32000 },
                { month: 'Jan', completed: 9, revenue: 24000 },
                { month: 'Feb', completed: 15, revenue: 42000 }
            ];

            setAnalyticsData(prev => ({ ...prev, projectsHistory: history }));
            setLoadingAnalytics(false);
        };
        fetchAnalytics();
    }, [navigate]);

    const handleSaveTeamAuth = async (id) => {
        await supabase.from('teams').update({ username: editTeamDraft.username, password: editTeamDraft.password }).eq('id', id);
        setTeams(prev => prev.map(t => t.id === id ? { ...t, username: editTeamDraft.username, password: editTeamDraft.password } : t));
        setEditingTeamId(null);
    };

    const handleAddTeam = async () => {
        const skillsArray = newTeamDraft.skills.split(',').map(s => s.trim()).filter(s => s);
        const toInsert = {
            name: newTeamDraft.name,
            lead_name: newTeamDraft.lead_name,
            total_members: parseInt(newTeamDraft.total_members) || 1,
            available_members: parseInt(newTeamDraft.available_members) || 1,
            skills: skillsArray.length ? skillsArray : ['General'],
            status: newTeamDraft.status,
            username: newTeamDraft.username,
            password: newTeamDraft.password
        };

        const { data, error } = await supabase.from('teams').insert([toInsert]).select();
        if (!error && data) {
            setTeams(prev => [...prev, { ...data[0], project: null, phase: 'none' }]);
            setIsAddingTeam(false);
            setNewTeamDraft({ name: '', lead_name: '', total_members: 1, available_members: 1, skills: '', status: 'available', username: '', password: '' });
        }
    };

    // 1. Filter by tier
    const filtered = filterTier === 'all'
        ? MOCK_COMPANIES
        : MOCK_COMPANIES.filter(c => c.tier === filterTier);

    // 2. Sort the filtered list
    const displayed = [...filtered].sort((a, b) => {
        if (sortBy === 'tier-asc') return (a.tier || 5) - (b.tier || 5);
        if (sortBy === 'tier-desc') return (b.tier || 0) - (a.tier || 0);
        return 0;
    });

    const navItems = [
        { key: 'analytics', label: 'Analytics Hub', icon: <Activity size={20} /> },
        { key: 'ongoing', label: 'Ongoing Projects', icon: <Clock size={20} /> },
        { key: 'teams', label: 'Available Teams', icon: <Briefcase size={20} /> },
        { key: 'clients', label: 'Active Clients', icon: <Users size={20} /> },
        { key: 'company', label: 'Company Directory', icon: <Building size={20} /> },
        { key: 'projects', label: 'Projects Done', icon: <CheckCircle2 size={20} /> },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', overflow: 'hidden' }}>

            {/* ── Sidebar ── */}
            <div className="glass" style={{
                width: '250px', flexShrink: 0, margin: '1rem', padding: '1.5rem',
                display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg,#fb923c,#f97316)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '18px', color: '#fff',
                    }}>K</div>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Admin Panel</span>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {navItems.map(item => (
                        <button key={item.key} onClick={() => setActiveTab(item.key)} style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '11px 14px', borderRadius: '12px', border: 'none',
                            cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px',
                            fontWeight: activeTab === item.key ? 600 : 400,
                            background: activeTab === item.key
                                ? 'linear-gradient(135deg,#fb923c,#f97316)'
                                : 'transparent',
                            color: activeTab === item.key ? '#fff' : '#a1a1aa',
                            boxShadow: activeTab === item.key ? '0 4px 14px rgba(251,146,60,0.35)' : 'none',
                            transition: 'all 0.25s',
                        }}>
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <button onClick={() => {
                    localStorage.removeItem('adminToken');
                    navigate('/');
                }} style={{
                    marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 14px', borderRadius: '12px', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px',
                    color: '#f87171', background: 'transparent', transition: 'background .2s',
                }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>

            {/* ── Main Content ── */}
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                        {navItems.find(n => n.key === activeTab)?.label}
                    </h2>
                    {activeTab === 'company' && (
                        <CustomSelect value={sortBy} onChange={setSortBy} />
                    )}
                </div>

                {/* ── Tier Filter Pills (company tab only) ── */}
                {activeTab === 'company' && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                        {FILTER_PILLS.map(pill => {
                            const active = filterTier === pill.value;
                            return (
                                <button key={pill.value} onClick={() => setFilterTier(pill.value)} style={{
                                    padding: '7px 18px', borderRadius: '99px', border: 'none',
                                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
                                    transition: 'all 0.2s',
                                    background: active ? pill.color : 'rgba(255,255,255,0.06)',
                                    color: active ? '#fff' : '#a1a1aa',
                                    boxShadow: active ? `0 4px 14px ${pill.color}55` : 'none',
                                    outline: active ? `2px solid ${pill.color}80` : '2px solid transparent',
                                    outlineOffset: '2px',
                                }}>
                                    {pill.label}
                                </button>
                            );
                        })}

                        {/* Result count badge */}
                        <span style={{
                            marginLeft: 'auto', alignSelf: 'center',
                            fontSize: '13px', color: '#71717a',
                        }}>
                            {displayed.length} {displayed.length === 1 ? 'company' : 'companies'}
                        </span>
                    </div>
                )}

                <AnimatePresence mode="wait">

                    {/* Analytics Hub */}
                    {activeTab === 'analytics' && (
                        <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                                {/* Meeting Success Chart */}
                                <div className="glass" style={{ padding: '24px', height: '400px', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>Meeting Triage Success</h3>
                                    <p style={{ color: '#71717a', fontSize: '13px', margin: '4px 0 20px' }}>AI-driven lead qualification results</p>
                                    <div style={{ flex: 1 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analyticsData.meetings}
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#f43f5e" />
                                                    <Cell fill="#fb923c" />
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Projects Completion History */}
                                <div className="glass" style={{ padding: '24px', height: '400px', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>Project Completion Growth</h3>
                                    <p style={{ color: '#71717a', fontSize: '13px', margin: '4px 0 20px' }}>Successful deliverables over time</p>
                                    <div style={{ flex: 1 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={analyticsData.projectsHistory}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                                                <YAxis yAxisId="left" stroke="#38bdf8" fontSize={12} orientation="left" />
                                                <YAxis yAxisId="right" stroke="#fb923c" fontSize={12} orientation="right" />
                                                <Tooltip
                                                    contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                                />
                                                <Legend />
                                                <Line
                                                    yAxisId="left"
                                                    type="monotone"
                                                    dataKey="completed"
                                                    name="Projects"
                                                    stroke="#38bdf8"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#38bdf8', r: 5 }}
                                                    activeDot={{ r: 8 }}
                                                />
                                                <Line
                                                    yAxisId="right"
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    name="Revenue ($)"
                                                    stroke="#fb923c"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#fb923c', r: 5 }}
                                                    activeDot={{ r: 8 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {/* Active Clients */}
                    {activeTab === 'clients' && (
                        <motion.div key="clients"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'grid', gap: '14px' }}
                        >
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="glass" style={{
                                    padding: '18px 22px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '46px', height: '46px', borderRadius: '50%',
                                            background: 'rgba(251,146,60,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Users size={20} color="#fb923c" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '16px', color: '#fff' }}>Active Client #{i}</div>
                                            <div style={{ fontSize: '13px', color: '#a1a1aa' }}>Last active: {i * 2} hours ago</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} color="#a1a1aa" />
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Company Directory */}
                    {activeTab === 'company' && (
                        <motion.div key={`company-${filterTier}-${sortBy}`}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}
                        >
                            {displayed.length === 0 ? (
                                <div style={{
                                    gridColumn: '1/-1', textAlign: 'center',
                                    padding: '60px 20px', color: '#52525b',
                                    fontSize: '15px',
                                }}>
                                    No companies found for this tier.
                                </div>
                            ) : displayed.map(company => {
                                const cfg = TIER_CONFIG[company.tier];
                                return (
                                    <motion.div layout key={company.id} className="glass" style={{ overflow: 'hidden' }}>
                                        <div style={{ height: '4px', background: cfg.color }} />
                                        <div style={{ padding: '18px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>{company.name}</span>
                                                <span style={{
                                                    padding: '3px 8px', borderRadius: '6px', fontSize: '10px',
                                                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                                                    background: `${cfg.color}22`, color: cfg.color,
                                                    border: `1px solid ${cfg.color}44`, whiteSpace: 'nowrap',
                                                }}>{cfg.label}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a1a1aa', fontSize: '13px', marginBottom: '14px' }}>
                                                <Mail size={13} />
                                                {company.email}
                                            </div>
                                            <button
                                                style={{
                                                    width: '100%', padding: '8px', border: 'none',
                                                    background: `${cfg.color}15`,
                                                    color: cfg.color, borderRadius: '8px',
                                                    fontSize: '13px', fontWeight: 600,
                                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background .18s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = `${cfg.color}30`}
                                                onMouseLeave={e => e.currentTarget.style.background = `${cfg.color}15`}
                                            >View Details</button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Ongoing Projects */}
                    {activeTab === 'ongoing' && (
                        <motion.div key="ongoing"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))', gap: '24px' }}
                        >
                            {MOCK_ONGOING_PROJECTS.map(proj => {
                                const projPct = PHASE_PCT_ADMIN[proj.phase] ?? 0;
                                const projColor = projPct === 100 ? '#34d399' : projPct >= 60 ? '#fb923c' : '#fbbf24';
                                const formattedPhase = proj.phase.charAt(0).toUpperCase() + proj.phase.slice(1).replace('-', ' ');

                                return (
                                    <div key={proj.id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>{proj.title}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
                                                    <Building size={12} /> {proj.client}
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                                                background: 'rgba(251,146,60,0.1)', color: '#fb923c',
                                                border: '1px solid rgba(251,146,60,0.2)',
                                            }}>
                                                Team: {proj.team}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                            <div>
                                                <span style={{ color: '#71717a', fontSize: '12px', display: 'block', marginBottom: '2px' }}>Value</span>
                                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{proj.value}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: '#71717a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                                    <Clock size={12} /> Deadline
                                                </span>
                                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{proj.deadline}</span>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div style={{ marginTop: 'auto', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7' }}>Phase: <span style={{ color: projColor }}>{formattedPhase}</span></span>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: projColor }}>{projPct}%</span>
                                            </div>
                                            <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: `${projPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    style={{
                                                        height: '100%', borderRadius: '99px',
                                                        background: projPct === 100 ? 'linear-gradient(90deg,#059669,#34d399)'
                                                            : projPct >= 60 ? 'linear-gradient(90deg,#fb923c,#f97316)'
                                                                : 'linear-gradient(90deg,#d97706,#fbbf24)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Projects Done */}
                    {activeTab === 'projects' && (
                        <motion.div key="projects"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            style={{ display: 'grid', gap: '18px' }}
                        >
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass" style={{ padding: '28px', display: 'flex', borderLeft: '4px solid #f97316' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <CheckCircle2 size={20} color="#f97316" />
                                            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>Project Alpha-0{i}</h4>
                                        </div>
                                        <p style={{ margin: 0, color: '#a1a1aa', maxWidth: '480px' }}>
                                            Successfully implemented enterprise architecture patterns for Fortune 500 partner.
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '20px' }}>
                                        <div style={{ color: '#fb923c', fontWeight: 700, fontSize: '20px' }}>$45,000</div>
                                        <div style={{ color: '#71717a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Completed Dec 2023</div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Available Teams */}
                    {activeTab === 'teams' && (
                        <motion.div key="teams"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                                <button onClick={() => setIsAddingTeam(!isAddingTeam)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'linear-gradient(135deg,#fb923c,#f97316)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                                    <Plus size={16} /> Add New Team
                                </button>
                            </div>

                            {/* Add Team Form */}
                            <AnimatePresence>
                                {isAddingTeam && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '24px' }}>
                                        <div className="glass" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderLeft: '4px solid #fb923c' }}>
                                            <div><label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Team Name</label><input value={newTeamDraft.name} onChange={e => setNewTeamDraft(d => ({ ...d, name: e.target.value }))} className="input-field" style={{ width: '100%', padding: '10px', marginTop: '6px' }} /></div>
                                            <div><label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Lead Name</label><input value={newTeamDraft.lead_name} onChange={e => setNewTeamDraft(d => ({ ...d, lead_name: e.target.value }))} className="input-field" style={{ width: '100%', padding: '10px', marginTop: '6px' }} /></div>
                                            <div><label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Total Members</label><input type="number" value={newTeamDraft.total_members} onChange={e => setNewTeamDraft(d => ({ ...d, total_members: e.target.value }))} className="input-field" style={{ width: '100%', padding: '10px', marginTop: '6px' }} /></div>
                                            <div><label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Available Members</label><input type="number" value={newTeamDraft.available_members} onChange={e => setNewTeamDraft(d => ({ ...d, available_members: e.target.value }))} className="input-field" style={{ width: '100%', padding: '10px', marginTop: '6px' }} /></div>
                                            <div><label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Skills (comma separated)</label><input value={newTeamDraft.skills} onChange={e => setNewTeamDraft(d => ({ ...d, skills: e.target.value }))} className="input-field" style={{ width: '100%', padding: '10px', marginTop: '6px' }} placeholder="Web, Node, ERP" /></div>
                                            <div><label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Status</label><select value={newTeamDraft.status} onChange={e => setNewTeamDraft(d => ({ ...d, status: e.target.value }))} className="input-field" style={{ width: '100%', padding: '10px', marginTop: '6px', background: 'var(--bg-deep)' }}><option value="available">Available</option><option value="partial">Partial</option><option value="busy">Busy</option></select></div>
                                            <div><label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Login Username</label><input value={newTeamDraft.username} onChange={e => setNewTeamDraft(d => ({ ...d, username: e.target.value }))} className="input-field" style={{ width: '100%', padding: '10px', marginTop: '6px' }} /></div>
                                            <div><label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Login Password</label><input value={newTeamDraft.password} onChange={e => setNewTeamDraft(d => ({ ...d, password: e.target.value }))} className="input-field" style={{ width: '100%', padding: '10px', marginTop: '6px' }} /></div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', gridColumn: '1 / -1' }}>
                                                <button onClick={handleAddTeam} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', background: '#34d399', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Save Team</button>
                                                <button onClick={() => setIsAddingTeam(false)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '20px' }}>
                                {loadingTeams ? <div style={{ color: '#a1a1aa', padding: '20px' }}>Loading teams...</div> :
                                    teams.map(team => {
                                        const statusColor = team.status === 'available' ? '#34d399' : team.status === 'partial' ? '#fbbf24' : '#f87171';
                                        const statusLabel = team.status === 'available' ? 'Available' : team.status === 'partial' ? 'Partial' : 'Busy';
                                        const availPct = team.total_members > 0 ? Math.round((team.available_members / team.total_members) * 100) : 0;
                                        const projPct = PHASE_PCT_ADMIN[team.phase] ?? 0;
                                        const projColor = projPct === 100 ? '#34d399' : projPct >= 60 ? '#fb923c' : '#fbbf24';

                                        return (
                                            <div key={team.id} className="glass" style={{ padding: '22px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: statusColor }} />
                                                <div style={{ paddingLeft: '10px', flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '17px', color: '#fff' }}>{team.name}</div>
                                                            <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '3px' }}>Lead: {team.lead_name}</div>
                                                        </div>
                                                        <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>{statusLabel}</span>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                                        <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                                                            <svg width="48" height="48" viewBox="0 0 48 48">
                                                                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                                                                <circle cx="24" cy="24" r="20" fill="none" stroke={statusColor} strokeWidth="4"
                                                                    strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - availPct / 100)}`} strokeLinecap="round" transform="rotate(-90 24 24)" />
                                                            </svg>
                                                            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '10px', fontWeight: 700, color: statusColor }}>{availPct}%</span>
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#a1a1aa' }}>
                                                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '22px' }}>{team.available_members}</span>
                                                            <span style={{ color: '#71717a' }}>/{team.total_members} available</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ marginBottom: '14px', padding: '12px', borderRadius: '10px', background: team.project ? 'rgba(251,146,60,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${team.project ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                                                        <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Ongoing Project</div>
                                                        {team.project ? (
                                                            <>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7', marginBottom: '8px' }}>{team.project}</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '11px', color: '#71717a' }}>{team.phase.charAt(0).toUpperCase() + team.phase.slice(1)}</span><span style={{ fontSize: '11px', fontWeight: 700, color: projColor }}>{projPct}%</span></div>
                                                                <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                                    <div style={{ height: '100%', borderRadius: '99px', width: `${projPct}%`, background: projPct === 100 ? 'linear-gradient(90deg,#059669,#34d399)' : projPct >= 60 ? 'linear-gradient(90deg,#fb923c,#f97316)' : 'linear-gradient(90deg,#d97706,#fbbf24)' }} />
                                                                </div>
                                                            </>
                                                        ) : <div style={{ fontSize: '12px', color: '#52525b', fontStyle: 'italic' }}>No active project</div>}
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                                        {team.skills.map(s => (
                                                            <span key={s} style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' }}>{s}</span>
                                                        ))}
                                                    </div>

                                                    {/* Auth Editing Section */}
                                                    {editingTeamId === team.id ? (
                                                        <div style={{ marginTop: 'auto', background: 'rgba(251,146,60,0.08)', border: '1px dashed rgba(251,146,60,0.3)', padding: '12px', borderRadius: '10px' }}>
                                                            <div style={{ fontSize: '11px', color: '#fb923c', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Update Team Login</div>
                                                            <input value={editTeamDraft.username} onChange={e => setEditTeamDraft(t => ({ ...t, username: e.target.value }))} className="input-field" placeholder="Username" style={{ width: '100%', padding: '8px', marginBottom: '8px', fontSize: '12px' }} />
                                                            <input value={editTeamDraft.password} onChange={e => setEditTeamDraft(t => ({ ...t, password: e.target.value }))} className="input-field" placeholder="Password" style={{ width: '100%', padding: '8px', marginBottom: '10px', fontSize: '12px' }} />
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button onClick={() => handleSaveTeamAuth(team.id)} style={{ flex: 1, padding: '6px', background: '#34d399', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>Save</button>
                                                                <button onClick={() => setEditingTeamId(null)} style={{ flex: 1, padding: '6px', background: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setEditingTeamId(team.id); setEditTeamDraft({ username: team.username || '', password: team.password || '' }); }}
                                                            style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                                        >
                                                            <Pencil size={12} /> Edit Login Details
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default Dashboard;
