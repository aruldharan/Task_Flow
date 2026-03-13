import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Routes ---
app.get("/", (req, res) => {
  res.json({ message: "TaskFlow API is running", status: "ok" });
});
app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
