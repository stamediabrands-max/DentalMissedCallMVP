import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const AI_API_KEY = process.env.GOOGLE_AI_KEY;

// Helper function to call Gemini AI
async function generateAIMessage(leadName, clinicName, messageType) {
  const prompt = `
Напиши кратко, учтиво и професионално SMS до пациент за пропуснато обаждане в зъболекарска клиника.
Име на пациент: ${leadName || 'Пациент'}
Име на клиника: ${clinicName}
Тип съобщение: ${messageType}
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
  return data.candidates?.[0]?.content || 'Здравейте, пропуснахме вашето обаждане.';
}

export default async function handler(req, res) {
  try {
    const lead_id = req.body?.lead_id || req.query?.lead_id;
    if (!lead_id) return res.status(400).json({ error: 'Липсва lead_id' });

    // 1️⃣ Get lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();
    if (leadError || !lead) return res.status(404).json({ error: 'Лийдът не е намерен' });

    // 2️⃣ Get previous messages safely
    const { data: messages = [] } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', lead_id);

    let messageType;
    switch (messages.length) {
      case 0: messageType = 'първо'; break;
      case 1: messageType = 'последващо_1'; break;
      case 2: messageType = 'последващо_2'; break;
      default: return res.json({ status: 'Няма повече последващи съобщения' });
    }

    // 3️⃣ Get clinic name
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();
    const clinicName = settings?.clinic_name || 'Стоматологична клиника Варна';

    // 4️⃣ Generate AI message
    const aiMessage = await generateAIMessage(lead.name, clinicName, messageType);

    // 5️⃣ Simulate sending SMS
    console.log('SIMULATED SMS to', lead.phone, ':', aiMessage);

    // 6️⃣ Save message
    const { data: newMessage } = await supabase
      .from('messages')
      .insert([{
        lead_id,
        direction: 'изходящо',
        content: aiMessage,
        message_type: messageType
      }])
      .select()
      .single();

    // 7️⃣ Update lead status
    await supabase
      .from('leads')
      .update({ status: 'контактиран', last_message_id: newMessage?.id || null })
      .eq('id', lead_id);

    // 8️⃣ Return response
    res.json({ status: 'Съобщението е генерирано (симулирано)', message: aiMessage });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}