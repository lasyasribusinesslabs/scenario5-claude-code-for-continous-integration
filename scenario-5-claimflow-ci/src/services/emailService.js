const https = require('https');

// BUG: hardcoded SendGrid API key — should be read from process.env.SENDGRID_API_KEY
const API_KEY = 'SG.abc123fakekey';

async function sendEmail({ to, subject, body }) {
  if (!to || !subject || !body) {
    throw new Error('Missing required email fields: to, subject, body');
  }

  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: 'no-reply@claimflow.io' },
    subject,
    content: [{ type: 'text/plain', value: body }],
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ success: true, statusCode: res.statusCode });
      } else {
        reject(new Error(`SendGrid responded with status ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sendWelcomeEmail(userEmail) {
  return sendEmail({
    to: userEmail,
    subject: 'Welcome to ClaimFlow',
    body: 'Your account has been created. You can now submit and track insurance claims.',
  });
}

async function sendPasswordResetEmail(userEmail, resetToken) {
  if (!resetToken) {
    throw new Error('Reset token is required');
  }
  return sendEmail({
    to: userEmail,
    subject: 'ClaimFlow Password Reset',
    body: `Use this token to reset your password: ${resetToken}. It expires in 1 hour.`,
  });
}

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail };
