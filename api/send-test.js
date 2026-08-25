export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const emailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">

      <!-- Header -->
      <div style="background: #1a3a28; padding: 32px 40px; text-align: center;">
        <a href="https://www.spacenextdoor.co" style="display: inline-block;">
          <img src="https://www.spacenextdoor.co/spacenextdoor-logo.png" alt="SpaceNextDoor" style="height: 40px; width: auto;" />
        </a>
      </div>

      <!-- Body -->
      <div style="background: #ffffff; padding: 40px;">
        <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1a3a28;">We're almost live — let's get your space listed!</h1>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #000000;">Hi there,</p>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #000000;">SpaceNextDoor is almost ready to launch and I'd love to get your listing up before we go live. I'll be reaching out personally next week to walk you through the setup — but in the meantime, you can grab a time directly on my calendar below.</p>

        <!-- Calendly CTA -->
        <div style="text-align: center; margin: 0 0 32px;">
          <a href="https://calendly.com/matthew-spacenextdoor/30min" style="display: inline-block; background: #1a3a28; border-radius: 50px; padding: 14px 36px; text-decoration: none; font-size: 15px; font-weight: 600; color: #ffffff;">Book a time with me →</a>
        </div>

        <!-- Prep box -->
        <div style="background: #1a3a28; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #4aba7a;">To get set up quickly, have these ready:</p>
          <ul style="margin: 0; padding-left: 20px; color: #ffffff; font-size: 14px; line-height: 1.9;">
            <li>At least 3 photos of your space (outside of space, inside the space, and access to the space)</li>
            <li>Your bank account details for monthly payouts</li>
            <li>A piece of ID to verify your identity</li>
          </ul>
        </div>

        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #000000;">That said, feel free to sign up on your own anytime — it's straightforward. Simply create an account, verify your email and ID, connect your bank account, and create your listing. Most people are done in under 15 minutes.</p>
        <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: #000000;">Looking forward to connecting soon.</p>
        <p style="margin: 0; font-size: 15px; color: #000000;">Matthew Shachar<br><span style="color: #888; font-size: 13px;">Co-Founder, Spacenextdoor</span><br><a href="mailto:matthew@spacenextdoor.co" style="color: #1a3a28; font-size: 13px; text-decoration: none;">matthew@spacenextdoor.co</a></p>
      </div>

      <!-- Footer -->
      <div style="background: #1a3a28; padding: 20px 40px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5);">© 2026 SpaceNextDoor Inc. · Toronto, Canada.</p>
      </div>

    </div>
  `;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SpaceNextDoor <hello@notifications.spacenextdoor.co>',
      reply_to: 'matthew@spacenextdoor.co',
      to: 'matthew.shachar@gmail.com',
      subject: "We are almost live! let's get your listings up on Spacenextdoor.",
      html: emailHtml,
    }),
  });

  if (!emailRes.ok) {
    const error = await emailRes.json();
    console.error('Resend error:', error);
    return res.status(500).json({ error });
  }

  return res.status(200).json({ success: true, message: 'Test email sent to matthew.shachar@gmail.com' });
}
