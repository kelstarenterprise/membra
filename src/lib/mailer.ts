// src/lib/mailer.ts
import nodemailer, { type Transporter } from "nodemailer";

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!, // set in .env
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});

export async function sendMemberWelcomeEmail(opts: {
  to?: string | null;
  firstName: string;
  membershipId: string;
}) {
  if (!opts.to) return;
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@example.com",
    to: opts.to,
    subject: "Welcome — Your Membership ID",
    text: `Hello ${opts.firstName}, your membership was created successfully. Your Member ID is ${opts.membershipId}.`,
    html: `<p>Hello <strong>${opts.firstName}</strong>,</p>
<p>Your membership was created successfully.</p>
<p><strong>Member ID:</strong> ${opts.membershipId}</p>`,
  });
}
