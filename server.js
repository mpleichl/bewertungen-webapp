const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Statische Dateien aus dem 'public'-Ordner bereitstellen
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL-Verbindung über .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Tabelle erstellen, falls nicht vorhanden
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS bewertungen (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    kommentar TEXT NOT NULL,
    preis_leistung INTEGER NOT NULL,
    optik INTEGER NOT NULL,
    komfort INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

pool.query(createTableQuery)
  .then(() => console.log("📦 Tabelle 'bewertungen' ist bereit"))
  .catch((err) => console.error("❌ Fehler beim Erstellen der Tabelle:", err));

// GET: Alle Bewertungen abrufen
app.get("/api/bewertungen", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bewertungen ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fehler beim SELECT:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST: Neue Bewertung speichern
app.post("/api/bewertungen", async (req, res) => {
  console.log("📨 POST erhalten:", req.body);
  const { name, kommentar, preis_leistung, optik, komfort } = req.body;

  if (!name || !kommentar) {
    console.warn("⚠️ Ungültige Eingabe:", req.body);
    return res.status(400).json({ error: "Name und Kommentar sind erforderlich." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bewertungen (name, kommentar, preis_leistung, optik, komfort)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, kommentar, preis_leistung, optik, komfort]
    );
    console.log("✅ Bewertung gespeichert mit ID:", result.rows[0].id);
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Fehler beim INSERT:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Optional: Fallback für andere Routen → index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Server starten
app.listen(port, () => {
  console.log(`🚀 Server läuft auf http://localhost:${port}`);
});