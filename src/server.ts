import express from "express";
import { pool } from "./database.js"
import { eventSchema } from "./schemas/event.js"

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

app.get("/api/events", async(req, res) =>{
    try{
        const result = await pool.query(`
            select * 
            from events 
            order by timestamp desc
            limit 50
            `);
        return res.status(200).json(result.rows);
    }catch(error){
        console.error(error);

        return res.status(500).json({
            error: "Failed to retreive events"
        });
    }
})

app.post("/api/events", async(req, res) =>{
    const result = eventSchema.safeParse(req.body);

    if(!result.success){
        return res.status(400).json({
            error: "Invalid event",
            details: result.error.flatten()
        });
    }

    const { source, level, message, metadata} = result.data;

    try{
        const dbResult = await pool.query(
            `
            insert into events (source, level, message, metadata)
            values($1, $2, $3, $4)
            returning *
            `,
            [source, level, message, metadata]
        );

        return res.status(201).json(dbResult.rows[0]);
    }catch(error){
        console.error(error);

        return res.status(500).json({
            error: "Failed to store event"
        });
    }
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})