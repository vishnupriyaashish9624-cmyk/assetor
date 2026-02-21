const db = require('../config/db');

async function revertEmail() {
    try {
        const currentEmail = 'vishnupriya7413@gmail.com';
        const previousEmail = 'ashishvishnupriya7413@gmail.com';

        console.log(`Reverting email from ${currentEmail} to ${previousEmail}`);

        const [result] = await db.execute(
            "UPDATE users SET email = ? WHERE email = ?",
            [previousEmail, currentEmail]
        );

        console.log("Update executed. Rows affected:", result.affectedRows || result.rowCount);

        const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [previousEmail]);
        if (users.length > 0) {
            console.log(`User reverted successfully:`, users[0].id, users[0].email);
        } else {
            console.log("User not found after update.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await db.pool.end();
    }
}

revertEmail();
