import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const DEFAULT_FROM = process.env.SMTP_USER;

/**
 * Надсилає електронний лист, використовуючи надані опції Nodemailer.
 *
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} [options.html]
 * @param {string} [options.text]
 * @param {string} [options.from]
 */
export const sendEmail = async (options) => {
  const emailOptions = {
    ...options,
    from: options.from || DEFAULT_FROM,
  };

  if (!emailOptions.html && !emailOptions.text) {
    throw new Error('Email content (html or text) is required.');
  }

  try {
    const info = await transporter.sendMail(emailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send the email, please try again later.');
  }
};
