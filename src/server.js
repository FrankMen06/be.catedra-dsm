require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { db } = require("./config/firebase.service");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const eventsRoutes = require("./routes/events.routes");
const commentsRoutes = require("./routes/comments.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "API DSM corriendo correctamente",
    });
});

app.get("/health/firebase", async (req, res) => {
    try {
        const collections = await db.listCollections();

        const testData = {
            status: "ok",
            projectIdFromEnv: process.env.FIREBASE_PROJECT_ID,
            clientEmailFromEnv: process.env.FIREBASE_CLIENT_EMAIL,
            checkedAt: new Date().toISOString(),
        };

        await db.collection("health").doc("test").set(testData);

        res.json({
            message: "Firebase conectado correctamente",
            projectIdFromEnv: process.env.FIREBASE_PROJECT_ID,
            clientEmailFromEnv: process.env.FIREBASE_CLIENT_EMAIL,
            collections: collections.map((collection) => collection.id),
            testData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error conectando con Firebase",
            error: error.message,
        });
    }
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/events", eventsRoutes);
app.use("/comments", commentsRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/admin", adminRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`API DSM escuchando en puerto ${port}`);
});
