import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    // 1️⃣ Check environment variables
    console.log('ENV VARIABLES:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'OK' : 'MISSING',
      SUPABASE_KEY: process.env.SUPABASE_KEY ? 'OK' : 'MISSING',
      GOOGLE_AI_KEY: process.env.GOOGLE_AI_KEY ? 'OK' : 'MISSING',
    });

    // 2️⃣ Get lead_id
    const lead_id = req.query?.lead_id;
    if (!lead_id) return res.status(400).json({ error: 'Липсва lead_id' });

    // 3️⃣ Fetch lead from Supabase
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      console.log('Supabase lead fetch error:', leadError);
      return res.status(404).json({ error: 'Лийдът не е намерен' });
    }

    // 4️⃣ Skip AI for now if key missing
    const aiMessage = process.env.GOOGLE_AI_KEY
      ? 'AI message would be generated here'
      : 'Skipping AI - key missing';

    // 5️⃣ Return safe response
    res.json({
      status: 'Debug mode: function working',
      lead,
      message: aiMessage,
    });
  } catch (err) {
    console.error('DEBUG ERROR:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
