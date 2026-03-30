import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, Activity, FileText, Download, FileSpreadsheet, Send as SendIcon,
    CheckCircle2, XCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CHART_COLORS = ['#3b82f6', '#fbbf24', '#ef4444', '#a855f7', '#10b981', '#f97316', '#06b6d4', '#ec4899'];

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('analytics');

    // Leads state
    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [slackSending, setSlackSending] = useState(null); // lead id being sent

    useEffect(() => {
        if (!localStorage.getItem('adminToken')) {
            navigate('/admin-login');
            return;
        }
        fetchLeads();
    }, [navigate]);

    // Poll for webhook completion details in background
    useEffect(() => {
        const intervalId = setInterval(async () => {
            let pendingIds = [];
            setLeads(prev => {
                pendingIds = prev.filter(l => l.outreach?.status?.toLowerCase() === 'pending').map(l => l.id);
                return prev;
            });

            if (pendingIds.length > 0) {
                const { data, error } = await supabase
                    .from('lead_outreach')
                    .select('*')
                    .in('lead_id', pendingIds);

                if (!error && data) {
                    setLeads(prev => {
                        let changed = false;
                        const next = prev.map(lead => {
                            const newOut = data.find(d => d.lead_id === lead.id);
                            if (newOut && newOut.status?.toLowerCase() === 'complete') {
                                changed = true;
                                return { ...lead, status: 'slack_invited', outreach: newOut };
                            }
                            return lead;
                        });
                        return changed ? next : prev;
                    });
                }
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchLeads = async () => {
        setLoadingLeads(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*, lead_outreach(*)')
            .order('created_at', { ascending: false });
        if (!error && data) {
            const enriched = data.map(lead => {
                let latestOutreach = null;
                if (lead.lead_outreach && lead.lead_outreach.length > 0) {
                    lead.lead_outreach.sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at));
                    latestOutreach = lead.lead_outreach[0];
                }
                return { ...lead, outreach: latestOutreach };
            });
            setLeads(enriched);
        }
        setLoadingLeads(false);
    };

    /* ── Helper functions ──────────────────────────── */
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const getBudgetLabel = (v) => {
        const m = { under_10k: '< ₹10K', '10k_50k': '₹10K–50K', '50k_2l': '₹50K–2L', above_2l: '₹2L+' };
        return m[v] || v || '—';
    };

    const getServiceLabel = (v) => {
        const m = {
            web_development: 'Web Dev', app_development: 'App Dev', ui_ux_design: 'UI/UX',
            ai_automation: 'AI/Automation', saas_development: 'SaaS', ecommerce_setup: 'E-commerce', other: 'Other'
        };
        return m[v] || v || '—';
    };

    /* ── Analytics Data Computation ────────────────── */
    const computeAnalytics = () => {
        if (leads.length === 0) return null;

        // Industry distribution
        const industryMap = {};
        leads.forEach(l => { const k = l.industry || 'Unknown'; industryMap[k] = (industryMap[k] || 0) + 1; });
        const industryData = Object.entries(industryMap).map(([name, value]) => ({ name, value }));

        // Budget distribution
        const budgetMap = {};
        leads.forEach(l => { const k = getBudgetLabel(l.estimated_budget); budgetMap[k] = (budgetMap[k] || 0) + 1; });
        const budgetData = Object.entries(budgetMap).map(([name, value]) => ({ name, value }));

        // Service demand
        const serviceMap = {};
        leads.forEach(l => { const k = getServiceLabel(l.service_required); serviceMap[k] = (serviceMap[k] || 0) + 1; });
        const serviceData = Object.entries(serviceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

        // Client type
        const clientTypeMap = {};
        leads.forEach(l => { const k = l.client_type || 'Unknown'; clientTypeMap[k] = (clientTypeMap[k] || 0) + 1; });
        const clientTypeData = Object.entries(clientTypeMap).map(([name, value]) => ({ name, value }));

        // Company size
        const sizeMap = {};
        leads.forEach(l => { const k = l.company_size || 'Unknown'; sizeMap[k] = (sizeMap[k] || 0) + 1; });
        const sizeData = Object.entries(sizeMap).map(([name, value]) => ({ name, value }));

        // Status
        const statusMap = {};
        leads.forEach(l => { const k = (l.status || 'unknown').toUpperCase(); statusMap[k] = (statusMap[k] || 0) + 1; });
        const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        return { industryData, budgetData, serviceData, clientTypeData, sizeData, statusData };
    };

    const analytics = computeAnalytics();

    /* ── Slack Invite Trigger ──────────────────────── */
    const handleSlackInvite = async (lead) => {
        const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
        if (!webhookUrl) {
            alert('VITE_WEBHOOK_URL is not set in .env');
            return;
        }
        setSlackSending(lead.id);

        // 1. Create a pending outreach record
        const { data: outreachData, error: dbError } = await supabase
            .from('lead_outreach')
            .insert([{ lead_id: lead.id, outreach_type: 'slack', status: 'pending' }])
            .select()
            .single();

        if (dbError) {
            console.error('Failed to create outreach record:', dbError);
            alert('Database error: Unable to track outreach.');
            setSlackSending(null);
            return;
        }

        try {
            // 2. Trigger webhook using exact logic from FormPage (Auth + robust error handling)
            const headers = { 'Content-Type': 'application/json' };
            const user = import.meta.env.VITE_WEBHOOK_AUTH_USER;
            const pass = import.meta.env.VITE_WEBHOOK_AUTH_PASS;
            if (user && pass) {
                headers['Authorization'] = `Basic ${btoa(`${user}:${pass}`)}`;
            }

            const payload = {
                lead_id: lead.id,
                lead_outreach_id: outreachData.id,
                submitted_at: lead.created_at,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                company: lead.company,
                client_type: lead.client_type,
                service_required: lead.service_required,
                service_other: lead.service_other,
                estimated_budget: lead.estimated_budget,
                industry: lead.industry,
                company_size: lead.company_size,
                company_website: lead.company_website,
                message: lead.message,
                status: lead.status,
                metadata: 'slack_invite',
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let detail = '';
                try { detail = await response.text(); } catch (_) {}
                throw new Error(`Webhook failed with status ${response.status}${detail ? ` — ${detail}` : ''}`);
            }

            // 3. Update local state to pending (polling will catch 'Complete' status from n8n)
            // We set status to 'slack_invited' immediately to prevent double-clicking, 
            // but the outreach remains 'pending' until n8n updates it.
            await supabase.from('leads').update({ status: 'slack_invited' }).eq('id', lead.id);

            setLeads(prev => prev.map(l => l.id === lead.id ? { 
                ...l, 
                status: 'slack_invited',
                outreach: outreachData
            } : l));

        } catch (err) {
            console.error('Slack webhook error:', err);

            // Mark outreach as failed
            await supabase.from('lead_outreach').update({ status: 'failed', error_message: err.message }).eq('id', outreachData.id);

            const msg = String(err?.message || '');
            if (msg.toLowerCase().includes('failed to fetch')) {
                alert('Webhook request failed (CORS or server offline). If using webhook-test, make sure you clicked "Listen for test event" in n8n.');
            } else {
                alert(`Slack invite failed: ${msg}`);
            }
        }
        setSlackSending(null);
    };

    /* ── Status Update (Client / Lost) ────────────── */
    const handleStatusUpdate = async (lead, newStatus) => {
        try {
            await supabase.from('leads').update({ status: newStatus }).eq('id', lead.id);
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
        } catch (err) {
            console.error('Status update error:', err);
            alert('Failed to update lead status.');
        }
    };

    /* ── Report Generation Functions ───────────────── */

    // Individual PDF
    const generateIndividualPDF = async (lead) => {
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 14;
        const contentW = pageW - margin * 2;

        /* ── Helper: add a sub-page header bar ─────── */
        const addPageHeader = (title) => {
            doc.setFillColor(20, 24, 36);
            doc.rect(0, 0, pageW, 14, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255);
            doc.text(`Rev-Ops  •  ${title}`, margin, 10);
            doc.setFontSize(7);
            doc.setTextColor(180);
            doc.text(lead.company || 'Lead Report', pageW - margin, 10, { align: 'right' });
        };

        /* ── Helper: check if y overflows and add page ─ */
        const checkPageBreak = (currentY, needed = 30, headerTitle = 'Lead Intelligence Report') => {
            if (currentY + needed > pageH - 20) {
                doc.addPage();
                addPageHeader(headerTitle);
                return 24;
            }
            return currentY;
        };

        /* ── Helper: flatten nested enriched data ──── */
        const flattenObject = (obj, prefix = '') => {
            const rows = [];
            for (const [key, value] of Object.entries(obj)) {
                const label = prefix
                    ? `${prefix} › ${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
                    : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                if (value === null || value === undefined || value === '') {
                    rows.push([label, '—']);
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        rows.push([label, '(empty)']);
                    } else if (typeof value[0] === 'object' && value[0] !== null) {
                        // Array of objects — flatten each item
                        value.forEach((item, idx) => {
                            const subRows = flattenObject(item, `${label} [${idx + 1}]`);
                            rows.push(...subRows);
                        });
                    } else {
                        rows.push([label, value.join(', ')]);
                    }
                } else if (typeof value === 'object') {
                    const subRows = flattenObject(value, label);
                    rows.push(...subRows);
                } else {
                    rows.push([label, String(value)]);
                }
            }
            return rows;
        };

        /* ══════════════════════════════════════════════
           PAGE 1: Cover + Lead Details
           ══════════════════════════════════════════════ */

        // Header bar
        doc.setFillColor(20, 24, 36);
        doc.rect(0, 0, pageW, 48, 'F');
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 48, pageW, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Rev-Ops', margin, 22);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Comprehensive Lead Intelligence Report', margin, 34);
        doc.setFontSize(9);
        doc.setTextColor(180);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW - margin, 34, { align: 'right' });

        // Lead Score badge (top right)
        if (lead.lead_score != null) {
            const scoreColor = lead.lead_score >= 70 ? [16, 185, 129] : lead.lead_score >= 40 ? [251, 191, 36] : [239, 68, 68];
            doc.setFillColor(...scoreColor);
            doc.roundedRect(pageW - margin - 32, 6, 32, 16, 4, 4, 'F');
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255);
            doc.text(`${lead.lead_score}`, pageW - margin - 16, 17, { align: 'center' });
        }

        let y = 62;

        // Company title
        doc.setTextColor(30, 30, 40);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(lead.company || 'Unknown Company', margin, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Contact: ${lead.name || '—'}  •  ${lead.email || '—'}  •  ${lead.phone || '—'}`, margin, y);
        y += 14;

        // ── Primary Details Table ──
        autoTable(doc, {
            startY: y,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, textColor: [30, 30, 50] } },
            head: [['Field', 'Details']],
            body: [
                ['Client Type', lead.client_type || '—'],
                ['Service Required', getServiceLabel(lead.service_required)],
                ['Other Service', lead.service_other || 'N/A'],
                ['Estimated Budget', getBudgetLabel(lead.estimated_budget)],
                ['Industry', lead.industry || '—'],
                ['Company Size', lead.company_size || '—'],
                ['Company Website', lead.company_website || '—'],
                ['Lead Score', lead.lead_score != null ? `${lead.lead_score} / 100` : '—'],
                ['Status', (lead.status || '—').toUpperCase()],
                ['Submitted At', fmtDate(lead.created_at)],
                ['Last Updated', fmtDate(lead.updated_at)],
            ],
        });

        y = doc.lastAutoTable.finalY + 14;

        // ── Score Logic ──
        if (lead.score_logic) {
            y = checkPageBreak(y, 40, 'Score Logic');
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(168, 85, 247);
            doc.text('Score Logic', margin, y);
            doc.setFillColor(168, 85, 247);
            doc.rect(margin, y + 2, 30, 2, 'F');
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            const scoreLines = doc.splitTextToSize(lead.score_logic, contentW);
            scoreLines.forEach(line => {
                y = checkPageBreak(y, 6, 'Score Logic');
                doc.text(line, margin, y);
                y += 5;
            });
            y += 8;
        }

        // ── AI Reasoning ──
        if (lead.ai_reasoning) {
            y = checkPageBreak(y, 40, 'AI Analysis');
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(59, 130, 246);
            doc.text('AI Reasoning & Analysis', margin, y);
            doc.setFillColor(59, 130, 246);
            doc.rect(margin, y + 2, 50, 2, 'F');
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            const aiLines = doc.splitTextToSize(lead.ai_reasoning, contentW);
            aiLines.forEach(line => {
                y = checkPageBreak(y, 6, 'AI Analysis');
                doc.text(line, margin, y);
                y += 5;
            });
            y += 8;
        }

        // ── Client Message ──
        if (lead.message) {
            y = checkPageBreak(y, 40, 'Client Message');
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text('Client Message', margin, y);
            doc.setFillColor(16, 185, 129);
            doc.rect(margin, y + 2, 35, 2, 'F');
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            const msgLines = doc.splitTextToSize(lead.message, contentW);
            msgLines.forEach(line => {
                y = checkPageBreak(y, 6, 'Client Message');
                doc.text(line, margin, y);
                y += 5;
            });
            y += 8;
        }

        /* ══════════════════════════════════════════════
           ENRICHED DATA — Full Breakdown
           ══════════════════════════════════════════════ */
        let parsedEnrichedData = lead.enriched_data;
        if (typeof parsedEnrichedData === 'string') {
            if (parsedEnrichedData.startsWith('http')) {
                try {
                    const res = await fetch(parsedEnrichedData);
                    parsedEnrichedData = await res.json();
                } catch (e) { console.error('Failed to fetch JSON URL for PDF', e); }
            } else {
                try { parsedEnrichedData = JSON.parse(parsedEnrichedData); } catch (e) { /* ignore */ }
            }
        }

        if (parsedEnrichedData && typeof parsedEnrichedData === 'object' && Object.keys(parsedEnrichedData).length > 0) {
            doc.addPage();
            addPageHeader('Enriched Data — Full Breakdown');

            y = 24;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 40);
            doc.text('Enriched Data — Complete Details', margin, y);
            y += 4;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120);
            doc.text('Data sourced from Apollo, web scraping, and AI enrichment pipeline', margin, y);
            y += 10;

            // Flatten the entire enriched_data object
            const allRows = flattenObject(parsedEnrichedData);

            // Split into categorized sections if possible
            // Group by top-level key prefix
            const topLevelKeys = Object.keys(parsedEnrichedData);
            
            if (topLevelKeys.length <= 8 && allRows.length <= 20) {
                // Small enriched data — single table
                autoTable(doc, {
                    startY: y,
                    theme: 'striped',
                    headStyles: { fillColor: [20, 24, 36], textColor: 255, fontStyle: 'bold', fontSize: 10 },
                    bodyStyles: { fontSize: 9, cellPadding: 4 },
                    columnStyles: {
                        0: { fontStyle: 'bold', cellWidth: 65, textColor: [59, 130, 246] },
                        1: { cellWidth: contentW - 65 }
                    },
                    head: [['Property', 'Value']],
                    body: allRows,
                    styles: { overflow: 'linebreak', cellWidth: 'wrap' },
                    didDrawPage: () => { addPageHeader('Enriched Data — Full Breakdown'); },
                });
                y = doc.lastAutoTable.finalY + 10;
            } else {
                // Large enriched data — break into sections by top-level key
                for (const topKey of topLevelKeys) {
                    const val = parsedEnrichedData[topKey];
                    const sectionTitle = topKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                    y = checkPageBreak(y, 30, 'Enriched Data');

                    // Section header
                    doc.setFillColor(59, 130, 246);
                    doc.roundedRect(margin, y - 4, contentW, 14, 2, 2, 'F');
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(255);
                    doc.text(sectionTitle, margin + 6, y + 4);
                    y += 16;

                    if (val === null || val === undefined || val === '') {
                        doc.setFontSize(9);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(120);
                        doc.text('No data available', margin + 4, y);
                        y += 10;
                    } else if (typeof val === 'object' && !Array.isArray(val)) {
                        // Object — render as table
                        const subRows = flattenObject(val);
                        autoTable(doc, {
                            startY: y,
                            theme: 'striped',
                            headStyles: { fillColor: [40, 44, 56], textColor: 255, fontSize: 9 },
                            bodyStyles: { fontSize: 9, cellPadding: 3 },
                            columnStyles: {
                                0: { fontStyle: 'bold', cellWidth: 60 },
                                1: { cellWidth: contentW - 60 }
                            },
                            head: [['Field', 'Value']],
                            body: subRows.length > 0 ? subRows : [['—', 'No data']],
                            styles: { overflow: 'linebreak', cellWidth: 'wrap' },
                            margin: { left: margin },
                            didDrawPage: () => { addPageHeader('Enriched Data — Full Breakdown'); },
                        });
                        y = doc.lastAutoTable.finalY + 8;
                    } else if (Array.isArray(val)) {
                        if (val.length === 0) {
                            doc.setFontSize(9);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(120);
                            doc.text('(empty list)', margin + 4, y);
                            y += 10;
                        } else if (typeof val[0] === 'object' && val[0] !== null) {
                            // Array of objects — render each as mini-table
                            val.forEach((item, idx) => {
                                y = checkPageBreak(y, 20, 'Enriched Data');
                                doc.setFontSize(9);
                                doc.setFont('helvetica', 'bold');
                                doc.setTextColor(80);
                                doc.text(`${sectionTitle} #${idx + 1}`, margin + 4, y);
                                y += 4;
                                const itemRows = flattenObject(item);
                                autoTable(doc, {
                                    startY: y,
                                    theme: 'plain',
                                    bodyStyles: { fontSize: 8, cellPadding: 2 },
                                    columnStyles: {
                                        0: { fontStyle: 'bold', cellWidth: 55, textColor: [80, 80, 100] },
                                        1: { cellWidth: contentW - 55 }
                                    },
                                    body: itemRows.length > 0 ? itemRows : [['—', 'No data']],
                                    styles: { overflow: 'linebreak', cellWidth: 'wrap' },
                                    margin: { left: margin },
                                    didDrawPage: () => { addPageHeader('Enriched Data — Full Breakdown'); },
                                });
                                y = doc.lastAutoTable.finalY + 6;
                            });
                        } else {
                            // Simple array — single row
                            doc.setFontSize(9);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(50);
                            const arrText = doc.splitTextToSize(val.join(', '), contentW - 8);
                            arrText.forEach(line => {
                                y = checkPageBreak(y, 5, 'Enriched Data');
                                doc.text(line, margin + 4, y);
                                y += 5;
                            });
                            y += 6;
                        }
                    } else {
                        // Simple value
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(50);
                        const valText = doc.splitTextToSize(String(val), contentW - 8);
                        valText.forEach(line => {
                            y = checkPageBreak(y, 5, 'Enriched Data');
                            doc.text(line, margin + 4, y);
                            y += 5;
                        });
                        y += 6;
                    }
                }
            }
        }

        /* ── Footer on all pages ─────────────────────── */
        const pc = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pc; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Rev-Ops  •  Confidential Lead Report', margin, pageH - 8);
            doc.text(`Page ${i} of ${pc}`, pageW - margin, pageH - 8, { align: 'right' });
        }

        doc.save(`RevOps_Lead_${(lead.company || 'Unknown').replace(/\s+/g, '_')}.pdf`);
    };

    // Individual Excel
    const generateIndividualExcel = async (lead) => {
        const wb = XLSX.utils.book_new();
        const rows = [
            ['Field', 'Value'],
            ['Company', lead.company || '—'], ['Name', lead.name || '—'], ['Email', lead.email || '—'],
            ['Phone', lead.phone || '—'], ['Client Type', lead.client_type || '—'],
            ['Service', getServiceLabel(lead.service_required)], ['Other Service', lead.service_other || 'N/A'],
            ['Budget', getBudgetLabel(lead.estimated_budget)], ['Industry', lead.industry || '—'],
            ['Company Size', lead.company_size || '—'], ['Company Website', lead.company_website || '—'],
            ['Lead Score', lead.lead_score ?? '—'],
            ['AI Reasoning', lead.ai_reasoning || '—'], ['Status', (lead.status || '—').toUpperCase()],
            ['Submitted', fmtDate(lead.created_at)], ['Message', lead.message || '—'],
        ];
        let exParsedEnrichedData = lead.enriched_data;
        if (typeof exParsedEnrichedData === 'string') {
            if (exParsedEnrichedData.startsWith('http')) {
                try {
                    const res = await fetch(exParsedEnrichedData);
                    exParsedEnrichedData = await res.json();
                } catch (e) { console.error('Failed to fetch JSON URL for Excel', e); }
            } else {
                try { exParsedEnrichedData = JSON.parse(exParsedEnrichedData); } catch (e) { /* ignore */ }
            }
        }
        if (exParsedEnrichedData && typeof exParsedEnrichedData === 'object') {
            rows.push(['', ''], ['--- ENRICHED DATA ---', '']);
            Object.entries(exParsedEnrichedData).forEach(([k, v]) => {
                rows.push([k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), typeof v === 'object' ? JSON.stringify(v) : String(v)]);
            });
        }
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 25 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, ws, (lead.company || 'Lead').slice(0, 31));
        XLSX.writeFile(wb, `RevOps_Lead_${(lead.company || 'Unknown').replace(/\s+/g, '_')}.xlsx`);
    };

    // Master Excel — all leads in rows
    const generateAllLeadsExcel = () => {
        const wb = XLSX.utils.book_new();

        // Overview sheet
        const stats = [
            ['Rev-Ops — Master Leads Report'], [`Generated: ${new Date().toLocaleString('en-IN')}`], [''],
            ['Total Leads', leads.length],
        ];
        if (analytics) {
            stats.push([''], ['INDUSTRY BREAKDOWN']);
            analytics.industryData.forEach(d => stats.push([d.name, d.value]));
            stats.push([''], ['BUDGET BREAKDOWN']);
            analytics.budgetData.forEach(d => stats.push([d.name, d.value]));
            stats.push([''], ['SERVICE DEMAND']);
            analytics.serviceData.forEach(d => stats.push([d.name, d.value]));
        }
        const wsO = XLSX.utils.aoa_to_sheet(stats);
        wsO['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsO, 'Overview');

        // All Leads sheet
        const enrichedKeysSet = new Set();
        leads.forEach(l => { if (l.enriched_data && typeof l.enriched_data === 'object') Object.keys(l.enriched_data).forEach(k => enrichedKeysSet.add(k)); });
        const eKeys = [...enrichedKeysSet];
        const baseH = ['S.No', 'Company', 'Name', 'Email', 'Phone', 'Client Type', 'Service', 'Budget', 'Industry', 'Company Size', 'Company Website', 'Lead Score', 'Status', 'AI Reasoning', 'Message', 'Submitted'];
        const eH = eKeys.map(k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        const allH = [...baseH, ...eH];
        const rows = leads.map((l, i) => {
            const base = [i + 1, l.company || '—', l.name || '—', l.email || '—', l.phone || '—', l.client_type || '—',
                getServiceLabel(l.service_required), getBudgetLabel(l.estimated_budget), l.industry || '—', l.company_size || '—',
                l.company_website || '—', l.lead_score ?? '—',
                (l.status || '—').toUpperCase(), l.ai_reasoning || '—', l.message || '—', fmtDate(l.created_at)];
            const eRow = eKeys.map(k => l.enriched_data?.[k] != null ? (typeof l.enriched_data[k] === 'object' ? JSON.stringify(l.enriched_data[k]) : String(l.enriched_data[k])) : '—');
            return [...base, ...eRow];
        });
        const wsA = XLSX.utils.aoa_to_sheet([allH, ...rows]);
        wsA['!cols'] = allH.map(h => ({ wch: Math.max((h?.length || 0) + 4, 16) }));
        XLSX.utils.book_append_sheet(wb, wsA, 'All Leads');

        XLSX.writeFile(wb, `RevOps_AllLeads_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Master Analytics PDF — with visual charts + grids
    const generateMasterPDF = () => {
        if (!analytics) return;
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 14;
        const contentW = pageW - margin * 2;

        const COLORS = [
            [59, 130, 246], [251, 191, 36], [239, 68, 68], [168, 85, 247],
            [16, 185, 129], [249, 115, 22], [6, 182, 212], [236, 72, 153],
        ];

        /* ── Helper: Draw Donut Chart ──────────────────── */
        const drawDonut = (cx, cy, outerR, innerR, data, title, customColors) => {
            const total = data.reduce((s, d) => s + d.value, 0);
            if (total === 0) return cy + outerR + 10;
            let startAngle = -Math.PI / 2;

            // Title
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 50);
            doc.text(title, cx, cy - outerR - 6, { align: 'center' });

            data.forEach((d, i) => {
                const sliceAngle = (d.value / total) * Math.PI * 2;
                const endAngle = startAngle + sliceAngle;
                const [r, g, b] = (customColors && customColors[i]) || COLORS[i % COLORS.length];
                doc.setFillColor(r, g, b);

                // Draw arc as many small triangles
                const steps = Math.max(Math.ceil(sliceAngle / 0.05), 3);
                for (let s = 0; s < steps; s++) {
                    const a1 = startAngle + (sliceAngle * s / steps);
                    const a2 = startAngle + (sliceAngle * (s + 1) / steps);
                    const points = [
                        [cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR],
                        [cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR],
                        [cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR],
                        [cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR],
                    ];
                    doc.triangle(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1], 'F');
                    doc.triangle(points[0][0], points[0][1], points[2][0], points[2][1], points[3][0], points[3][1], 'F');
                }
                startAngle = endAngle;
            });

            // Center hole (white)
            doc.setFillColor(255, 255, 255);
            const holeSteps = 36;
            for (let s = 0; s < holeSteps; s++) {
                const a1 = (Math.PI * 2 * s) / holeSteps;
                const a2 = (Math.PI * 2 * (s + 1)) / holeSteps;
                doc.triangle(cx, cy, cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR, cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR, 'F');
            }

            // Center text
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 50);
            doc.text(String(total), cx, cy + 2, { align: 'center' });
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120);
            doc.text('Total', cx, cy + 7, { align: 'center' });

            // Legend
            let ly = cy + outerR + 8;
            data.forEach((d, i) => {
                const [r, g, b] = (customColors && customColors[i]) || COLORS[i % COLORS.length];
                doc.setFillColor(r, g, b);
                doc.roundedRect(cx - 35, ly - 3, 6, 6, 1, 1, 'F');
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60);
                const pct = total > 0 ? `${(d.value / total * 100).toFixed(0)}%` : '0%';
                doc.text(`${d.name} (${d.value}) ${pct}`, cx - 26, ly + 1);
                ly += 8;
            });

            return ly + 4;
        };

        /* ── Helper: Draw Horizontal Bar Chart ─────────── */
        const drawHBar = (x, y, w, data, title, barColor) => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 50);
            doc.text(title, x, y);
            y += 8;

            const maxVal = Math.max(...data.map(d => d.value), 1);
            const barH = 10;
            const gap = 4;
            const labelW = 45;

            data.forEach((d, i) => {
                const [r, g, b] = barColor || COLORS[i % COLORS.length];
                // Label
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60);
                doc.text(d.name, x, y + barH / 2 + 1);

                // Bar background
                doc.setFillColor(240, 240, 245);
                doc.roundedRect(x + labelW, y, w - labelW, barH, 2, 2, 'F');

                // Bar fill
                const barW = Math.max((d.value / maxVal) * (w - labelW), 4);
                doc.setFillColor(r, g, b);
                doc.roundedRect(x + labelW, y, barW, barH, 2, 2, 'F');

                // Value
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(r, g, b);
                doc.text(`${d.value}`, x + labelW + barW + 3, y + barH / 2 + 1);

                y += barH + gap;
            });
            return y + 4;
        };

        /* ── Helper: Stat Card Grid ────────────────────── */
        /* ── Helper: Stat Card Grid ────────────────────── */
        const drawStatGrid = (x, y, cards) => {
            const cardW = (contentW - 12) / 4;
            const cardH = 26;
            const gap = 4;
            cards.forEach((card, i) => {
                const row = Math.floor(i / 4);
                const col = i % 4;
                const cx = x + col * (cardW + gap);
                const cy = y + row * (cardH + gap);
                
                // Card bg
                doc.setFillColor(245, 247, 250);
                doc.roundedRect(cx, cy, cardW, cardH, 3, 3, 'F');
                // Accent line
                const [r, g, b] = card.color;
                doc.setFillColor(r, g, b);
                doc.roundedRect(cx, cy, 3, cardH, 1.5, 1.5, 'F');
                // Value
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(r, g, b);
                doc.text(String(card.value), cx + cardW / 2 + 2, cy + 11, { align: 'center' });
                // Label
                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100);
                doc.text(card.label, cx + cardW / 2 + 2, cy + 19, { align: 'center' });
            });
            const rows = Math.ceil(cards.length / 4);
            return y + rows * (cardH + gap) + 6;
        };

        /* ══════════════════════════════════════════════════
           PAGE 1: Cover + Executive Summary + Stat Cards
           ══════════════════════════════════════════════════ */

        // Header bar
        doc.setFillColor(20, 24, 36);
        doc.rect(0, 0, pageW, 48, 'F');
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 48, pageW, 3, 'F');
        doc.setTextColor(255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Rev-Ops', margin, 22);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Master Analytics Report', margin, 34);
        doc.setFontSize(9);
        doc.setTextColor(180);
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW - margin, 34, { align: 'right' });
        doc.text(`${leads.length} Leads Analyzed`, pageW - margin, 22, { align: 'right' });

        let y = 62;

        // Stat cards
        const avgScore = leads.filter(l => l.lead_score != null).length > 0
            ? (leads.reduce((s, l) => s + (l.lead_score || 0), 0) / leads.filter(l => l.lead_score != null).length).toFixed(0) : '—';
        const converted = leads.filter(l => l.status === 'client').length;
        const lostCount = leads.filter(l => l.status === 'lost').length;
        const decided = converted + lostCount;
        const convRate = decided > 0 ? `${Math.round(converted / decided * 100)}%` : '0%';
        const highBudget = leads.filter(l => l.estimated_budget === 'above_2l' || l.estimated_budget === '50k_2l').length;
        const enterprise = leads.filter(l => l.client_type === 'Enterprise').length;
        const slackInvited = leads.filter(l => l.status === 'slack_invited').length;

        y = drawStatGrid(margin, y, [
            { label: 'TOTAL LEADS', value: leads.length, color: [59, 130, 246] },
            { label: 'CLIENTS (CONV)', value: converted, color: [16, 185, 129] },
            { label: 'LOST LEADS', value: lostCount, color: [239, 68, 68] },
            { label: 'CONV. RATE %', value: convRate, color: [251, 191, 36] },
            { label: 'SLACK INVITED', value: slackInvited, color: [168, 85, 247] },
            { label: 'ENTERPRISE', value: enterprise, color: [6, 182, 212] },
            { label: 'HIGH BUDGET', value: highBudget, color: [249, 115, 22] },
            { label: 'AVG SCORE', value: avgScore, color: [100, 100, 100] },
        ]);

        // Industry and Budget Charts ──
        y += 4;
        const donutY = y + 28;
        const leftCx = margin + contentW * 0.25;
        const rightCx = margin + contentW * 0.75;
        const bottomLeft = drawDonut(leftCx, donutY, 22, 12, analytics.industryData, 'Industry Distribution');
        const bottomRight = drawDonut(rightCx, donutY, 22, 12, analytics.budgetData, 'Budget Distribution');
        y = Math.max(bottomLeft, bottomRight);

        /* ══════════════════════════════════════════════════
           PAGE 2: Service Demand + Client Type + Company Size
           ══════════════════════════════════════════════════ */
        doc.addPage();

        // Page header
        doc.setFillColor(20, 24, 36);
        doc.rect(0, 0, pageW, 14, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255);
        doc.text('Rev-Ops  •  Analytics Deep Dive', margin, 10);

        y = 24;

        // Service demand bar chart
        y = drawHBar(margin, y, contentW, analytics.serviceData, 'Service Demand Analysis', [59, 130, 246]);
        y += 4;

        // Two donuts side by side: Client Type + Status
        const donut2Y = y + 28;
        const bl2 = drawDonut(leftCx, donut2Y, 22, 12, analytics.clientTypeData, 'Client Type');
        const br2 = drawDonut(rightCx, donut2Y, 22, 12, analytics.statusData, 'Lead Status');
        y = Math.max(bl2, br2) + 4;

        y = drawHBar(margin, y, contentW, analytics.sizeData, 'Company Size Distribution', [16, 185, 129]);
        y += 4;

        // Conversion Pipeline Donut
        const conversionPipeData = [
            { name: 'Converted', value: leads.filter(l => l.status === 'client').length },
            { name: 'Lost', value: leads.filter(l => l.status === 'lost').length },
            { name: 'In Progress', value: leads.filter(l => l.status !== 'client' && l.status !== 'lost').length },
        ].filter(d => d.value > 0);
        
        const pipeY = y + 28;
        if (pipeY > 270) { doc.addPage(); y = 24; }
        
        y = drawDonut(margin + contentW*0.5, y + 28, 26, 14, conversionPipeData, 'Conversion Pipeline', [COLORS[4], COLORS[2], COLORS[1]]);
        y += 10;

        /* ══════════════════════════════════════════════════
           PAGE 3: Detailed Data Tables
           ══════════════════════════════════════════════════ */
        doc.addPage();
        doc.setFillColor(20, 24, 36);
        doc.rect(0, 0, pageW, 14, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255);
        doc.text('Rev-Ops  •  Detailed Breakdown Tables', margin, 10);

        y = 24;

        // Industry table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('[+] Industry Distribution', margin, y);
        y += 4;
        autoTable(doc, {
            startY: y, theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 2: { fontStyle: 'bold' } },
            head: [['Industry', 'Count', '% of Total']],
            body: analytics.industryData.map(d => [d.name, d.value, `${(d.value / leads.length * 100).toFixed(1)}%`]),
        });
        y = doc.lastAutoTable.finalY + 10;

        // Budget table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(251, 191, 36);
        doc.text('[+] Budget Distribution', margin, y);
        y += 4;
        autoTable(doc, {
            startY: y, theme: 'grid',
            headStyles: { fillColor: [251, 191, 36], textColor: [30, 30, 30], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            head: [['Budget Range', 'Count', '% of Total']],
            body: analytics.budgetData.map(d => [d.name, d.value, `${(d.value / leads.length * 100).toFixed(1)}%`]),
        });
        y = doc.lastAutoTable.finalY + 10;

        // Service table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('[+] Service Demand', margin, y);
        y += 4;
        autoTable(doc, {
            startY: y, theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            head: [['Service', 'Count', '% of Total']],
            body: analytics.serviceData.map(d => [d.name, d.value, `${(d.value / leads.length * 100).toFixed(1)}%`]),
        });
        y = doc.lastAutoTable.finalY + 10;

        // Client Type table
        if (y > 200) { doc.addPage(); y = 20; }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(168, 85, 247);
        doc.text('[+] Client Type Breakdown', margin, y);
        y += 4;
        autoTable(doc, {
            startY: y, theme: 'grid',
            headStyles: { fillColor: [168, 85, 247], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            head: [['Client Type', 'Count', '% of Total']],
            body: analytics.clientTypeData.map(d => [d.name, d.value, `${(d.value / leads.length * 100).toFixed(1)}%`]),
        });
        y = doc.lastAutoTable.finalY + 10;

        // Status breakdown
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(6, 182, 212);
        doc.text('[+] Lead Status Overview', margin, y);
        y += 4;
        autoTable(doc, {
            startY: y, theme: 'grid',
            headStyles: { fillColor: [6, 182, 212], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            head: [['Status', 'Count', '% of Total']],
            body: analytics.statusData.map(d => [d.name, d.value, `${(d.value / leads.length * 100).toFixed(1)}%`]),
        });

        /* ══════════════════════════════════════════════════
           PAGE 4: All Leads Comparison Grid
           ══════════════════════════════════════════════════ */
        doc.addPage();
        doc.setFillColor(20, 24, 36);
        doc.rect(0, 0, pageW, 14, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255);
        doc.text('Rev-Ops  •  All Leads Comparison Grid', margin, 10);

        doc.setFontSize(13);
        doc.setTextColor(40);
        doc.text('Lead-by-Lead Comparison', margin, 26);

        autoTable(doc, {
            startY: 32, theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fontSize: 7, halign: 'center' },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { cellWidth: 30, halign: 'left' },
                2: { cellWidth: 24, halign: 'left' },
                3: { cellWidth: 24 },
                4: { cellWidth: 22 },
                5: { cellWidth: 22 },
                6: { cellWidth: 20 },
                7: { cellWidth: 15 },
                8: { cellWidth: 18 },
            },
            head: [['#', 'Company', 'Contact', 'Service', 'Budget', 'Industry', 'Size', 'Score', 'Status']],
            body: leads.map((l, i) => [
                i + 1,
                l.company || '—',
                l.name || '—',
                getServiceLabel(l.service_required),
                getBudgetLabel(l.estimated_budget),
                l.industry || '—',
                l.company_size || '—',
                l.lead_score ?? '—',
                (l.status || '—').toUpperCase(),
            ]),
            didParseCell: (data) => {
                // Color code scores
                if (data.column.index === 7 && data.section === 'body') {
                    const score = parseInt(data.cell.raw);
                    if (!isNaN(score)) {
                        if (score >= 70) { data.cell.styles.textColor = [16, 185, 129]; data.cell.styles.fontStyle = 'bold'; }
                        else if (score >= 40) { data.cell.styles.textColor = [251, 191, 36]; data.cell.styles.fontStyle = 'bold'; }
                        else { data.cell.styles.textColor = [239, 68, 68]; data.cell.styles.fontStyle = 'bold'; }
                    }
                }
                // Color code status
                if (data.column.index === 8 && data.section === 'body') {
                    const s = String(data.cell.raw).toLowerCase();
                    if (s.includes('client')) { data.cell.styles.textColor = [16, 185, 129]; data.cell.styles.fontStyle = 'bold'; }
                    else if (s.includes('lost')) { data.cell.styles.textColor = [239, 68, 68]; data.cell.styles.fontStyle = 'bold'; }
                    else if (s.includes('slack')) { data.cell.styles.textColor = [249, 115, 22]; }
                    else if (s.includes('captured')) { data.cell.styles.textColor = [59, 130, 246]; }
                }
            },
        });

        /* ── Footer on all pages ─────────────────────── */
        const pc = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pc; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Rev-Ops  •  Confidential Analytics Report', margin, pageH - 8);
            doc.text(`Page ${i} of ${pc}`, pageW - margin, pageH - 8, { align: 'right' });
            // Top-right page badge
            if (i > 1) {
                doc.setFontSize(7);
                doc.setTextColor(180);
                doc.text(`${leads.length} leads`, pageW - margin, 10, { align: 'right' });
            }
        }

        doc.save(`RevOps_Master_Analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    /* ── Sidebar nav items ─────────────────────────── */
    const navItems = [
        { key: 'analytics', label: 'Lead Analytics', icon: <Activity size={20} /> },
        { key: 'reports', label: 'Reports Hub', icon: <FileText size={20} /> },
    ];

    /* ── Chart Card component ──────────────────────── */
    const ChartCard = ({ title, subtitle, children }) => (
        <div className="glass" style={{ padding: '24px', height: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{title}</div>
                {subtitle && <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>{subtitle}</div>}
            </div>
            {children}
        </div>
    );

    /* ── Render ─────────────────────────────────────── */
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px', flexShrink: 0, padding: '28px 16px',
                display: 'flex', flexDirection: 'column',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '16px' }}>R</div>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: '#fff', letterSpacing: '-0.01em' }}>Rev-Ops Console</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {navItems.map(item => (
                        <button key={item.key} onClick={() => setActiveTab(item.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                background: activeTab === item.key ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'transparent',
                                color: activeTab === item.key ? '#fff' : '#a1a1aa',
                                fontWeight: activeTab === item.key ? 700 : 500, fontSize: '14px', fontFamily: 'inherit', transition: 'all .2s', textAlign: 'left',
                            }}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                </nav>

                <button onClick={() => { localStorage.removeItem('adminToken'); navigate('/'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: 'inherit' }}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            {/* Main */}
            <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '28px' }}>
                    {navItems.find(n => n.key === activeTab)?.label}
                </h1>

                <AnimatePresence mode="wait">

                    {/* ── Lead Analytics ──────────────── */}
                    {activeTab === 'analytics' && (
                        <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {loadingLeads ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>Loading analytics...</div>
                            ) : !analytics ? (
                                <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
                                    <Activity size={40} color="#52525b" style={{ marginBottom: '12px' }} />
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#71717a' }}>No Data Yet</div>
                                    <div style={{ fontSize: '13px', color: '#52525b', marginTop: '6px' }}>Submit leads via the inquiry form to see analytics.</div>
                                </div>
                            ) : (
                                <>
                                    {/* Stat Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                                        {[
                                            { label: 'Total Leads', value: leads.length, color: '#3b82f6' },
                                            { label: 'Clients', value: leads.filter(l => l.status === 'client').length, color: '#10b981' },
                                            { label: 'Lost', value: leads.filter(l => l.status === 'lost').length, color: '#ef4444' },
                                            { label: 'Conversion', value: (() => { const decided = leads.filter(l => l.status === 'client' || l.status === 'lost').length; return decided > 0 ? `${Math.round(leads.filter(l => l.status === 'client').length / decided * 100)}%` : '—'; })(), color: '#fbbf24' },
                                            { label: 'Slack Invited', value: leads.filter(l => l.status === 'slack_invited').length, color: '#a855f7' },
                                            { label: 'Avg Score', value: leads.filter(l => l.lead_score != null).length > 0 ? (leads.reduce((s, l) => s + (l.lead_score || 0), 0) / leads.filter(l => l.lead_score != null).length).toFixed(0) : '—', color: '#06b6d4' },
                                        ].map(s => (
                                            <div key={s.label} className="glass" style={{ padding: '20px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '32px', fontWeight: 800, color: s.color }}>{s.value}</div>
                                                <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Row 1: Industry + Budget */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <ChartCard title="Industry Distribution" subtitle="Where leads come from">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={analytics.industryData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                        {analytics.industryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </ChartCard>

                                        <ChartCard title="Budget Distribution" subtitle="Client spending ranges">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={analytics.budgetData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                        {analytics.budgetData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    </div>

                                    {/* Row 2: Service Demand + Client Type */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <ChartCard title="Service Demand" subtitle="Most requested services">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={analytics.serviceData} layout="vertical" margin={{ left: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} />
                                                    <YAxis dataKey="name" type="category" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={80} />
                                                    <Tooltip contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartCard>

                                        <ChartCard title="Client Type" subtitle="Who is reaching out">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={analytics.clientTypeData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                        {analytics.clientTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    </div>

                                    {/* Row 3: Company Size */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <ChartCard title="Company Size" subtitle="Team size distribution">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={analytics.sizeData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                                                    <Tooltip contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartCard>

                                        <ChartCard title="Lead Status" subtitle="Current pipeline breakdown">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={analytics.statusData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                        {analytics.statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 6) % CHART_COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    </div>

                                    {/* Row 4: Conversion Funnel */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <ChartCard title="Conversion Funnel" subtitle="Lead to client pipeline">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={[
                                                        { name: 'Clients', value: leads.filter(l => l.status === 'client').length },
                                                        { name: 'Lost', value: leads.filter(l => l.status === 'lost').length },
                                                        { name: 'In Progress', value: leads.filter(l => l.status !== 'client' && l.status !== 'lost').length },
                                                    ].filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                        <Cell fill="#10b981" />
                                                        <Cell fill="#ef4444" />
                                                        <Cell fill="#fbbf24" />
                                                    </Pie>
                                                    <Tooltip contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </ChartCard>

                                        <ChartCard title="Lead Status" subtitle="Current pipeline status">
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={analytics.statusData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                                                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                                                    <Tooltip contentStyle={{ background: '#1e1e28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                        {analytics.statusData.map((entry, i) => {
                                                            const colorMap = { client: '#10b981', lost: '#ef4444', slack_invited: '#f97316', captured: '#fbbf24' };
                                                            return <Cell key={i} fill={colorMap[entry.name?.toLowerCase()] || CHART_COLORS[i % CHART_COLORS.length]} />;
                                                        })}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartCard>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ── Reports Hub ─────────────────── */}
                    {activeTab === 'reports' && (
                        <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {/* Master Report Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                                {/* Master Excel */}
                                <div className="glass" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <FileSpreadsheet size={20} color="#10b981" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Master Excel Report</h3>
                                    </div>
                                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#71717a' }}>All {leads.length} leads — Overview + Comparison sheet</p>
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={generateAllLeadsExcel} disabled={leads.length === 0}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: leads.length > 0 ? 'linear-gradient(135deg,#059669,#34d399)' : 'rgba(255,255,255,0.05)', color: leads.length > 0 ? '#fff' : '#52525b', cursor: leads.length > 0 ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
                                        <Download size={16} /> Download Excel
                                    </motion.button>
                                </div>

                                {/* Master PDF */}
                                <div className="glass" style={{ padding: '24px', borderLeft: '4px solid #3b82f6' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <FileText size={20} color="#3b82f6" />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Master Analytics PDF</h3>
                                    </div>
                                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#71717a' }}>Charts, graphs & comparison tables</p>
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={generateMasterPDF} disabled={leads.length === 0}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: leads.length > 0 ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'rgba(255,255,255,0.05)', color: leads.length > 0 ? '#fff' : '#52525b', cursor: leads.length > 0 ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit' }}>
                                        <Download size={16} /> Download PDF
                                    </motion.button>
                                </div>
                            </div>

                            {/* Section Title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <div style={{ width: '4px', height: '20px', borderRadius: '99px', background: '#3b82f6' }} />
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#e4e4e7' }}>Individual Lead Reports</h3>
                            </div>

                            {/* Leads List */}
                            {loadingLeads ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>Loading...</div>
                            ) : leads.length === 0 ? (
                                <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
                                    <FileText size={40} color="#52525b" style={{ marginBottom: '12px' }} />
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#71717a' }}>No Leads Found</div>
                                    <div style={{ fontSize: '13px', color: '#52525b' }}>Submit inquiries via the form to see reports here.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {leads.map(lead => {
                                        const st = (lead.status || 'captured').toLowerCase();
                                        const isSlackSent = st === 'slack_invited' || st === 'client' || st === 'lost';
                                        const isClient = st === 'client';
                                        const isLost = st === 'lost';
                                        const isDecided = isClient || isLost;
                                        const borderColor = isClient ? '#10b981' : isLost ? '#ef4444' : isSlackSent ? '#f97316' : '#3b82f6';
                                        const statusBg = isClient ? 'rgba(16,185,129,0.12)' : isLost ? 'rgba(239,68,68,0.12)' : isSlackSent ? 'rgba(249,115,22,0.12)' : 'rgba(251,191,36,0.12)';
                                        const statusColor = isClient ? '#34d399' : isLost ? '#f87171' : isSlackSent ? '#fb923c' : '#fbbf24';
                                        return (
                                            <div key={lead.id} className="glass" style={{
                                                padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap',
                                                borderLeft: `4px solid ${borderColor}`,
                                            }}>
                                                {/* Lead info */}
                                                <div style={{ flex: 1, minWidth: '180px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{lead.company || 'Unknown'}</div>
                                                    <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
                                                        {lead.name} • {lead.email} • {getServiceLabel(lead.service_required)}
                                                    </div>
                                                </div>

                                                {/* Score + Status */}
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                                                    {lead.lead_score != null && (
                                                        <div style={{ textAlign: 'center' }}>
                                                            <div style={{ fontSize: '18px', fontWeight: 800, color: lead.lead_score >= 70 ? '#34d399' : lead.lead_score >= 40 ? '#fbbf24' : '#f87171' }}>{lead.lead_score}</div>
                                                            <div style={{ fontSize: '9px', color: '#52525b', textTransform: 'uppercase' }}>Score</div>
                                                        </div>
                                                    )}
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                                        background: statusBg, color: statusColor,
                                                    }}>
                                                        {st.toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Action Buttons */}
                                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {lead.outreach?.status?.toLowerCase() === 'complete' && lead.outreach?.slack_channel_link && (
                                                        <a href={lead.outreach.slack_channel_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                                                            <SendIcon size={12} /> Channel
                                                        </a>
                                                    )}
                                                    {lead.outreach?.status?.toLowerCase() === 'complete' && lead.outreach?.meeting_link && (
                                                        <a href={lead.outreach.meeting_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                                                            <CheckCircle2 size={12} /> Meet Link
                                                        </a>
                                                    )}
                                                    {lead.outreach?.status?.toLowerCase() === 'pending' && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fb923c', background: 'rgba(249,115,22,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                                                            ⏳ Generating...
                                                        </span>
                                                    )}

                                                    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => generateIndividualPDF(lead)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>
                                                        <FileText size={13} /> PDF
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => generateIndividualExcel(lead)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.1)', color: '#34d399', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>
                                                        <FileSpreadsheet size={13} /> Excel
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => handleSlackInvite(lead)}
                                                        disabled={isSlackSent || slackSending === lead.id}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600,
                                                            background: isSlackSent ? 'rgba(249,115,22,0.08)' : 'linear-gradient(135deg,#f97316,#ea580c)',
                                                            color: isSlackSent ? '#52525b' : '#fff',
                                                            cursor: isSlackSent ? 'default' : 'pointer',
                                                        }}>
                                                        <SendIcon size={13} /> {slackSending === lead.id ? '...' : isSlackSent ? 'Sent' : 'Slack'}
                                                    </motion.button>

                                                    {/* Conversion Buttons — shown after Slack invite */}
                                                    {isSlackSent && !isDecided && (
                                                        <>
                                                            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => handleStatusUpdate(lead, 'client')}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>
                                                                <CheckCircle2 size={13} /> Client
                                                            </motion.button>
                                                            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => handleStatusUpdate(lead, 'lost')}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600 }}>
                                                                <XCircle size={13} /> Lost
                                                            </motion.button>
                                                        </>
                                                    )}
                                                    {isClient && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', color: '#34d399', fontSize: '11px', fontWeight: 700 }}>
                                                            <CheckCircle2 size={13} /> Converted
                                                        </span>
                                                    )}
                                                    {isLost && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '11px', fontWeight: 700 }}>
                                                            <XCircle size={13} /> Not Converted
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default Dashboard;
