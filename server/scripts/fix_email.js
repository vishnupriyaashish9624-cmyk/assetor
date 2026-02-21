const db = require('../config/db');

async function fixEmail() {
    try {
        const target = 'vishnupriya7413@gmail.com'; // 25 chars
        // We look for emails that CONTAIN this string but are longer
        // or just update it directly with a trim.

        console.log(`Fixing email for user containing: ${target}`);

        // Update with TRIM()
        const [result] = await db.execute(
            "UPDATE users SET email = TRIM(email) WHERE email LIKE ?",
            [`%${target}%`]
        );

        console.log("Update executed. Rows affected:", result.affectedRows || result.rowCount);

        const [users] = await db.execute("SELECT * FROM users WHERE email LIKE ?", [`%${target}%`]);
        if (users.length > 0) {
            const u = users[0];
            console.log(`NEW Email: [${u.email}] (Length: ${u.email.length})`);
        } else {
            console.log("User not found after update?");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await db.pool.end();
    }
}

fixEmail();
