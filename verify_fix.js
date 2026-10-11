const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function verify() {
    try {
        console.log("1. Registering new farmer...");
        const farmer = {
            username: "testfarmer_" + Date.now(),
            password: "password123",
            role: "Farmer",
            mobile: "1234567890",
            email: "farmer@test.com",
            address: "123 Farm Lane"
        };

        const regRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, farmer);

        if (regRes.status !== 200) {
            console.error("Registration failed:", regRes.body);
            return;
        }
        console.log("Registration successful:", regRes.body);

        console.log("2. Fetching all users (Admin API)...");
        const usersRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/users',
            method: 'GET'
        });

        if (usersRes.status !== 200) {
            console.error("Failed to fetch users. Endpoint might be missing (Server not restarted?):", usersRes.status);
            return;
        }

        const found = usersRes.body.find(u => u.username === farmer.username);
        if (found) {
            console.log("SUCCESS: Found registered farmer in /api/users response!");
            console.log(found);
        } else {
            console.error("FAILURE: Registered farmer not found in /api/users response.");
        }

    } catch (err) {
        console.error("Error during verification:", err.message);
    }
}

verify();
