import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env.js";

let transporter: Transporter | null = null;

function createTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

function getTransporter(): Transporter | null {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const t = getTransporter();
  if (!t) return;

  try {
    await t.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export function achievementEmailTemplate(name: string, achievement: string): string {
  return `<h2>Achievement Unlocked!</h2><p>Congratulations ${name}, you unlocked <strong>${achievement}</strong>!</p>`;
}

export function levelUpEmailTemplate(name: string, level: number): string {
  return `<h2>Level Up!</h2><p>Congratulations ${name}, you reached <strong>Level ${level}</strong>!</p>`;
}

export function teamInviteEmailTemplate(name: string, teamName: string): string {
  return `<h2>New Team Member!</h2><p>Hey ${name}, someone just joined your team <strong>${teamName}</strong>!</p>`;
}

export function digestEmailTemplate(name: string, notifications: Array<{ title: string; body: string }>): string {
  const items = notifications.map((n) => `<li><strong>${n.title}</strong>: ${n.body}</li>`).join("");
  return `<h2>Notification Digest</h2><p>Hey ${name}, here's what happened:</p><ul>${items}</ul>`;
}
