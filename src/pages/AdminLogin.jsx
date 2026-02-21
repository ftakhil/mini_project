import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error: dbError } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (dbError || !data) {
            setError('Invalid master admin credentials.');
            setLoading(false);
            return;
        }

        localStorage.setItem('adminToken', 'true');
        navigate('/dashboard');
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden'
        }}>
            {/* Glows */}
            <div style={{ position: 'absolute', top: '10%', left: '25%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(251,146,60,0.1), transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '10%', right: '25%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(249,115,22,0.05), transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="glass"
                style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: '24px', position: 'relative', zIndex: 10 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg,#fb923c,#f97316)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Shield size={32} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>Admin Portal</h2>
                    <p style={{ color: '#a1a1aa', fontSize: '14px', marginTop: '6px' }}>Sign in to access the control panel</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {error && (
                        <div style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(248,113,113,0.3)' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} color="#71717a" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                autoFocus
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="input-field"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', fontSize: '15px' }}
                                placeholder="Admin ID"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#71717a" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-field"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', fontSize: '15px' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            width: '100%', padding: '14px', marginTop: '10px',
                            background: 'linear-gradient(135deg,#fb923c,#f97316)', border: 'none', borderRadius: '12px',
                            color: '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                        }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
