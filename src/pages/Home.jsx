import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Users, Activity, Briefcase } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'var(--bg-deep)',
            position: 'relative',
        }}>
            {/* Minimalist Background Pattern */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.05, pointerEvents: 'none',
                background: `linear-gradient(var(--accent-primary) 1px, transparent 1px), 
                             linear-gradient(90deg, var(--accent-primary) 1px, transparent 1px)`,
                backgroundSize: '100px 100px',
            }} />

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}
            >
                {/* Logo + Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', marginBottom: '24px' }}>
                    <motion.div
                        className="glass"
                        style={{ padding: '12px', borderRadius: '14px', display: 'flex', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                    >
                        <Shield size={32} color="var(--accent-primary)" />
                    </motion.div>

                    <h1 style={{
                        margin: 0,
                        fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: 'var(--text-bright)',
                    }}>
                        Rev-Ops
                    </h1>
                </div>

                {/* Subtitle */}
                <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--text-dim)',
                    margin: '0 auto 10px',
                    maxWidth: '600px',
                    lineHeight: 1.6,
                }}>
                    Next-generation revenue operations and enterprise management. 
                    Streamlined workflows for professional teams.
                </p>

                {/* Divider line */}
                <div style={{
                    width: '40px', height: '3px',
                    background: 'var(--accent-primary)',
                    borderRadius: '99px', margin: '24px auto 40px',
                }} />

                {/* Swapped Links Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    style={{ marginTop: '0px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}
                >
                    {/* Top Row: Simulation Button */}
                    <button
                        onClick={() => navigate('/form')}
                        style={{ 
                            background: 'transparent', 
                            border: '1px solid var(--text-dim)', 
                            color: 'var(--text-dim)', 
                            padding: '10px 24px', 
                            borderRadius: '12px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            transition: 'all 0.2s' 
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-bright)'; e.currentTarget.style.borderColor = 'var(--text-bright)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--text-dim)'; }}
                    >
                        <Activity size={18} /> External Data Entry Simulation
                    </button>

                    <div style={{ width: '100px', height: '1px', background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />

                    {/* Bottom Row: Portal Logins */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/team-login')}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                color: 'var(--text-bright)', 
                                padding: '14px 28px', 
                                borderRadius: '12px', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                fontSize: '15px', 
                                fontWeight: 600, 
                                transition: 'all 0.2s' 
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        >
                            <Users size={18} /> Team Portal
                        </button>
                        <button
                            onClick={() => navigate('/admin-login')}
                            style={{ 
                                background: 'var(--accent-primary)', 
                                border: 'none', 
                                color: '#fff', 
                                padding: '14px 32px', 
                                borderRadius: '12px', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                fontSize: '15px', 
                                fontWeight: 700, 
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                        >
                            <Briefcase size={18} /> Admin Console
                        </button>
                    </div>
                </motion.div>

                {/* Feature pills */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '60px', flexWrap: 'wrap' }}>
                    {['Enterprise-Grade', 'Real-time Analytics', 'Workflow Automation'].map(tag => (
                        <span key={tag} style={{
                            padding: '6px 16px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-dim)', fontSize: '13px', fontWeight: 500,
                        }}>{tag}</span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Home;
