const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

// Refreshed env to pick up fixed .env.local

const path = require('path');

const fs = require('fs');
const logStream = fs.createWriteStream(path.join(__dirname, 'backend.log'), { flags: 'a' });
console.log = (...args) => { logStream.write(`${new Date().toISOString()} [LOG] ${args.join(' ')}\n`); };
console.error = (...args) => { logStream.write(`${new Date().toISOString()} [ERROR] ${args.join(' ')}\n`); };

// Load environment variables using absolute path
dotenv.config({ path: path.join(__dirname, '../frontend/.env.local') });

const app = express();
const port = process.env.PORT || 5000;

// Initialize Firebase Admin
let fdb;
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: "outhelp-eae53"
        });
    }
    fdb = admin.firestore();
    console.log("Firebase Admin & Firestore initialized");
} catch (e) {
    console.error("Firebase Admin initialization failed:", e.message);
}

// Initialize SQLite and create tables
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) console.error('Database connection error:', err);
    else console.log('Connected to SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        role TEXT,
        subscription_plan_id TEXT DEFAULT 'free',
        subscription_status TEXT DEFAULT 'inactive',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT,
        customer_id TEXT,
        customer_name TEXT,
        helper_id TEXT,
        helper_name TEXT,
        booking_date TEXT,
        status TEXT DEFAULT 'Pending',
        price REAL,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES users(uid),
        FOREIGN KEY(helper_id) REFERENCES users(uid)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS helper_earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        helper_id TEXT,
        customer_id TEXT,
        amount REAL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(booking_id) REFERENCES bookings(id),
        FOREIGN KEY(helper_id) REFERENCES users(uid)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        role TEXT,
        text TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // NEW PAYMENT RECEIPTS TABLE
    db.run(`CREATE TABLE IF NOT EXISTS payment_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        plan_name TEXT,
        amount REAL,
        transaction_id TEXT,
        proof_path TEXT,
        ticket_number TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Setup Multer for Screenshots
const multer = require('multer');
const uploadDir = path.join(__dirname, 'uploads', 'proofs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Initialize Gemini
console.log("Gemini API Key Presence:", !!process.env.VITE_GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");

const MASTER_SERVICES = [
    {
        id: 'cleaning',
        name: 'Deep Home Cleaning',
        category: 'Cleaning',
        basePrice: 499,
        rating: 4.8,
        reviews: 1240,
        description: 'Complete home sanitization including floor scrubbing, dusting, and bathroom cleaning.',
        color: 'bg-blue-100 text-blue-700'
    },
    {
        id: 'plumbing',
        name: 'Expert Plumbing Repair',
        category: 'Repair',
        basePrice: 599,
        rating: 4.7,
        reviews: 850,
        description: 'Fix leaks, unclog drains, or install new fixtures with certified plumbers.',
        color: 'bg-cyan-100 text-cyan-700'
    },
    {
        id: 'electrical',
        name: 'Electrical Maintenance',
        category: 'Repair',
        basePrice: 549,
        rating: 4.9,
        reviews: 920,
        description: 'Safety checks, wiring repairs, and appliance installation by certified electricians.',
        color: 'bg-yellow-100 text-yellow-700'
    },
    {
        id: 'moving',
        name: 'Packers & Movers',
        category: 'Moving',
        basePrice: 4999,
        rating: 4.6,
        reviews: 430,
        description: 'Hassle-free shifting with professional packaging and safe transportation.',
        color: 'bg-orange-100 text-orange-700'
    },
    {
        id: 'painting',
        name: 'Wall Painting',
        category: 'Home Improvement',
        basePrice: 14999,
        rating: 4.5,
        reviews: 210,
        description: 'Refresh your home with premium eco-friendly paints and expert application.',
        color: 'bg-purple-100 text-purple-700'
    },
    {
        id: 'pest',
        name: 'Pest Control',
        category: 'Cleaning',
        basePrice: 899,
        rating: 4.8,
        reviews: 600,
        description: 'Odorless and safe pest control treatments for cockroaches, ants, and termites.',
        color: 'bg-green-100 text-green-700'
    }
];

const SERVICES_CONTEXT = MASTER_SERVICES.map(s =>
    `- ${s.name} (${s.category}): ₹${s.basePrice}. ${s.description}`
).join('\n');

const SYSTEM_INSTRUCTION = `You are the TrustServe AI Agent, an advanced assistant for India's leading home service platform. 

YOUR MISSION:
You are a proactive service concierge. Your goal is to convert user interest into a booking.

KNOWLEDGE BASE (SERVICES):
${SERVICES_CONTEXT}

AGENT FLOW RULES:
1. IMMEDIATE IDENTIFICATION: If a user mentions a problem (e.g., "my sink is broken"), immediately identify the correct service (e.g., Plumbing) and say: "I can help with that! I'll book our Expert Plumbing service for you. What is your location?"
2. SKIP THE SMALL TALK: Be professional but highly efficient.
3. CONSTRAINTS FIRST: Always prioritize getting Location and Date/Time as soon as a service is identified.
4. MULTI-LINGUAL EXPERTISE: Fluently respond in English, Hindi, or Hinglish to match the user.
5. SUMMARY & CLOSING: Once details are collected, summarize exactly: "Service: [Name], Price: ₹[Price], Location: [Loc], Time: [Time]. Proceed?"

TONE: Energetic, intelligent, and premium. ⚡🏠🇮🇳`;

// Utility to clean base64 strings
const cleanBase64 = (str) => {
    if (!str || typeof str !== 'string') return "";
    return str.includes(';base64,') ? str.split(';base64,').pop() : str;
};

// Serve static files from backend (for QR codes)
app.use('/assets', express.static(__dirname));

// Endpoints
app.get('/', (req, res) => {
    res.json({ status: "TrustServe Backend is Online ⚡" });
});

// User Sync & Profile
app.post('/api/users', (req, res) => {
    const { uid, email, display_name, role } = req.body;
    db.run(`INSERT INTO users (uid, email, display_name, role) 
            VALUES (?, ?, ?, ?)
            ON CONFLICT(uid) DO UPDATE SET 
            email = excluded.email, 
            display_name = excluded.display_name,
            role = COALESCE(users.role, excluded.role)`,
        [uid, email, display_name, role],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.get('/api/users/:uid', (req, res) => {
    const { uid } = req.params;
    db.get(`SELECT * FROM users WHERE uid = ?`, [uid], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "User not found" });
        res.json(row);
    });
});

// Razorpay removed 

// Payment Verification & Proof Upload
app.post('/api/verify-payment', upload.single('proof'), (req, res) => {
    const { uid, planId, transactionId, amount, planName } = req.body;
    const proofPath = req.file ? `/uploads/proofs/${req.file.filename}` : null;
    const ticketNumber = 'TS-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    if (!uid || !planId || !transactionId) {
        return res.status(400).json({ error: "Missing required payment details" });
    }

    db.serialize(() => {
        // Record Receipt
        db.run(`INSERT INTO payment_receipts (user_id, plan_name, amount, transaction_id, proof_path, ticket_number) 
                VALUES (?, ?, ?, ?, ?, ?)`,
            [uid, planName, amount, transactionId, proofPath, ticketNumber],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });

                // Upgrade User Immediately (Manual check later)
                db.run(`UPDATE users SET subscription_plan_id = ?, subscription_status = 'active' WHERE uid = ?`,
                    [planId, uid],
                    (updateErr) => {
                        if (updateErr) return res.status(500).json({ error: updateErr.message });

                        res.json({
                            success: true,
                            ticketNumber,
                            date: new Date().toLocaleString()
                        });
                    }
                );
            }
        );
    });
});

// Create Booking
app.post('/api/bookings', (req, res) => {
    const { service, customerId, customerName, date, price, location } = req.body;
    db.run(`INSERT INTO bookings (service_name, customer_id, customer_name, booking_date, price, location) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [service, customerId, customerName, date, price, location],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Update User Subscription
app.patch('/api/users/:uid/upgrade', (req, res) => {
    const { uid } = req.params;
    const { planId, status } = req.body;
    db.run(`UPDATE users SET subscription_plan_id = ?, subscription_status = ? WHERE uid = ?`,
        [planId, status, uid],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Get Bookings
app.get('/api/bookings', (req, res) => {
    const { userId, role } = req.query;

    let query;
    let params = [];

    if (userId) {
        const column = role === 'HELPER' ? 'helper_id' : 'customer_id';
        query = `SELECT 
                    id, 
                    service_name as service, 
                    customer_id as customerId, 
                    customer_name as customerName, 
                    helper_id as helperId, 
                    helper_name as helperName, 
                    booking_date as date, 
                    status, 
                    price, 
                    location, 
                    created_at as createdAt 
                FROM bookings 
                WHERE ${column} = ? OR (status = 'Pending' AND ? = 'HELPER') 
                ORDER BY created_at DESC`;
        params = [userId, role];
    } else {
        query = `SELECT 
                    id, 
                    service_name as service, 
                    customer_id as customerId, 
                    customer_name as customerName, 
                    helper_id as helperId, 
                    helper_name as helperName, 
                    booking_date as date, 
                    status, 
                    price, 
                    location, 
                    created_at as createdAt 
                FROM bookings 
                ORDER BY created_at DESC`;
    }

    console.log(`[GET /api/bookings] userId: ${userId}, role: ${role}`);
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(`[GET /api/bookings] Error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[GET /api/bookings] Returning ${rows.length} rows`);
        res.json(rows);
    });
});

// Update Booking Status & Handle Earnings
app.patch('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { status, helperId, helperName } = req.body;

    db.serialize(() => {
        const updateFields = [];
        const params = [];

        if (status) { updateFields.push("status = ?"); params.push(status); }
        if (helperId) { updateFields.push("helper_id = ?"); params.push(helperId); }
        if (helperName) { updateFields.push("helper_name = ?"); params.push(helperName); }

        params.push(id);

        db.run(`UPDATE bookings SET ${updateFields.join(", ")} WHERE id = ?`, params, function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // If completed, record earning
            if (status === 'Completed') {
                db.get(`SELECT * FROM bookings WHERE id = ?`, [id], (err, booking) => {
                    if (booking && booking.helper_id) {
                        db.run(`INSERT INTO helper_earnings (booking_id, helper_id, customer_id, amount) 
                                VALUES (?, ?, ?, ?)`,
                            [booking.id, booking.helper_id, booking.customer_id, booking.price]);
                    }
                });
            }
            res.json({ success: true });
        });
    });
});

app.get('/api/debug-models', async (req, res) => {
    try {
        const result = await genAI.listModels();
        res.json({ models: result.models.map(m => m.name) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message, history, userId } = req.body;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            systemInstruction: SYSTEM_INSTRUCTION
        });

        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(message);
        const responseText = await result.response.text();

        // Optionally save chat to SQLite here
        if (userId) {
            db.run(`INSERT INTO chat_messages (user_id, role, text) VALUES (?, ?, ?)`, [userId, 'model', responseText]);
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error("Chat Error:", error.message);
        res.status(500).json({ error: "Failed to connect to AI", details: error.message });
    }
});

// Redundant Firestore endpoint removed - using SQL /api/bookings instead

app.post('/api/vision', async (req, res) => {
    const { beforeImage, afterImage } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Analyze these 'Before' and 'After' photos for a home service quality check. Identify work done, rate the improvement 0-100, and give brief reasons.";

        const result = await model.generateContent([
            prompt,
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(beforeImage) } },
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(afterImage) } }
        ]);

        const responseText = await result.response.text();
        res.json({ analysis: responseText });
    } catch (error) {
        console.error("Vision Error:", error);
        res.status(500).json({ error: "Failed to analyze images" });
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
