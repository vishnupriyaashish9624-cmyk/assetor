const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function sendWelcomeEmail() {
    try {
        const adminEmail = 'ashishvishnupriya7413@gmail.com';
        const adminName = 'sona';
        const tempPassword = 'Trakio' + Math.floor(1000 + Math.random() * 9000);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 1. Update user password and set force_reset = true
        await pool.query(
            "UPDATE users SET password = $1, force_reset = true WHERE email = $2",
            [hashedPassword, adminEmail]
        );
        console.log(`Updated password for ${adminEmail}`);

        const loginUrl = process.env.FRONTEND_URL || 'http://localhost:19006';
        const groupName = 'sona Group'; // Placeholder since I don't have the client name easily here

        // 2. Use the official email service
        await sendEmail(
            adminEmail,
            '🚀 Welcome to Trakio - Your Account is Ready!',
            `Hello ${adminName},\n\nWelcome to Trakio.\n\nYour account has been created with the following credentials:\nEmail: ${adminEmail}\nTemporary Password: ${tempPassword}\n\nPlease log in here: ${loginUrl}\n\nBest regards,\nTrakio Team`,
            `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Welcome to Trakio</h1>
                    <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">The ultimate asset management experience</p>
                </div>
                
                <div style="padding: 40px 30px; background: white;">
                    <p style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">Hello ${adminName},</p>
                    <p style="line-height: 1.6; color: #64748b; margin-bottom: 30px;">
                        We're excited to have you on board! Your administrator account has been successfully provisioned. 
                        You can now start managing your company's assets, employees, and operations.
                    </p>
                    
                    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Login Credentials</p>
                        <div style="font-size: 16px; margin-bottom: 12px;">
                            <strong style="color: #475569;">Email:</strong> <span style="color: #3b82f6;">${adminEmail}</span>
                        </div>
                        <div style="font-size: 16px;">
                            <strong style="color: #475569;">Temporary Password:</strong> <span style="color: #3b82f6;">${tempPassword}</span>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);">
                            Log In to Your Account
                        </a>
                    </div>
                    
                    <div style="padding: 20px; background-color: #fff7ed; border-radius: 8px; border-left: 4px solid #f97316;">
                        <p style="margin: 0; font-size: 14px; color: #9a3412;">
                            <strong>Important:</strong> For security reasons, you will be required to change this temporary password immediately after your first successful login.
                        </p>
                    </div>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Trakio Asset Management System. All rights reserved.</p>
                </div>
            </div>
            `
        );

        console.log('Email dispatch triggered');

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

sendWelcomeEmail();
