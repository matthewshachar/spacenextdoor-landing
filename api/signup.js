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
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <div style="background: #1a3a28; padding: 32px 40px; text-align: center;">
            <a href="https://www.spacenextdoor.co" style="display: inline-block;">
              <img src="https://www.spacenextdoor.co/spacenextdoor-logo.png" alt="SpaceNextDoor" style="height: 40px; width: auto;" />
            </a>
          </div>

          <!-- Body -->
          <div style="background: #f5f4f0; padding: 40px;">
            <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1a3a28;">You're on the list, ${firstName} 🏡</h1>
            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #333333;">Thanks for signing up — you're officially on the SpaceNextDoor waitlist.</p>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #333333;">We're launching in Toronto in September 2026, and as a founding host you'll get early access plus zero platform fees for your first 3 months.</p>

            <!-- Highlight box -->
            <div style="background: #1a3a28; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #4aba7a;">What you get as a founding host</p>
              <ul style="margin: 10px 0 0; padding-left: 20px; color: #ffffff; font-size: 14px; line-height: 1.8;">
                <li>Early access before public launch</li>
                <li>0% platform fees for your first 3 months</li>
                <li>Priority support from our team</li>
              </ul>
            </div>

            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #333333;">We'll be in touch before launch with everything you need to list your space and start earning.</p>
            <p style="margin: 0; font-size: 15px; color: #333333;">— The SpaceNextDoor Team</p>
          </div>

          <!-- Footer -->
          <div style="background: #1a3a28; padding: 20px 40px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5);">© 2026 SpaceNextDoor Inc. · Toronto, Canada.</p>
          </div>

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
