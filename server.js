const express = require("express");
const app = express();
const mysql = require("mysql2/promise");

// parse application/json, för att hantera att man POSTar med JSON
const bodyParser = require("body-parser");

// Inställningar av servern.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function getDBConnection() {
  // Här skapas ett databaskopplings-objekt med inställningar för att ansluta till servern och databasen.
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "users",
  });
}

app.get("/", (req, res) => {
  console.log("Root route accessed");
  res.send(`
    <h1>API Dokumentation</h1>
    <ul>
      <li>GET /users - Hämtar alla användare</li>
      <li>GET /users/:id - Hämtar en användare baserat på ID</li>
      <li>POST /users - Skapar en ny användare</li>
    </ul>
  `);
});

// Hämta alla användare
app.get("/users", async (req, res) => {
  try {
    const connection = await getDBConnection();
    const [rows] = await connection.execute("SELECT * FROM users");
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: "Något gick fel" });
  }
});

// Hämta en användare baserat på ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await getDBConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Användare hittades inte" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Något gick fel" });
  }
});

/*
  app.post() hanterar en http request med POST-metoden.
*/
// Skapa en ny användare
app.post("/users", async (req, res) => {
  const { username, password, name, email } = req.body;
  // Kontrollera att alla nödvändiga fält finns i förfrågan
  if (!username || !password || !name || !email) {
    return res.status(400).json({
      error: "Alla fält (username, password, name, email) måste anges",
    });
  }

  try {
    const connection = await getDBConnection();
    const [result] = await connection.execute(
      "INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)",
      [username, password, name, email]
    );
    res.status(201).json({ id: result.insertId, username, name, email });
  } catch (error) {
    console.error("Error inserting user:", error);
    res.status(500).json({ error: "Något gick fel" });
  }
});

const port = 8000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
