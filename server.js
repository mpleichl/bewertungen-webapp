const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Statische Dateien aus dem 'public'-Ordner bereitstellen
app.use(express.static(path.join(__dirname, "public")));

// Datenbank verbinden oder erstellen
const db = new sqlite3.Database("./db.sqlite", (err) => {
    if (err) {
        console.error("Fehler beim Öffnen der Datenbank:", err.message);
    } else {
        console.log("💾 Verbunden mit SQLite-Datenbank.");
    }
});

// Tabelle anlegen, falls nicht vorhanden
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

// GET: Bewertungen abrufen
app.get("/api/bewertungen", (req, res) => {
    db.all("SELECT * FROM bewertungen ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
            console.error("Fehler beim SELECT:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST: Neue Bewertung speichern
app.post("/api/bewertungen", (req, res) => {
    console.log("📨 POST erhalten:", req.body);

    const { name, kommentar, preis_leistung, optik, komfort } = req.body;

    if (!name || !kommentar) {
        console.warn("⚠️ Ungültige Eingabe:", req.body);
        return res.status(400).json({ error: "Name und Kommentar sind erforderlich." });
    }

    db.run(
        `INSERT INTO bewertungen (name, kommentar, preis_leistung, optik, komfort) VALUES (?, ?, ?, ?, ?)`,
        [name, kommentar, preis_leistung, optik, komfort],
        function (err) {
            if (err) {
                console.error("❌ Fehler beim INSERT:", err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log("✅ Bewertung gespeichert mit ID:", this.lastID);
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Optional: Fallback für andere Routen → index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Server starten
app.listen(port, () => {
    console.log(`🚀 Server läuft auf http://localhost:${port}`);
});
