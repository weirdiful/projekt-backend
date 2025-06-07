require("dotenv").config();
const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = new sqlite3.Database(process.env.DATABASE);

// Registrering
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Invalid input, send username and password" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users(username, password) VALUES(?, ?)`;
        db.run(sql, [username, hashedPassword], (err) => {
            if (err) {
                return res.status(400).json({ message: "Error creating user" });
            }
            res.status(201).json({ message: "User created" });
        });

    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Inloggning
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Invalid input, send username and password" });
        }

        const sql = `SELECT * FROM users WHERE username=?`;
        db.get(sql, [username], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Error authenticating" });
            } else if (!row) {
                return res.status(401).json({ message: "Incorrect username/password" });
            }

            const passwordMatch = await bcrypt.compare(password, row.password);

            if (!passwordMatch) {
                return res.status(401).json({ message: "Incorrect username/password" });
            }

            const payload = { username: username };
            const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

            res.status(200).json({
                message: "User logged in!",
                token: token
            });
        });

    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
