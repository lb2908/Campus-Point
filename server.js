const express = require("express");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send(`
    <h1>ClearAssign</h1>
    <p>Server läuft. Verbindung erfolgreich!</p>
  `);
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});