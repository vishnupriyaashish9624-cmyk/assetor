const db = require('../config/db');

async function correctEmail() {
    try {
        const wrongEmail = 'ashishvishnupriya7413@gmail.com';
        const correctEmail = 'vishnupriya7413@gmail.com';

        console.log(`Searching for user with correct email: ${correctEmail}`);
        const [existing] = await db.execute("SELECT * FROM users WHERE email = ?", [correctEmail]);

        if (existing.length > 0) {
            console.log("User with correct email already exists!", existing[0].id);
            // If both exist, we might have a conflict, but let's see.
        }

        console.log(`Updating user with wrong email: ${wrongEmail}`);
        const [result] = await db.execute(
            "UPDATE users SET email = ? WHERE email LIKE ?",
            [correctEmail, `%${wrongEmail}%`]
        );

        console.log("Update executed. Rows affected:", result.affectedRows || result.rowCount);

        const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [correctEmail]);
        if (users.length > 0) {
            console.log(`User updated successfully:`, users[0].id, users[0].email);
        } else {
            console.log("User not found after update.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await db.pool.end();
    }
}

correctEmail();
