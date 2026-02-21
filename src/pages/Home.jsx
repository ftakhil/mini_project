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
            {/* Background Effects */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.2, pointerEvents: 'none',
                background: `linear-gradient(rgba(251,146,60,0.05) 1px, transparent 1px), 
                             linear-gradient(90deg, rgba(251,146,60,0.05) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
            }} />

            {/* Background Glows */}
            <div style={{
                position: 'absolute', top: '20%', left: '15%',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(251,146,60,0.12), transparent 70%)',
                borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '15%', right: '10%',
                width: '350px', height: '350px',
                background: 'radial-gradient(circle, rgba(249,115,22,0.08), transparent 70%)',
                borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
            }} />

            {/* Floating Elements */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, -40, 0],
                        x: [0, Math.sin(i) * 30, 0],
                        opacity: [0.1, 0.3, 0.1],
                        rotate: [0, 45, 0]
                    }}
                    transition={{
                        duration: 6 + i,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.5
                    }}
                    style={{
                        position: 'absolute',
                        left: `${(i + 1) * 15}%`,
                        top: `${(i % 2 === 0 ? 20 : 70) + (i * 2)}%`,
                        width: '2px',
                        height: '40px',
                        background: 'linear-gradient(to bottom, transparent, #fb923c, transparent)',
                        filter: 'blur(1px)'
                    }}
                />
            ))}

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

                {/* Swapped Links Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    style={{ marginTop: '0px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}
                >
                    {/* Top Row: Simulation Button */}
                    <button
                        onClick={() => navigate('/form')}
                        style={{ background: 'rgba(251,146,60,0.05)', border: '1px dashed rgba(251,146,60,0.3)', color: '#fb923c', padding: '12px 28px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.15)'; e.currentTarget.style.borderColor = '#fb923c'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.05)'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.3)'; }}
                    >
                        <Zap size={18} /> Simulate External Data Entry
                    </button>

                    <div style={{ width: '120px', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />

                    {/* Bottom Row: Portal Logins */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/team-login')}
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', padding: '14px 28px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 700, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#a1a1aa'; }}
                        >
                            <Users size={18} /> Team Portal
                        </button>
                        <button
                            onClick={() => navigate('/admin-login')}
                            style={{ background: 'linear-gradient(135deg,#fb923c,#f97316)', border: 'none', color: '#fff', padding: '14px 28px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(251,146,60,0.3)' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                        >
                            <Shield size={18} /> Admin Login
                        </button>
                    </div>
                </motion.div>

                {/* Feature pills */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '48px', flexWrap: 'wrap' }}>
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
                    width: '70px', height: '70px', borderRadius: '50%', opacity: 0.1,
                }}
            />
        </div>
    );
};

export default Home;
