import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Building, CheckCircle2,
    LogOut, Mail, ChevronRight, Briefcase, Activity, Clock, Plus, Save, X, Pencil,
    Search, Bell, Settings, ArrowUpRight, TrendingUp, Calendar as CalIcon, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
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
    1: { label: 'Tier 1', subtitle: 'Global', color: '#ffbf00' },
    2: { label: 'Tier 2', subtitle: 'Priority', color: '#ff5f5f' },
    3: { label: 'Tier 3', subtitle: 'Rising', color: '#a855f7' },
    4: { label: 'Tier 4', subtitle: 'Growth', color: '#34d399' },
    0: { label: 'Unknown', subtitle: 'Misc', color: '#9ca3af' },
};

const FILTER_PILLS = [
    { value: 'all', label: 'All Clients', color: '#ffcc00' },
    { value: 1, label: 'Tier 1', color: '#ffbf00' },
    { value: 2, label: 'Tier 2', color: '#ff5f5f' },
    { value: 3, label: 'Tier 3', color: '#a855f7' },
    { value: 4, label: 'Tier 4', color: '#34d399' },
];

const NAV_ITEMS = [
    { key: 'analytics', label: 'Dashboard', icon: <TrendingUp size={18} /> },
    { key: 'company', label: 'Clients', icon: <Building size={18} /> },
    { key: 'teams', label: 'Teams', icon: <Users size={18} /> },
    { key: 'ongoing', label: 'Active Projects', icon: <Activity size={18} /> },
    { key: 'projects', label: 'History', icon: <CheckCircle2 size={18} /> },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');
    const [teams, setTeams] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(true);
    const [filterTier, setFilterTier] = useState('all');

    useEffect(() => {
        if (localStorage.getItem('adminToken') !== 'true') {
            navigate('/admin-login');
            return;
        }
        fetchTeams();
    }, [navigate]);

    const fetchTeams = async () => {
        setLoadingTeams(true);
        const { data, error } = await supabase.from('teams').select('*').order('name');
        if (data) setTeams(data);
        setLoadingTeams(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/');
    };

    const analyticsData = {
        meetings: [
            { name: 'Success', value: 45 },
            { name: 'Pending', value: 25 },
            { name: 'On Hold', value: 15 },
        ],
        projectsHistory: [
            { month: 'Jan', completed: 12, revenue: 15000 },
            { month: 'Feb', completed: 18, revenue: 22000 },
            { month: 'Mar', completed: 15, revenue: 19000 },
            { month: 'Apr', completed: 25, revenue: 35000 },
            { month: 'May', completed: 30, revenue: 42000 },
        ],
    };

    const displayedCompanies = MOCK_COMPANIES.filter(c =>
        filterTier === 'all' || c.tier === filterTier
    );

    return (
        <div style={{
            minHeight: '100vh', background: '#f5f5f7',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px'
        }}>

            {/* Top Bar Navigation */}
            <div className="glass" style={{
                padding: '12px 24px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderRadius: '30px', background: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '45px', height: '45px', background: '#1a1a1a',
                        borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Zap size={22} color="#ffcc00" fill="#ffcc00" />
                    </div>
                </div>

                <nav style={{ display: 'flex', background: '#f1f5f9', borderRadius: '99px', padding: '4px' }}>
                    {NAV_ITEMS.map(item => (
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
                            {activeTab === item.key && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ border: 'none', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><Search size={18} /></button>
                        <button style={{ border: 'none', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><Bell size={18} /></button>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
                    <button onClick={handleLogout} style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><LogOut size={18} /> Exit</button>
                </div>
            </div>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <AnimatePresence mode="wait">

                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                <div>
                                    <h1 style={{ fontSize: '32px', color: '#1a1a1a' }}>Hi, Admin</h1>
                                    <p style={{ color: '#64748b', marginTop: '4px' }}>Here's what is happening with Kaizen Hub today.</p>
                                </div>
                                <div style={{ display: 'flex', background: '#fff', padding: '8px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', alignItems: 'center', gap: '10px' }}>
                                    <CalIcon size={16} color="#64748b" />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>September 2024</span>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                                {[
                                    { label: 'Total Clients', value: '48', trend: '+12%', color: '#ffcc00' },
                                    { label: 'Active Projects', value: '156', trend: '+8%', color: '#34d399' },
                                    { label: 'Annual Revenue', value: '$2.4M', trend: '+22%', color: '#a855f7' },
                                    { label: 'Success Rate', value: '94%', trend: '+2%', color: '#60a5fa' },
                                ].map((stat, i) => (
                                    <div key={i} className="glass" style={{ padding: '24px', background: '#fff' }}>
                                        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>{stat.label}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '12px' }}>
                                            <h2 style={{ fontSize: '36px', fontWeight: 800 }}>{stat.value}</h2>
                                            <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 700, padding: '4px 8px', background: '#f0fdf4', borderRadius: '8px' }}>{stat.trend}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Charts Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
                                <div className="glass" style={{ padding: '30px', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                        <h3 style={{ fontSize: '20px' }}>Enterprise Revenue Growth</h3>
                                        <button className="neumorphic" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', background: '#fff', border: '1px solid #f1f5f9' }}>Yearly View</button>
                                    </div>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={analyticsData.projectsHistory}>
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                                <Line type="monotone" dataKey="revenue" stroke="#ffcc00" strokeWidth={5} dot={{ r: 0 }} activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="glass" style={{ padding: '30px', background: '#fff' }}>
                                    <h3 style={{ fontSize: '20px', marginBottom: '30px' }}>Lead Analysis</h3>
                                    <div style={{ height: '240px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={analyticsData.meetings} innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value">
                                                    <Cell fill="#ffcc00" />
                                                    <Cell fill="#1a1a1a" />
                                                    <Cell fill="#e2e8f0" />
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                                        {analyticsData.meetings.map((m, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? '#ffcc00' : i === 1 ? '#1a1a1a' : '#e2e8f0' }} />
                                                <span style={{ fontSize: '13px', color: '#64748b' }}>{m.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'company' && (
                        <motion.div key="company" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h1 style={{ fontSize: '28px' }}>Client Directory</h1>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ background: '#fff', borderRadius: '14px', padding: '6px 12px', display: 'flex', gap: '8px' }}>
                                        {FILTER_PILLS.map(p => (
                                            <button
                                                key={p.value}
                                                onClick={() => setFilterTier(p.value)}
                                                style={{
                                                    border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                                                    background: filterTier === p.value ? '#1a1a1a' : 'transparent',
                                                    color: filterTier === p.value ? '#fff' : '#64748b'
                                                }}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                                {displayedCompanies.map(company => (
                                    <div key={company.id} className="glass" style={{ padding: '24px', background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '50px', height: '50px', background: TIER_CONFIG[company.tier].color + '15',
                                                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Building size={24} color={TIER_CONFIG[company.tier].color} />
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    background: TIER_CONFIG[company.tier].color + '15', color: TIER_CONFIG[company.tier].color,
                                                    padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase'
                                                }}>
                                                    {TIER_CONFIG[company.tier].label}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 style={{ marginTop: '16px', fontSize: '20px' }}>{company.name}</h3>
                                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>{company.email}</p>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 600 }}>Message</button>
                                            <button style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#1a1a1a', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 600 }}>Details</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ... other tabs would be similarly redesigned ... */}
                    {activeTab !== 'analytics' && activeTab !== 'company' && (
                        <div style={{ textAlign: 'center', padding: '100px', background: '#fff', borderRadius: '40px' }} className="glass">
                            <h2 style={{ color: '#94a3b8' }}>Content for {activeTab} refined soon</h2>
                        </div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};

export default Dashboard;
