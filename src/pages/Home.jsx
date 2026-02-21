import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Users } from 'lucide-react';

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
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Background Glows */}
            <div style={{
                position: 'absolute', top: '20%', left: '15%',
                width: '320px', height: '320px',
                background: 'radial-gradient(circle, rgba(251,146,60,0.15), transparent 70%)',
                borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '15%', right: '10%',
                width: '280px', height: '280px',
                background: 'radial-gradient(circle, rgba(249,115,22,0.1), transparent 70%)',
                borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none',
            }} />

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}
            >
                {/* Logo + Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', marginBottom: '28px' }}>
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="glass"
                        style={{ padding: '14px', borderRadius: '18px', display: 'flex' }}
                    >
                        <Zap size={34} color="#fb923c" fill="rgba(251,146,60,0.3)" />
                    </motion.div>

                    <h1 style={{
                        margin: 0,
                        fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        background: 'linear-gradient(135deg, #fff 20%, #fb923c 60%, #f97316 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        KAIZEN HUB
                    </h1>
                </div>

                {/* Subtitle */}
                <p style={{
                    fontSize: '1.2rem',
                    color: '#a1a1aa',
                    margin: '0 auto 10px',
                    maxWidth: '520px',
                    lineHeight: 1.7,
                }}>
                    Pioneering the future of enterprise management through intelligent design and seamless workflow integration.
                </p>

                {/* Divider line */}
                <div style={{
                    width: '60px', height: '3px',
                    background: 'linear-gradient(90deg,#fb923c,#f97316)',
                    borderRadius: '99px', margin: '18px auto 36px',
                }} />

                {/* Login Links */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    style={{ marginTop: '40px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}
                >
                    <button
                        onClick={() => navigate('/team-login')}
                        style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', color: '#fb923c', padding: '14px 28px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(251,146,60,0.1)' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(251,146,60,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(251,146,60,0.1)'; }}
                    >
                        <Users size={18} /> Team Portal
                    </button>
                    <button
                        onClick={() => navigate('/admin-login')}
                        style={{ background: 'linear-gradient(135deg,#fb923c,#f97316)', border: 'none', color: '#fff', padding: '14px 28px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(251,146,60,0.3)' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <Shield size={18} /> Admin Login
                    </button>

                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />

                    <button
                        onClick={() => navigate('/form')}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', color: '#71717a', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                        <Zap size={14} /> Simulate External Data Entry
                    </button>
                </motion.div>

                {/* Feature pills */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '36px', flexWrap: 'wrap' }}>
                    {['Enterprise Ready', 'Tiered Clients', 'Admin Analytics'].map(tag => (
                        <span key={tag} style={{
                            padding: '6px 16px', borderRadius: '99px',
                            background: 'rgba(251,146,60,0.1)',
                            border: '1px solid rgba(251,146,60,0.2)',
                            color: '#fb923c', fontSize: '13px', fontWeight: 500,
                        }}>{tag}</span>
                    ))}
                </div>
            </motion.div>

            {/* Floating orb */}
            <motion.div
                animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="glass"
                style={{
                    position: 'absolute', top: '80px', right: '80px',
                    width: '70px', height: '70px', borderRadius: '50%', opacity: 0.3,
                }}
            />
        </div>
    );
};

export default Home;
