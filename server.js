const express = require("express")
const mysql = require("mysql2/promise")
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")

const app = express()
app.use(bodyParser.json())

async function getDBConnection() {
    return await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "mydbd",
    })
}

app.get("/", (req, res) => {
    res.send(`
    <h1>Ling Gang Goo API</h1>
    <p>All data skickas och tas emot i JSON-format.</p>
    <ul>
      <li>GET /users - Hämtar alla användare</li>
      <li>GET /users/:id - Hämtar en användare med ID</li>
      <li>POST /users - Skapar ny användare (JSON: { "name": "Namn", "password": "lösenord" })</li>
      <li>PUT /users/:id - Uppdaterar användare med ID (JSON: { "name": "nyttNamn" })</li>
      <li>POST /login - Loggar in användare (JSON: { "name": "Namn", "password": "lösenord" })</li>
    </ul>
  `)
})

app.get("/users", async (req, res) => {
    const db = await getDBConnection()
    const [rows] = await db.execute("SELECT id, name FROM users")
    res.json(rows)
})

app.get("/users/:id", async (req, res) => {
    const db = await getDBConnection()
    const [rows] = await db.execute("SELECT id, name FROM users WHERE id = ?", [req.params.id])

    if (rows.length === 0) {
        return res.status(404).json({ error: "Användare ej hittad" })
    }

    res.json(rows[0])
})

app.post("/users", async (req, res) => {
    const { name, password } = req.body
    if (!name || !password) {
        return res.status(400).json({ error: "Name och password krävs" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const db = await getDBConnection()
    const [result] = await db.execute(
        "INSERT INTO users (name, password) VALUES (?, ?)",
        [name, hashedPassword]
    )

    res.status(201).json({ id: result.insertId, name })
})

app.put("/users/:id", async (req, res) => {
    const { name } = req.body
    if (!name) {
        return res.status(400).json({ error: "Name krävs" })
    }

    const db = await getDBConnection()
    const [result] = await db.execute(
        "UPDATE users SET name = ? WHERE id = ?",
        [name, req.params.id]
    )

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Användare ej hittad" })
    }

    res.json({ id: req.params.id, name })
})

app.post("/login", async (req, res) => {
    const { name, password } = req.body
    if (!name || !password) {
        return res.status(400).json({ error: "Name och password krävs" })
    }

    const db = await getDBConnection()
    const [rows] = await db.execute("SELECT * FROM users WHERE name = ?", [name])
    if (rows.length === 0) {
        return res.status(401).json({ error: "Fel namn eller lösenord" })
    }

    const user = rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
        return res.status(401).json({ error: "Fel namn eller lösenord" })
    }

    res.status(200).json({ id: user.id, name: user.name })
})

const port = 3000
app.listen(port, () => {
    console.log(`Bing Bang Bong Gong--> http://localhost:${port}`)
})
