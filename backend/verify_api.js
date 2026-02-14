const fetch = require('node-fetch');

async function verifyAPI() {
    try {
        const response = await fetch('http://localhost:5000/api/bookings?role=HELPER');
        const data = await response.json();
        console.log("API Response Sample:", JSON.stringify(data[0], null, 2));

        // Check if essential fields are present in the new format
        const requiredFields = ['id', 'service', 'date', 'status', 'price', 'location'];
        const sample = data[0];
        if (sample) {
            requiredFields.forEach(field => {
                if (field in sample) {
                    console.log(`✅ Field ${field} is present`);
                } else {
                    console.error(`❌ Field ${field} is MISSING`);
                }
            });
        } else {
            console.log("No bookings found to verify format.");
        }
    } catch (error) {
        console.error("Verification failed:", error.message);
    }
}

verifyAPI();
