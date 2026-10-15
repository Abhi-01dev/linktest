import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testSmtp() {
  console.log('================================================================');
  console.log('       LinkTest | Gmail SMTP Verification & Diagnostics        ');
  console.log('================================================================');

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;

  console.log(`[SMTP Test] Target Server: ${host}:${port}`);
  console.log(`[SMTP Test] Sender User:  ${user ? user : '(NOT CONFIGURED)'}`);
  console.log(`[SMTP Test] App Password: ${pass ? '●●●●●●●● (configured, hidden for security)' : '(NOT CONFIGURED)'}`);

  if (!user || !pass) {
    console.log('\n[SMTP Test] Status: UNCONFIGURED (Credentials Missing)');
    console.log('----------------------------------------------------------------');
    console.log('To configure Gmail SMTP for sending real OTPs and invitations:');
    console.log('  1. Go to your Google Account (https://myaccount.google.com).');
    console.log('  2. Enable 2-Step Verification under the "Security" tab.');
    console.log('  3. Search for "App Passwords" (https://myaccount.google.com/apppasswords).');
    console.log('  4. Create an App Password with name "LinkTest LMS".');
    console.log('  5. Copy the 16-character code (format: abcd efgh ijkl mnop).');
    console.log('  6. Add to backend/.env:');
    console.log('       SMTP_USER=your_email@gmail.com');
    console.log('       SMTP_APP_PASSWORD=abcdefghijklmnop');
    console.log('  7. Re-run: node scripts/test-smtp.js');
    console.log('----------------------------------------------------------------');
    console.log('NOTE: While unconfigured, LinkTest safely logs OTPs to console.');
    console.log('================================================================');
    return;
  }

  try {
    console.log('\n[SMTP Test] Verifying SMTP socket handshake and TLS...');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // 587 uses STARTTLS
      requireTLS: true,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: true
      }
    });

    await transporter.verify();
    console.log('[SMTP Test] SUCCESS: Gmail SMTP credentials verified and authenticated!');
    console.log('LinkTest is ready to deliver production emails.');
  } catch (err) {
    console.error('[SMTP Test] FAILED: Could not authenticate with Gmail SMTP server:');
    console.error(`  Error Code:    ${err.code || 'UNKNOWN'}`);
    console.error(`  Error Message: ${err.message}`);
    console.log('\nTroubleshooting hints:');
    console.log('  - Ensure you are using a 16-character Google "App Password", NOT your regular Gmail login password.');
    console.log('  - Ensure 2-Step Verification is activated on the Google account.');
    console.log('  - Verify outbound port 587 is not blocked by local antivirus/firewall.');
  }
}

testSmtp();
