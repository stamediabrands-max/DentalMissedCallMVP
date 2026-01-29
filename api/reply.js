import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const AI_API_KEY = process.env.GOOGLE_AI_KEY;

// Helper to generate AI reply messages
async function generateReplyMessage(leadName, clinicName, originalMessage) {
  const prompt = `
Напиши учтиво и професионално SMS до пациент, който е отговорил на пропуснато обаждане.
Име на пациент: ${leadName || 'Пациент'}
Име на клиника: ${clinicName}
Съобщение от пациента: ${originalMessage}
Тон: учтив, приятелски
Език: български
`;

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    }
  );

  const data = await response.json();
  return data.candidates?.[0]?.content || 'Благодаря за отговора, ще се свържем скоро.';
}

export default async function handler(req, res) {
  try {
    const { lead_id, patient_message } = req.body || {};
    if (!lead_id || !patient_message) {
      return res.status(400).json({ error: 'Липсва lead_id или patient_message' });
    }

    // 1️⃣ Get lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();
    if (leadError || !lead) return res.status(404).json({ error: 'Лийдът не е намерен' });

    // 2️⃣ Get clinic name
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();
    const clinicName = settings?.clinic_name || 'Стоматологична клиника Варна';

    // 3️⃣ Generate AI reply
    const aiReply = await generateReplyMessage(lead.name, clinicName, patient_message);

    // 4️⃣ Simulate sending SMS
    console.log('SIMULATED REPLY to', lead.phone, ':', aiReply);

    // 5️⃣ Save reply message
    const { data: newMessage } = await supabase
      .from('messages')
      .insert([{
        lead_id,
        direction: 'изходящо',
        content: aiReply,
        message_type: 'reply'
      }])
      .select()
      .single();

    res.json({ status: 'Отговорът е генериран (симулиран)', message: aiReply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}