require("dotenv").config();
const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");

const db = new sqlite3.Database(process.env.DATABASE);

// Middleware för autentisering
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not authorized" });

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// Skapa beställning (kund, ingen auth)
router.post("/orders", (req, res) => {
  const { customer_name, base, flavor, topping, size, note } = req.body;

  if (!customer_name || !base || !flavor || !size) {
    return res.status(400).json({ message: "Fält saknas" });
  }

  const sql = `INSERT INTO orders (customer_name, base, flavor, topping, size, note)
               VALUES (?, ?, ?, ?, ?, ?)`;

  db.run(sql, [customer_name, base, flavor, topping, size, note], function (err) {
    if (err) return res.status(500).json({ message: "Fel vid beställning" });

    res.status(201).json({ message: "Beställning skapad", order_id: this.lastID });
  });
});

// Hämta aktiva beställningar (admin)
router.get("/orders", authenticateToken, (req, res) => {
  db.all("SELECT * FROM orders WHERE status = 'active' ORDER BY created ASC", (err, rows) => {
    if (err) return res.status(500).json({ message: "Fel vid hämtning" });
    res.json(rows);
  });
});

// Markera beställning som klar (admin)
router.put("/orders/:id", authenticateToken, (req, res) => {
  const id = req.params.id;

  db.run("UPDATE orders SET status = 'done' WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ message: "Fel vid uppdatering" });

    if (this.changes === 0) {
      return res.status(404).json({ message: "Beställning hittades inte" });
    }

    res.json({ message: "Beställning markerad som klar" });
  });
});

// Hämta historik (slutförda beställningar)
router.get("/orders/history", authenticateToken, (req, res) => {
  db.all("SELECT * FROM orders WHERE status = 'done' ORDER BY created DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "Fel vid hämtning av historik" });
    res.json(rows);
  });
});

module.exports = router;
