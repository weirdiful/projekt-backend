require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(process.env.DATABASE);

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS users");
  db.run("DROP TABLE IF EXISTS orders");

  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      base TEXT NOT NULL,
      flavor TEXT NOT NULL,
      topping TEXT,
      size TEXT NOT NULL,
      note TEXT,
      created DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    )
  `);

  console.log("Databasen är skapad.");
});

const bcrypt = require("bcrypt");

bcrypt.hash("admin123", 10, (err, hashedPassword) => {
  if (err) {
    console.error("Fel vid hashning:", err);
    return;
  }

  db.run(`
    INSERT INTO users (username, password)
    VALUES (?, ?)
  `, ["admin", hashedPassword], (err) => {
    if (err) {
      console.error("Kunde inte skapa adminkonto:", err);
    } else {
      console.log("Adminkonto skapat: admin / admin123");
    }
  });
});
