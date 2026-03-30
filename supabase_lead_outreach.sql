-- ============================================
-- Rev-Ops: Lead Outreach Tracking Table
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create the lead_outreach table
CREATE TABLE public.lead_outreach (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    outreach_type text NOT NULL DEFAULT 'slack',           -- 'slack', 'email', etc.
    status text NOT NULL DEFAULT 'pending',                -- 'pending', 'success', 'failed'
    slack_channel_link text,                               -- Slack channel/DM link
    meeting_link text,                                     -- Meeting/calendar link
    webhook_response jsonb,                                -- Raw response from n8n
    error_message text,                                    -- Error details if failed
    triggered_at timestamp with time zone DEFAULT now(),   -- When the outreach was triggered
    updated_at timestamp with time zone DEFAULT now(),     -- Last update time
    CONSTRAINT lead_outreach_pkey PRIMARY KEY (id)
);

-- Create index for fast lookups by lead_id
CREATE INDEX idx_lead_outreach_lead_id ON public.lead_outreach(lead_id);

-- Create index for filtering by status
CREATE INDEX idx_lead_outreach_status ON public.lead_outreach(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.lead_outreach ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (adjust as needed for your security model)
CREATE POLICY "Allow all access to lead_outreach"
    ON public.lead_outreach
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Optional: Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_outreach_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_outreach_updated_at
    BEFORE UPDATE ON public.lead_outreach
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_outreach_updated_at();
