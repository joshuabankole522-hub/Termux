const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// In-memory data store (updates remain live while server runs)
let siteContent = {
  announcement: "Welcome to FUNAAB Hub!",
  services: ["Errand Delivery", "Site Coordination", "Car Reservation"]
};

// Admin Credentials
const ADMIN_USER = {
  username: "admin",
  // Password: funaab123
  passwordHash: "$2a$10$7R0O1m8yZ8pX0K9k3f9/u.5A1YQ5yZ8pX0K9k3f9/u.5A1YQ5yZ8"
};

const JWT_SECRET = "funaab_hub_secret_key_2026";

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or Expired Token" });
    }
    req.user = user;
    next();
  });
}

// 1. PUBLIC: Fetch main website content
app.get('/api/content', (req, res) => {
  res.json(siteContent);
});

// 2. ADMIN: Login and receive JWT
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USER.username) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const validPassword = await bcrypt.compare(password, ADMIN_USER.passwordHash);
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username: ADMIN_USER.username, role: "admin" }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// 3. ADMIN: Protected route to update main website content
app.post('/api/admin/update-content', authenticateToken, (req, res) => {
  const { announcement, services } = req.body;

  if (announcement !== undefined) siteContent.announcement = announcement;
  if (services !== undefined) siteContent.services = services;

  res.json({ message: "Main website updated successfully!", content: siteContent });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
