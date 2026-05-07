const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Bilder-Ordner freigeben
app.use("/bilder", express.static(path.join(__dirname, "bilder")));

// Frontend-Ordner freigeben
app.use(express.static(path.join(__dirname, "frontend")));

// Startseite
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "startseite.html"));
});

// Studiengang-Seite
app.get("/studiengang", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "studiengang.html"));
});

// Verwaltungsinformatik-Seite
app.get("/verwaltungsinformatik", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "verwaltungsinformatik.html"));
});

// EJ 2026
app.get("/ej_2026", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "ej_2026.html"));
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});