const express = require("express");
const { db } = require("../config/firebase.service");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

// CREAR RATING
router.post("/", authenticateToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const { eventId, rating, comment } = req.body;

        const newRating = {
            eventId,
            userId: uid,
            rating,
            comment,
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection("event_ratings").add(newRating);

        return res.json({
            id: docRef.id,
            ...newRating,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error creando rating",
        });
    }
});

// OBTENER RATING POR EVENTO
router.get("/:eventId", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        const snapshot = await db
            .collection("event_ratings")
            .where("eventId", "==", eventId)
            .get();

        const ratings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.json(ratings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo ratings",
        });
    }
});

module.exports = router;