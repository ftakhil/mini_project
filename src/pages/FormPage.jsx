import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Mail, User, MessageSquare, Briefcase, Send, CheckCircle2,
    DollarSign, Phone, Globe, Users, Layers, BriefcaseBusiness
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SERVICES = [
    { value: 'web_development', label: 'Web Development' },
    { value: 'app_development', label: 'App Development' },
    { value: 'ui_ux_design', label: 'UI/UX Design' },
    { value: 'ai_automation', label: 'AI / Automation' },
    { value: 'saas_development', label: 'SaaS Product Development' },
    { value: 'ecommerce_setup', label: 'E-commerce Setup' },
    { value: 'other', label: 'Other (Specify)' },
];

const BUDGETS = [
    { value: 'under_10k', label: 'Less than ₹10,000' },
    { value: '10k_50k', label: '₹10,000 – ₹50,000' },
    { value: '50k_2l', label: '₹50,000 – ₹2,00,000' },
    { value: 'above_2l', label: '₹2,00,000+' },
];

const CLIENT_TYPES = ['Individual', 'Startup', 'Small Business', 'Agency', 'Enterprise'];
const INDUSTRIES = ['Technology', 'E-commerce', 'Healthcare', 'Finance', 'Education', 'Other'];
const COMPANY_SIZES = ['1–10 employees', '11–50', '51–200', '200+'];
const DECISION_OPTIONS = ['Yes', 'Part of the team', 'Just researching'];

/* ── Shared Styles ────────────────────────────────── */
const labelStyle = { fontSize: '12px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' };
const sectionTitle = (text, icon) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', marginTop: '8px' }}>
        <div style={{ width: '4px', height: '18px', borderRadius: '99px', background: '#3b82f6' }} />
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#e4e4e7', letterSpacing: '0.02em' }}>{text}</span>
    </div>
);

/* ── Form Field Helpers (defined outside component to prevent re-creation) ── */
const InputField = ({ icon: Icon, ...props }) => (
    <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />}
        <input className="input-field" style={{ paddingLeft: Icon ? '46px' : '16px', width: '100%', boxSizing: 'border-box' }} {...props} />
    </div>
);

const SelectField = ({ icon: Icon, options, placeholder, ...props }) => (
    <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />}
        <select className="input-field" style={{ paddingLeft: Icon ? '46px' : '16px', background: 'var(--bg-card)', width: '100%', boxSizing: 'border-box' }} {...props}>
            <option value="" disabled>{placeholder}</option>
            {options.map(o => typeof o === 'string'
                ? <option key={o} value={o}>{o}</option>
                : <option key={o.value} value={o.value}>{o.label}</option>
            )}
        </select>
    </div>
);

const RadioGroup = ({ options, value, onChange, name }) => (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {options.map(opt => (
            <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                borderRadius: '10px', cursor: 'pointer', fontSize: '14px',
                background: value === opt ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${value === opt ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: value === opt ? '#3b82f6' : '#a1a1aa', fontWeight: value === opt ? 600 : 400,
                transition: 'all 0.2s',
            }}>
                <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)}
                    style={{ display: 'none' }} />
                <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: `2px solid ${value === opt ? '#3b82f6' : '#52525b'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {value === opt && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />}
                </div>
                {opt}
            </label>
        ))}
    </div>
);

const sendLeadToWebhook = async (payload) => {
    const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
    if (!webhookUrl) throw new Error('VITE_WEBHOOK_URL is not configured');

    const headers = { 'Content-Type': 'application/json' };

    const user = import.meta.env.VITE_WEBHOOK_AUTH_USER;
    const pass = import.meta.env.VITE_WEBHOOK_AUTH_PASS;
    if (user && pass) {
        headers['Authorization'] = `Basic ${btoa(`${user}:${pass}`)}`;
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let detail = '';
        try { detail = await response.text(); } catch (_) {}
        console.error(`Webhook ${response.status}:`, detail);
        throw new Error(`Webhook failed with status ${response.status}${detail ? ` — ${detail}` : ''}`);
    }
};


const FormPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        website_link: '',
        client_type: '',
        service_required: '',
        service_other: '',
        estimated_budget: '',
        industry: '',
        company_size: '',
        company_website: '',
        decision_maker: '',
        message: '',
    });
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        setErrorMessage('');

        try {
            const { data: leadData, error: dbError } = await supabase
                .from('leads')
                .insert([{
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    company: formData.company,
                    website_link: formData.website_link || null,
                    client_type: formData.client_type,
                    service_required: formData.service_required,
                    service_other: formData.service_required === 'other' ? formData.service_other : null,
                    estimated_budget: formData.estimated_budget,
                    industry: formData.industry,
                    company_size: formData.company_size,
                    company_website: formData.company_website,
                    decision_maker: formData.decision_maker,
                    message: formData.message || null,
                    status: 'captured',
                }])
                .select();

            if (dbError) {
                console.error('Supabase insert error:', dbError);
                setStatus('error');
                return;
            }

            const savedLead = leadData?.[0];

            // POST all details to n8n webhook
            await sendLeadToWebhook({
                lead_id: savedLead?.id || null,
                submitted_at: new Date().toISOString(),
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                website_link: formData.website_link || null,
                client_type: formData.client_type,
                service_required: formData.service_required,
                service_other: formData.service_required === 'other' ? formData.service_other : null,
                estimated_budget: formData.estimated_budget,
                industry: formData.industry,
                company_size: formData.company_size,
                company_website: formData.company_website,
                decision_maker: formData.decision_maker,
                message: formData.message || null,
                status: 'captured',
            });

            console.log('Lead saved and webhook sent:', savedLead);
            setStatus('success');
        } catch (err) {
            console.error('Submit error:', err);
            const msg = String(err?.message || '');
            if (msg.toLowerCase().includes('failed to fetch')) {
                setErrorMessage('Webhook request failed. In local development, restart Vite so proxy config is applied. In production, allow CORS for your frontend origin in n8n.');
            } else if (msg.includes('status 403')) {
                setErrorMessage('Webhook returned 403 (forbidden). Check webhook authentication/security settings in n8n and ensure the exact URL is correct.');
            } else if (msg.includes('status 404')) {
                setErrorMessage('Webhook returned 404 (not found). If using /webhook-test/, click "Listen for test event" in n8n. For stable use, switch to /webhook/ and activate workflow.');
            } else {
                setErrorMessage(msg || 'Submission failed.');
            }
            setStatus('error');
        }
    };

    /* ── Success Screen ─────────────────────────────── */
    if (status === 'success') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: '60px', textAlign: 'center', maxWidth: '480px' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(52,211,153,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle2 size={40} color="#34d399" />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>Inquiry Received!</h2>
                    <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: '32px' }}>
                        Thank you! Your inquiry has been logged. Our team will review your requirements and reach out to you shortly.
                    </p>
                    <button onClick={() => navigate('/')} style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Back to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    /* ── Main Form ──────────────────────────────────── */
    return (
        <div style={{ minHeight: '100vh', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-deep)' }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="glass" style={{ maxWidth: '680px', width: '100%', padding: '48px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h2 style={{
                        margin: '0 0 12px', fontSize: '2.2rem', fontWeight: 800,
                        background: 'linear-gradient(135deg,#fff 30%,#3b82f6 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>Get Started With Us</h2>
                    <p style={{ color: '#71717a', fontSize: '15px' }}>Fill in your details and we'll get back to you with a tailored proposal.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                    {/* ── Section 1: Personal Info ─────────── */}
                    {sectionTitle('Personal Information')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={labelStyle}>Full Name *</label>
                            <InputField icon={User} required placeholder="John Doe" value={formData.name} onChange={set('name')} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={labelStyle}>Company Name *</label>
                            <InputField icon={Building2} required placeholder="Acme Corp" value={formData.company} onChange={set('company')} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={labelStyle}>Email Address *</label>
                            <InputField icon={Mail} required type="email" placeholder="john@company.com" value={formData.email} onChange={set('email')} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={labelStyle}>Phone / WhatsApp *</label>
                            <InputField icon={Phone} required placeholder="+91 98765 43210" value={formData.phone} onChange={set('phone')} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={labelStyle}>Website / Social Media Link (Optional)</label>
                        <InputField icon={Globe} placeholder="https://yourcompany.com" value={formData.website_link} onChange={set('website_link')} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={labelStyle}>What best describes you? *</label>
                        <RadioGroup options={CLIENT_TYPES} value={formData.client_type} onChange={(v) => setFormData(prev => ({ ...prev, client_type: v }))} name="client_type" />
                    </div>

                    {/* ── Section 2: Service Requirement ───── */}
                    {sectionTitle('Service Requirement')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={labelStyle}>Service Interested In *</label>
                            <SelectField icon={Briefcase} required options={SERVICES} placeholder="Select a service" value={formData.service_required} onChange={set('service_required')} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={labelStyle}>Estimated Budget *</label>
                            <SelectField icon={DollarSign} required options={BUDGETS} placeholder="Select budget range" value={formData.estimated_budget} onChange={set('estimated_budget')} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {formData.service_required === 'other' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                                <label style={labelStyle}>Please specify the service *</label>
                                <InputField icon={Briefcase} required placeholder="Describe the service..." value={formData.service_other} onChange={set('service_other')} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Section 3: Company Details ────────── */}
                    {sectionTitle('Company Details')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={labelStyle}>Industry *</label>
                            <SelectField icon={Layers} required options={INDUSTRIES} placeholder="Select industry" value={formData.industry} onChange={set('industry')} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={labelStyle}>Company Size *</label>
                            <SelectField icon={Users} required options={COMPANY_SIZES} placeholder="Select size" value={formData.company_size} onChange={set('company_size')} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={labelStyle}>Company Website / LinkedIn *</label>
                        <InputField icon={Globe} required placeholder="https://linkedin.com/company/..." value={formData.company_website} onChange={set('company_website')} />
                    </div>

                    {/* ── Section 4: Decision Authority ───── */}
                    {sectionTitle('Decision Authority')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={labelStyle}>Are you the decision-maker? *</label>
                        <RadioGroup options={DECISION_OPTIONS} value={formData.decision_maker} onChange={(v) => setFormData(prev => ({ ...prev, decision_maker: v }))} name="decision_maker" />
                    </div>

                    {/* ── Section 5: Message ─────────────── */}
                    {sectionTitle('Additional Information')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={labelStyle}>Project Description / Message (Optional)</label>
                        <div style={{ position: 'relative' }}>
                            <MessageSquare size={18} color="#71717a" style={{ position: 'absolute', left: '16px', top: '16px' }} />
                            <textarea className="input-field" placeholder="Tell us about your project needs..."
                                style={{ paddingLeft: '46px', paddingTop: '16px', minHeight: '100px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                                value={formData.message} onChange={set('message')} />
                        </div>
                    </div>

                    {/* Error */}
                    {status === 'error' && (
                        <div style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(248,113,113,0.3)' }}>
                            Error submitting form. {errorMessage || 'Please check your details and try again.'}
                        </div>
                    )}

                    {/* Submit */}
                    <motion.button disabled={status === 'sending'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        type="submit" className="btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        {status === 'sending' ? 'Submitting...' : <><Send size={18} /> Submit Inquiry</>}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default FormPage;
