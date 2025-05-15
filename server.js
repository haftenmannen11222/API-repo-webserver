const express = require("express")
const mysql = require("mysql2/promise")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.json())

// Skapa databasanslutning
async function getDBConnection() {
    return await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",        // byt ut vid behov
        database: "mydbd",   // <-- här är ändringen
    })
}

// Enkel API-dokumentation
app.get("/", (req, res) => {
    res.send(`
    <h1>Users API Dokumentation</h1>
    <ul>
      <li>GET /users - Hämtar alla användare</li>
      <li>GET /users/:id - Hämtar en användare med ID</li>
      <li>POST /users - Skapar ny användare (skicka JSON: { "name": "Namn" })</li>
    </ul>
  `)
})

// Hämta alla användare
app.get("/users", async (req, res) => {
    const db = await getDBConnection()
    const [rows] = await db.execute("SELECT * FROM users")
    res.json(rows)
})

// Hämta en användare med ID
app.get("/users/:id", async (req, res) => {
    const db = await getDBConnection()
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [req.params.id])

    if (rows.length === 0) {
        return res.status(404).json({ error: "Användare ej hittad" })
    }

    res.json(rows[0])
})

// Skapa ny användare
app.post("/users", async (req, res) => {
    const { name } = req.body

    if (!name) {
        return res.status(400).json({ error: "Name saknas" })
    }

    const db = await getDBConnection()
    const [result] = await db.execute("INSERT INTO users (name) VALUES (?)", [name])

    res.status(201).json({ id: result.insertId, name })
})

// Starta server
const port = 3000
app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`)
})
