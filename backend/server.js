
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");

const app = express();

app.use(cors());

app.use(express.json());

connectDB();

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Simon Game Backend Running"
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

