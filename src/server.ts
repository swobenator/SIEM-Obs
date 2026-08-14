import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (_req, res) => {
    res.json({status: "ok"});
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})