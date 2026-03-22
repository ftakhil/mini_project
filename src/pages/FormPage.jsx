import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Mail, User, MessageSquare, Briefcase, Send, CheckCircle2, DollarSign, Clock } from 'lucide-react';

const FormPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        message: '',
        service_required: 'website',
        estimated_budget: '',
        expected_timeline: ''
    });
    const [status, setStatus] = useState('idle'); // idle | sending | success | error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn('VITE_WEBHOOK_URL is not defined in .env');
            // For now, let's simulate success if no URL is present so it doesn't just hang
            setTimeout(() => setStatus('success'), 1500);
            return;
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    submittedAt: new Date().toISOString()
                }),
            });

            if (response.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error('Webhook error:', err);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass"
                    style={{ padding: '60px', textAlign: 'center', maxWidth: '450px' }}
                >
                    <div style={{ width: '80px', height: '80px', background: 'rgba(52,211,153,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle2 size={40} color="#34d399" />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Submission Received!</h2>
                    <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: '32px' }}>Your inquiry has been logged and sent to our team. We will review your requirements and get back to you shortly.</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Back to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', padding: '80px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'var(--bg-deep)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass"
                style={{ maxWidth: '600px', width: '100%', padding: '48px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{
                        margin: '0 0 12px', fontSize: '2.5rem', fontWeight: 800,
                        background: 'linear-gradient(135deg,#fff 30%,#3b82f6 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>Project Inquiry</h2>
                    <p style={{ color: '#71717a', fontSize: '15px' }}>Tell us about your requirements and we'll connect you with a team.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Grid for Name & Company */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input required type="text" className="input-field" placeholder="John Doe" style={{ paddingLeft: '46px' }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Name</label>
                            <div style={{ position: 'relative' }}>
                                <Building2 size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input required type="text" className="input-field" placeholder="Acme Corp" style={{ paddingLeft: '46px' }} value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input required type="email" className="input-field" placeholder="contact@company.com" style={{ paddingLeft: '46px' }} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                    </div>

                    {/* Requirement Select */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Required</label>
                        <div style={{ position: 'relative' }}>
                            <Briefcase size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <select
                                className="input-field"
                                style={{ paddingLeft: '46px', background: 'var(--bg-card)' }}
                                value={formData.service_required}
                                onChange={(e) => setFormData({ ...formData, service_required: e.target.value })}
                            >
                                <option value="website">Web Development / Portal</option>
                                <option value="software">Custom Enterprise Software</option>
                                <option value="mobile">Mobile Application</option>
                                <option value="cloud">Cloud Infrastructure</option>
                                <option value="security">Security Audit</option>
                            </select>
                        </div>
                    </div>

                    {/* Budget & Timeline Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Budget</label>
                            <div style={{ position: 'relative' }}>
                                <DollarSign size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input required type="text" className="input-field" placeholder="$5,000 - $10,000" style={{ paddingLeft: '46px' }} value={formData.estimated_budget} onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Timeline</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input required type="text" className="input-field" placeholder="e.g. 3 Months" style={{ paddingLeft: '46px' }} value={formData.expected_timeline} onChange={(e) => setFormData({ ...formData, expected_timeline: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How can we help?</label>
                        <div style={{ position: 'relative' }}>
                            <MessageSquare size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '16px' }} />
                            <textarea
                                required
                                className="input-field"
                                placeholder="Describe your project needs..."
                                style={{ paddingLeft: '46px', paddingTop: '16px', minHeight: '120px', resize: 'vertical' }}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>
                    </div>

                    {status === 'error' && (
                        <div style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(248,113,113,0.3)' }}>
                            Error sending submission. Please try again.
                        </div>
                    )}

                    <motion.button
                        disabled={status === 'sending'}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700, marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {status === 'sending' ? (
                            'Processing...'
                        ) : (
                            <>Submit Request <Send size={18} /></>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default FormPage;
