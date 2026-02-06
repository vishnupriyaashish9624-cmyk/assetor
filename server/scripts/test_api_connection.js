const axios = require('axios');

async function testApi() {
    try {
        // We need a token to pass authMiddleware.
        // Since I cannot easily login, I will assume I might get 401. 
        // But if I get 401, it means the server IS reachable.
        // If I get Connection Refused, then server is not running on 5032.

        const url = 'http://localhost:5032/api/countries';
        console.log(`Fetching ${url}...`);

        try {
            const res = await axios.get(url);
            console.log('Status:', res.status);
            console.log('Data:', res.data);
        } catch (error) {
            if (error.response) {
                console.log('Status:', error.response.status); // 401 is good here (server running)
                console.log('Data:', error.response.data);
            } else {
                console.error('Error:', error.message);
            }
        }

    } catch (e) {
        console.error('Fatal:', e);
    }
}

testApi();
