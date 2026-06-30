export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, neighbourhood, spaceType } = req.body;

  if (!firstName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Write to Google Sheets via API
  try {
    const token = await getAccessToken();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const timestamp = new Date().toISOString();

    const sheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[timestamp, firstName, lastName, email, neighbourhood, spaceType]],
        }),
      }
    );

    if (!sheetRes.ok) {
      const err = await sheetRes.json();
      console.error('Google Sheets error:', { firstName, lastName, email, neighbourhood, spaceType }, err);
    }
  } catch (err) {
    console.error('Google Sheets exception:', { firstName, lastName, email, neighbourhood, spaceType }, err);
  }

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

            <!-- CTA button -->
            <div style="text-align: center; margin: 0 0 24px;">
              <a href="https://www.spacenextdoor.co" style="display: inline-block; background: #1a3a28; border-radius: 50px; padding: 14px 32px; text-decoration: none;">
                <img src="https://www.spacenextdoor.co/spacenextdoor-logo.png" alt="Visit SpaceNextDoor" style="height: 22px; width: auto; display: block;" />
              </a>
            </div>

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

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${encode(header)}.${encode(payload)}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToBuffer(key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, Buffer.from(unsigned));
  const jwt = `${unsigned}.${Buffer.from(signature).toString('base64url')}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const { access_token } = await tokenRes.json();
  return access_token;
}

function pemToBuffer(pem) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  return Buffer.from(base64, 'base64');
}
