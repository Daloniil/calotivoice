const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

/**
 * Dev-only: called from Metro on your Mac (AWS keys never ship in the app bundle).
 */
async function sendOtpViaSes({ to, code }) {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const from = process.env.AUTH_EMAIL_FROM?.trim();

  if (!region) {
    throw new Error('AWS_REGION is not set in .env');
  }
  if (!from) {
    throw new Error('AUTH_EMAIL_FROM is not set in .env');
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY missing in .env');
  }

  const client = new SESClient({ region });
  const subject = 'CaloriVoice — sign-in code';
  const bodyText =
    `Your one-time sign-in code is: ${code}\n\n` +
    'It expires in 10 minutes. If you did not request this, ignore this email.';

  await client.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Text: { Data: bodyText, Charset: 'UTF-8' } },
      },
    }),
  );
}

module.exports = { sendOtpViaSes };
