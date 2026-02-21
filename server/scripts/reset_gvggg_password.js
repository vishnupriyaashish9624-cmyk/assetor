const db = require('../config/db');
const bcrypt = require('bcryptjs');

const { sendEmail } = require('../utils/emailService');

async function resetPassword() {
    try {
        const clientName = 'gvggg';
        const [clients] = await db.execute("SELECT * FROM clients WHERE name LIKE ?", [`%${clientName}%`]);

        if (clients.length === 0) {
            console.log(`No client found with name '${clientName}'`);
            process.exit(1);
        }

        const client = clients[0];
        console.log(`Found Client: ${client.id} - ${client.name}`);

        const [users] = await db.execute("SELECT * FROM users WHERE client_id = ? AND role = 'COMPANY_ADMIN'", [client.id]);

        if (users.length === 0) {
            console.log("No ADMIN user found for this client.");
            process.exit(1);
        }

        const user = users[0];
        console.log(`Found User: ${user.id} - ${user.name} (${user.email})`);

        const newPassword = 'Temporary@123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.execute("UPDATE users SET password = ?, force_reset = true WHERE id = ?", [hashedPassword, user.id]);

        console.log('--------------------------------------------------');
        console.log('Password updated in database.');

        // Send Email
        console.log('Sending email...');
        await sendEmail(
            user.email,
            'Your Password Has Been Reset',
            `Hello ${user.name},\n\nYour administrator password has been reset.\nEmail: ${user.email}\nNew Password: ${newPassword}\n\nPlease log in and change your password immediately.`,
            `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Password Reset</h2>
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>Your administrator password has been successfully reset.</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
                    <p style="margin: 5px 0;"><strong>New Password:</strong> ${newPassword}</p>
                </div>
                <p>Please log in and change your password immediately.</p>
            </div>
            `
        );

        console.log('SUCCESS: Email sent successfully.');
        console.log('--------------------------------------------------');

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await db.pool.end();
    }
}

resetPassword();
