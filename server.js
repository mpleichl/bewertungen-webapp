const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Statische Dateien aus dem 'public'-Verzeichnis bereitstellen
app.use(express.static(path.join(__dirname, "public")));

// DB initialisieren
const db = new sqlite3.Database("./db.sqlite");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS bewertungen (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            kommentar TEXT NOT NULL,
            preis_leistung INTEGER NOT NULL,
            optik INTEGER NOT NULL,
            komfort INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// GET: Alle Bewertungen abrufen
app.get("/api/bewertungen", (req, res) => {
    db.all("SELECT * FROM bewertungen ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST: Neue Bewertung speichern
app.post("/api/bewertungen", (req, res) => {
    const { name, kommentar, preis_leistung, optik, komfort } = req.body;

    if (!name || !kommentar) {
        return res.status(400).json({ error: "Name und Kommentar sind erforderlich." });
    }

    db.run(`
        INSERT INTO bewertungen (name, kommentar, preis_leistung, optik, komfort)
        VALUES (?, ?, ?, ?, ?)
    `, [name, kommentar, preis_leistung, optik, komfort], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

// Server starten
app.listen(port, () => {
    console.log(`🚀 Server läuft auf http://localhost:${port}`);
});
