const env = require('../../config/env');

function baseHtml({ title, bodyHtml }) {
    return `
  <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:600px; margin:0 auto; line-height:1.6; color:#1e293b; border: 1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding:30px 20px; text-align:center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${env.APP_NAME}</h1>
    </div>
    <div style="padding: 40px 30px; background: white;">
      <div style="font-size:20px; font-weight:700; margin-bottom:20px; color:#1e293b;">${title}</div>
      ${bodyHtml}
    </div>
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${env.APP_NAME}. All rights reserved.</p>
    </div>
  </div>`;
}

function welcomeWithTempPassword({ name, email, tempPassword, companyName }) {
    const title = 'Your account is ready';
    const bodyHtml = `
    <p>Hi ${name || 'there'},</p>
    <p>Your administrator account for <strong>${companyName || env.APP_NAME}</strong> has been successfully created.</p>
    
    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Login Credentials</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${env.APP_BASE_URL}" style="background-color: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">
            Log In to Your Account
        </a>
    </div>
    
    <p style="font-size: 14px; color: #64748b;">For security reasons, you will be required to set a new password immediately upon your first login.</p>
  `;
    return baseHtml({ title, bodyHtml });
}

function resetLinkEmail({ name, resetLink }) {
    const title = 'Reset your password';
    const bodyHtml = `
    <p>Hi ${name || 'there'},</p>
    <p>We received a request to reset your password. Click the button below to proceed:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #1e293b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700;">
        Reset Password
      </a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 13px; word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
  `;
    return baseHtml({ title, bodyHtml });
}

module.exports = { welcomeWithTempPassword, resetLinkEmail };
