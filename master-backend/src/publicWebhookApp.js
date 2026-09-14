const dotenv = require("dotenv");
dotenv.config({ override: true });
require("./config/env");

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const corsOptions = require("./config/corsOptions");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const resolvePublicTenant = require("./middleware/resolvePublicTenant");
const aiCallingRoutes = require("./routes/aiCallingRoutes");

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors(corsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "AI calling webhook backend is healthy" });
});

app.get("/api/ai-calling/vobiz/health", (req, res) => {
  res.json({ success: true, message: "AI calling webhook backend is healthy" });
});

app.use("/api/ai-calling/vobiz", resolvePublicTenant, aiCallingRoutes.publicRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
