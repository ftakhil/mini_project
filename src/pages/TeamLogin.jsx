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
        navigate('/worker');
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f5f7 0%, #fff9db 100%)', padding: '24px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                    width: '100%', maxWidth: '440px', padding: '48px', borderRadius: '40px',
                    background: '#fff', boxShadow: '0 40px 100px rgba(0,0,0,0.05)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '70px', height: '70px', background: '#ffcc00',
                        borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', boxShadow: '0 20px 40px rgba(255,204,0,0.2)'
                    }}>
                        <Users size={32} color="#000" />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Team Portal</h2>
                    <p style={{ color: '#64748b', marginTop: '8px', fontSize: '15px' }}>Sign in to your project workspace</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {error && (
                        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '14px', borderRadius: '14px', fontSize: '13px', textAlign: 'center', fontWeight: 600 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginLeft: '4px' }}>Team Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                autoFocus required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                placeholder="Team ID"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginLeft: '4px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                required type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px', marginTop: '8px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {loading ? 'Entering...' : 'Team Access'} <ArrowRight size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Back to Home
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default TeamLogin;
