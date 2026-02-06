async function testEndpoints() {
    const endpoints = [
        'http://localhost:5032/api/module-master',
        'http://localhost:5032/api/countries',
        'http://localhost:5032/api/premises-types'
    ];

    for (const url of endpoints) {
        try {
            console.log(`Fetching ${url}...`);
            const res = await fetch(url);
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`Data count: ${Array.isArray(data.data) ? data.data.length : 'Not array'}`);
            } else {
                console.log('Error text:', await res.text());
            }
        } catch (e) {
            console.error(`Failed to fetch ${url}:`, e.message);
        }
        console.log('---');
    }
}

testEndpoints();
