import express from "express";
import cors from "cors";
import { db } from "./db.js";

console.log("Starting server...");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/products", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM products");
  res.json(rows);
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});