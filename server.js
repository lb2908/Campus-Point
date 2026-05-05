const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Route für Startseite
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "startseite.html"));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});