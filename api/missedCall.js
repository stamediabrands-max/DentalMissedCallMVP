import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const lead_id = req.query?.lead_id;
    if (!lead_id) return res.status(400).json({ error: 'Missing lead_id' });

    // Fetch lead from Supabase
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Supabase fetch failed', details: error.message });
    }

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    res.json({ status: 'Supabase connection works!', lead });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
