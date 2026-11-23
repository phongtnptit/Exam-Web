import nodemailer from "nodemailer";

// Gui mail qua Gmail SMTP. Can App Password (16 ky tu) cua tai khoan Gmail
// gui, KHONG dung mat khau Gmail thuong. Cau hinh trong backend/.env:
//   EMAIL_USER=<redacted>
//   EMAIL_PASS=<redacted>  (App Password, bo het khoang trang khi nhap)
//   EMAIL_FROM=<redacted> (mac dinh lay EMAIL_USER)
// Neu chua cau hinh, ham gui mail chi in ma ra console (che do dev) va
// tra ve false, khong lam hong luong dang ky.

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: pass.replace(/\s+/g, "") },
  });
  return transporter;
}

export function isMailConfigured() {
  return Boolean(process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.trim());
}

export async function sendVerificationCode(toEmail, fullName, code) {
  const transport = getTransporter();
  if (!transport) {
    console.log(
      `[DEV] Ma xac minh email cho ${toEmail}: ${code} (chua cau hinh EMAIL_USER/EMAIL_PASS trong .env)`
    );
    return false;
  }

  const from = process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER.trim();
  const ttl = Number(process.env.VERIFICATION_CODE_EXPIRES_MINUTES || 15);

  await transport.sendMail({
    from: `"PTIT ExamPro" <${from}>`,
    to: toEmail,
    subject: `[PTIT ExamPro] Ma xac minh email: ${code}`,
    text: `Xin chao ${fullName},\n\nMa xac minh email cua ban la: ${code}\nMa co hieu luc trong ${ttl} phut. Khong chia se ma nay cho bat ky ai.\n\nNeu ban khong dang ky tai khoan PTIT ExamPro, hay bo qua email nay.\n\nPTIT ExamPro`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #222;">
        <h2 style="color: #b91c1c;">PTIT ExamPro — Xac minh email</h2>
        <p>Xin chao <strong>${fullName}</strong>,</p>
        <p>Ma xac minh email cua ban la:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #f3f4f6; padding: 16px; border-radius: 8px;">${code}</p>
        <p>Ma co hieu luc trong <strong>${ttl} phut</strong>. Khong chia se ma nay cho bat ky ai.</p>
        <p>Neu ban khong dang ky tai khoan PTIT ExamPro, hay bo qua email nay.</p>
      </div>
    `,
  });
  return true;
}
