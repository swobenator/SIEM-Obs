import express from "express";
import { pool } from "./database.js"

const app = express();
const PORT = 3000;

interface LogEvent {
    id: string,
    timestamp: Date,
    level: "INFO" | "ERROR" | "ALERT",
    message: string;
}

let event: LogEvent = { 
    id: "123",
    timestamp: new Date(),
    level: "ERROR",
    message: "Database connection failed"
 };


app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ status: event.message });
});

app.get("/api/health", async (_req, res) => {
    try {
        const result = await pool.query("SELECT NOW()")

        res.json({
            status: "ok",
            databaseTime: result.rows[0].now,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
             status: "error",
             message: "Database connection failed", 
            });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})