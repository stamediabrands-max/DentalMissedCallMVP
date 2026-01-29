const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async function handler(req, res) {
  try {
    const lead_id = req.query?.lead_id;
    if (!lead_id) return res.status(400).json({ error: 'Missing lead_id' });

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError) {
      console.log('Supabase fetch error:', leadError);
      return res.status(500).json({ error: 'Supabase fetch failed', details: leadError });
    }

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    res.json({ status: 'Supabase connection works!', lead });
  } catch (err) {
    console.error('DEBUG ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
