const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || "true") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendNewPasswordMail(toEmail, newPassword) {
  const from = process.env.SMTP_USER;

  return transporter.sendMail({
    from: `THEGIOIDIDONG <${from}>`,
    to: toEmail,
    subject: "THEGIOIDIDONG - Mật khẩu mới của bạn",
    html: `
      <div style="font-family:Arial; line-height:1.6">
        <h3>Yêu cầu đặt lại mật khẩu</h3>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Đây là mật khẩu mới:</p>
        <p style="font-size:18px; font-weight:bold;">${newPassword}</p>
      </div>
    `,
  });
}

module.exports = { transporter, sendNewPasswordMail };
