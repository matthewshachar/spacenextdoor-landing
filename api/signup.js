export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, neighbourhood, spaceType } = req.body;

  if (!firstName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Forward to Google Forms
  const googleFormData = new URLSearchParams({
    'entry.1562598964': firstName,
    'entry.1831501118': lastName,
    'entry.695596673': email,
    'entry.1902104790': neighbourhood,
    'entry.848521825': spaceType,
  });

  await fetch(
    'https://docs.google.com/forms/d/e/1FAIpQLSfCpGPP7Ix4lILvHbfAlR1d2ccVIN87mOSDGE4ibIGEAhHYhw/formResponse',
    { method: 'POST', body: googleFormData }
  ).catch(() => {}); // non-blocking — don't fail if Google Forms is slow

  // Send confirmation email via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SpaceNextDoor <hello@notifications.spacenextdoor.co>',
      to: email,
      subject: `You're on the list, ${firstName} 🏡`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
          <p>Hi ${firstName},</p>
          <p>Thanks for signing up — you're officially on the SpaceNextDoor waitlist.</p>
          <p>We're launching in Toronto in September 2026, and as a founding host you'll get early access plus zero platform fees for your first 3 months.</p>
          <p>We'll be in touch before launch with everything you need to list your space and start earning.</p>
          <p>— The SpaceNextDoor Team</p>
        </div>
      `,
    }),
  });

  if (!emailRes.ok) {
    const error = await emailRes.json();
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ success: true });
}
