import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Lock, User, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TeamLogin = () => {
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
            .from('teams')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (dbError || !data) {
            setError('Invalid team credentials.');
            setLoading(false);
            return;
        }

        localStorage.setItem('teamToken', 'true');
        localStorage.setItem('teamId', data.id.toString());
        localStorage.setItem('teamName', data.name);
        navigate('/worker'); // Keeping existing route for now
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden'
        }}>
            {/* Glows */}
            <div style={{ position: 'absolute', top: '15%', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(251,146,60,0.1), transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(249,115,22,0.05), transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
                className="glass"
                style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: '24px', position: 'relative', zIndex: 10 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg,#fb923c,#f97316)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Users size={32} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>Team Portal</h2>
                    <p style={{ color: '#a1a1aa', fontSize: '14px', marginTop: '6px' }}>Sign in to manage your projects</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {error && (
                        <div style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(248,113,113,0.3)' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} color="#71717a" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                autoFocus
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="input-field"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', fontSize: '15px' }}
                                placeholder="Team ID"
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
                        {loading ? 'Authenticating...' : 'Team Sign In'} <ArrowRight size={18} />
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default TeamLogin;
