const express = require("express");
const { db } = require("../config/firebase.service");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.get("/my-history", authenticateToken, async (req, res) => {
    try {
        const eventsSnap = await db.collection("events").get();

        const history = [];

        for (const eventDoc of eventsSnap.docs) {
            const attendeeDoc = await db
                .collection("events")
                .doc(eventDoc.id)
                .collection("attendees")
                .doc(req.user.uid)
                .get();

            if (attendeeDoc.exists) {
                history.push({
                    eventId: eventDoc.id,
                    ...eventDoc.data(),
                    attendance: attendeeDoc.data(),
                });
            }
        }

        return res.json(history);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo historial de asistencia",
        });
    }
});

router.post("/:eventId/confirm", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        const eventDoc = await db.collection("events").doc(eventId).get();

        if (!eventDoc.exists) {
            return res.status(404).json({
                message: "Evento no encontrado",
            });
        }

        const userDoc = await db.collection("users").doc(req.user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        await db
            .collection("events")
            .doc(eventId)
            .collection("attendees")
            .doc(req.user.uid)
            .set({
                uid: req.user.uid,
                name: userData?.name || "Usuario",
                confirmed: true,
                updatedAt: new Date().toISOString(),
            });

        return res.json({
            message: "Asistencia confirmada correctamente",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error confirmando asistencia",
        });
    }
});

router.post("/:eventId/cancel", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        await db
            .collection("events")
            .doc(eventId)
            .collection("attendees")
            .doc(req.user.uid)
            .delete();

        return res.json({
            message: "Asistencia cancelada correctamente",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error cancelando asistencia",
        });
    }
});

router.get("/:eventId/status", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        const attendeeDoc = await db
            .collection("events")
            .doc(eventId)
            .collection("attendees")
            .doc(req.user.uid)
            .get();

        if (!attendeeDoc.exists) {
            return res.json({
                confirmed: false,
            });
        }

        return res.json({
            confirmed: true,
            ...attendeeDoc.data(),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error consultando estado de asistencia",
        });
    }
});

router.get("/:eventId/attendees", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        const snap = await db
            .collection("events")
            .doc(eventId)
            .collection("attendees")
            .get();

        const attendees = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.json(attendees);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo asistentes",
        });
    }
});

router.get("/:eventId/count", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        const snap = await db
            .collection("events")
            .doc(eventId)
            .collection("attendees")
            .get();

        return res.json({
            count: snap.size,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo cantidad de asistentes",
        });
    }
});

module.exports = router;
