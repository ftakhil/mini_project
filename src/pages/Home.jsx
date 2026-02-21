import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, Users, ArrowUpRight } from 'lucide-react';

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
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background Decorations */}
            <div style={{
                position: 'absolute', top: '-10%', right: '-10%',
                width: '600px', height: '600px',
                background: 'radial-gradient(circle, rgba(255,204,0,0.08), transparent 70%)',
                borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-15%', left: '-15%',
                width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(255,204,0,0.05), transparent 70%)',
                borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
            }} />

            {/* Main Container */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass"
                style={{
                    maxWidth: '1000px',
                    width: '100%',
                    padding: '80px 40px',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10,
                    borderRadius: '40px',
                    background: 'rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.03)',
                }}
            >
                {/* Logo Section */}
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    style={{ marginBottom: '32px' }}
                >
                    <div style={{
                        width: '80px', height: '80px', margin: '0 auto 20px',
                        background: '#1a1a1a', borderRadius: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}>
                        <Zap size={36} color="#ffcc00" fill="#ffcc00" />
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        color: '#1a1a1a',
                        marginBottom: '10px'
                    }}>
                        Kaizen Hub
                    </h1>
                </motion.div>

                <p style={{
                    fontSize: '1.25rem',
                    color: '#666',
                    maxWidth: '580px',
                    margin: '0 auto 40px',
                    lineHeight: 1.6,
                    fontWeight: 500,
                }}>
                    The modern operating system for enterprise teams. Streamline workflows, manage talent, and scale with intelligence.
                </p>

                {/* Main Actions */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '24px',
                    alignItems: 'center', marginBottom: '60px'
                }}>

                    {/* Primary Simulation Button */}
                    <button
                        onClick={() => navigate('/form')}
                        className="btn-primary"
                        style={{
                            padding: '18px 48px', fontSize: '18px',
                            display: 'flex', alignItems: 'center', gap: '12px'
                        }}
                    >
                        New Project Inquiry <ArrowUpRight size={20} />
                    </button>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/team-login')}
                            style={{
                                background: '#fff', border: '1px solid #e2e8f0',
                                color: '#1a1a1a', padding: '14px 32px', borderRadius: '14px',
                                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                            <Users size={18} /> Team Portal
                        </button>
                        <button
                            onClick={() => navigate('/admin-login')}
                            className="btn-dark"
                            style={{
                                padding: '14px 32px', borderRadius: '14px',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <Shield size={18} /> Admin Access
                        </button>
                    </div>
                </div>

                {/* Trust Badges */}
                <div style={{
                    display: 'flex', gap: '30px', justifyContent: 'center',
                    color: '#94a3b8', fontSize: '14px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.1em'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 Scalable</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🔐 Secure</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ Real-time</span>
                </div>
            </motion.div>

            {/* Bottom floating cards for "dashboard feel" */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="glass"
                style={{
                    position: 'absolute', bottom: '40px', right: '40px',
                    width: '280px', height: '140px', borderRadius: '30px',
                    padding: '24px', opacity: 0.6, pointerEvents: 'none'
                }}
            >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#ffcc00', borderRadius: '12px' }} />
                    <div style={{ height: '12px', width: '100px', background: '#e2e8f0', borderRadius: '6px' }} />
                </div>
                <div style={{ height: '8px', width: '180px', background: '#f1f5f9', borderRadius: '4px' }} />
            </motion.div>
        </div>
    );
};

export default Home;
