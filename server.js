const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

// JSON aktivieren
app.use(express.json());

// MongoDB Verbindung
mongoose.connect("mongodb://127.0.0.1:27017/campus_point")
  .then(() => {
    console.log("MongoDB verbunden");
  })
  .catch((error) => {
    console.log("MongoDB Fehler:", error);
  });

// Schema für genehmigte Personen
const genehmigtePersonSchema = new mongoose.Schema({
  vorname: String,
  nachname: String,
  email: String,
  behoerde: String,

  plz: String,
  ort: String,
  behoerdenArt: String,

  studienort: String,
  kurs: String,

  status: String,

  kennung: String,
  hspvEmail: String,

  studiengang: String,
  einstellungsjahrgang: String,
  pfad: String,

  gespeichertAm: {
    type: Date,
    default: Date.now
  }
});

// Model erstellen
const GenehmigtePerson = mongoose.model(
  "GenehmigtePerson",
  genehmigtePersonSchema,
  "verwaltungsinformatik_ej2026"
);

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

// Kurse EJ 2026
app.get("/kurse_ej2026", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "kurse_ej2026.html"));
});

app.get("/mue_kom_ej2026", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "mue_kom_ej2026.html"));
});

app.get("/mue_sta_ej2026", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "mue_sta_ej2026.html"));
});

app.get("/koe_kom_ej2026", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "koe_kom_ej2026.html"));
});

app.get("/koe_sta_ej2026", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "koe_sta_ej2026.html"));
});

// API zum Speichern genehmigter Personen
app.post("/api/genehmigte-person", async (req, res) => {

  try {

    // Letzte gespeicherte Person finden
    const letztePerson = await GenehmigtePerson
      .findOne()
      .sort({ gespeichertAm: -1 });

    let neueKennungNummer = 1;

    // Falls bereits Personen existieren
    if (letztePerson && letztePerson.kennung) {

      const letzteNummer = parseInt(
        letztePerson.kennung.replace("t", "")
      );

      neueKennungNummer = letzteNummer + 1;
    }

    // Kennung generieren
    const kennung =
      "t" + String(neueKennungNummer).padStart(6, "0");

    // Vorname/Nachname formatieren
    const vorname = req.body.vorname
      .trim()
      .toLowerCase();

    const nachname = req.body.nachname
      .trim()
      .toLowerCase();

    // HSPV-Mail generieren
    const hspvEmail =
      `${vorname}.${nachname}@studium.hspv.nrw.de`;

    // Neue Person erstellen
    const neuePerson = new GenehmigtePerson({

      vorname: req.body.vorname,
      nachname: req.body.nachname,
      email: req.body.email,
      behoerde: req.body.behoerde,

      plz: req.body.plz,
      ort: req.body.ort,
      behoerdenArt: req.body.behoerdenArt,

      status: req.body.status,

      kennung: kennung,
      hspvEmail: hspvEmail,

      studiengang: "Verwaltungsinformatik",
      einstellungsjahrgang: "EJ 2026",
      pfad: "Studiengänge > Verwaltungsinformatik > EJ 2026"
    });

    // In MongoDB speichern
    await neuePerson.save();

    // Erfolgreiche Antwort
    res.status(201).json({

      message: "Person erfolgreich gespeichert",

      person: {
        kennung: kennung,
        hspvEmail: hspvEmail,

        plz: req.body.plz,
        ort: req.body.ort,
        behoerdenArt: req.body.behoerdenArt,

        studiengang: "Verwaltungsinformatik",
        einstellungsjahrgang: "EJ 2026",
        pfad: "Studiengänge > Verwaltungsinformatik > EJ 2026"
      }
    });

  } catch (error) {

    // Fehlerbehandlung
    res.status(500).json({

      message: "Fehler beim Speichern",
      error: error.message
    });
  }
});

// Studienort automatisch bestimmen
function studienortBestimmen(plz) {

  const prefix = plz.substring(0, 2);

  // Münster-Bereich
  const muensterBereich = [
    "48",
    "49",
    "58",
    "59",
    "33",
    "34"
  ];

  if (muensterBereich.includes(prefix)) {
    return "Münster";
  }

  // Alles andere → Köln
  return "Köln";
}

// API zur automatischen Kursverteilung
app.post("/api/kursverteilung-generieren", async (req, res) => {

  try {

    const personen = await GenehmigtePerson.find();

    let belegung = {
      muensterKommunal: 0,
      muensterStaatlich: 0,
      koelnKommunal: 0,
      koelnStaatlich: 0
    };

    for (const person of personen) {

      const studienort = studienortBestimmen(
        person.plz || ""
      );

      let kurs = "";

      // Kommunal
      if (person.behoerdenArt === "Kommunal") {

        if (studienort === "Münster") {

          kurs = "Münster - 1. Kurs (Kommunal)";
          belegung.muensterKommunal++;

        } else {

          kurs = "Köln - 1. Kurs (Kommunal)";
          belegung.koelnKommunal++;
        }
      }

      // Staatlich
      if (person.behoerdenArt === "Staatlich") {

        if (studienort === "Münster") {

          kurs = "Münster - 2. Kurs (Staatlich)";
          belegung.muensterStaatlich++;

        } else {

          kurs = "Köln - 2. Kurs (Staatlich)";
          belegung.koelnStaatlich++;
        }
      }

      // Person aktualisieren
      await GenehmigtePerson.updateOne(
        { _id: person._id },
        {
          $set: {
            studienort: studienort,
            kurs: kurs
          }
        }
      );
    }

    // Erfolgreiche Antwort
    res.status(200).json({

      message: "Kursverteilung erfolgreich generiert.",

      belegung: {
        muensterKommunal: belegung.muensterKommunal,
        muensterStaatlich: belegung.muensterStaatlich,
        koelnKommunal: belegung.koelnKommunal,
        koelnStaatlich: belegung.koelnStaatlich
      }
    });

  } catch (error) {

    res.status(500).json({

      message: "Fehler bei der Kursverteilung.",
      error: error.message
    });
  }
});

app.get("/api/kurs-personen", async (req, res) => {
  try {
    const kurs = req.query.kurs;

    const personen = await GenehmigtePerson
      .find({ kurs: kurs })
      .sort({ nachname: 1, vorname: 1 });

    res.status(200).json(personen);

  } catch (error) {
    res.status(500).json({
      message: "Fehler beim Laden der Kursliste",
      error: error.message
    });
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});