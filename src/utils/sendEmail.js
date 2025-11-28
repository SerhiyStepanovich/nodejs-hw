// src/utils/sendMail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import handlebars from 'handlebars';
import fs from 'fs/promises';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    const templatePath = `src/templates/${template}.html`;
    const source = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(source);

    const html = compiledTemplate(data);

    const emailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(emailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send the email, please try again later.');
  }
};
