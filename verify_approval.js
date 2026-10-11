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
        const timestamp = Date.now();
        const farmerName = "farmer_" + timestamp;

        // 1. Register Farmer
        console.log("1. Registering Farmer...");
        await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { username: farmerName, role: 'Farmer', mobile: '123', email: 'f@f.com', address: 'addr' });

        // 2. Submit Product
        console.log("2. Submitting Product...");
        const prodRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/products',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            name: "TestProd_" + timestamp,
            price: 100,
            description: "Desc",
            image: "data:image/png;base64,fake",
            category: "vegetables",
            stock: 10,
            farmer_username: farmerName
        });
        const productId = prodRes.body.id;
        console.log("   Product ID:", productId);

        // 3. Check Admin API (should be unapproved)
        console.log("3. Checking Admin API (should show unapproved)...");
        const productsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/products', method: 'GET' });
        const product = productsRes.body.find(p => p.id === productId);

        if (product && (product.approved === 0 || product.approved === false)) {
            console.log("   SUCCESS: Product is unapproved (pending).");
        } else {
            console.error("   FAILURE: Product is approved or missing.", product);
        }

        // 4. Approve Product
        console.log("4. Approving Product...");
        await request({
            hostname: 'localhost',
            port: 3000,
            path: `/api/products/${productId}/approve`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        }, { approved: true, rejected: false });

        // 5. Check Customer View (should be approved)
        console.log("5. Checking API again (should be approved)...");
        const productsRes2 = await request({ hostname: 'localhost', port: 3000, path: '/api/products', method: 'GET' });
        const product2 = productsRes2.body.find(p => p.id === productId);

        if (product2 && (product2.approved === 1 || product2.approved === true)) {
            console.log("   SUCCESS: Product is approved.");
        } else {
            console.error("   FAILURE: Product is not approved.", product2);
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

verify();
