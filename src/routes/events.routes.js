const express = require("express");
const { db } = require("../config/firebase.service");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
    try {
        const snap = await db
            .collection("events")
            .orderBy("createdAt", "desc")
            .get();

        const events = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.json(events);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo eventos",
        });
    }
});

router.get("/upcoming", authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];

        const snap = await db
            .collection("events")
            .where("date", ">=", today)
            .orderBy("date", "asc")
            .get();

        const events = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.json(events);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo próximos eventos",
        });
    }
});

router.get("/past", authenticateToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];

        const snap = await db
            .collection("events")
            .where("date", "<", today)
            .orderBy("date", "desc")
            .get();

        const events = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.json(events);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo eventos pasados",
        });
    }
});

router.get("/search", authenticateToken, async (req, res) => {
    try {
        const q = (req.query.q || "").toString().toLowerCase();

        if (!q) {
            return res.status(400).json({
                message: "Parámetro q requerido",
            });
        }

        const snap = await db.collection("events").get();

        const events = snap.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter((event) => {
                const title = (event.title || "").toLowerCase();
                const description = (event.description || "").toLowerCase();
                const location = (event.location || "").toLowerCase();

                return (
                    title.includes(q) ||
                    description.includes(q) ||
                    location.includes(q)
                );
            });

        return res.json(events);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error buscando eventos",
        });
    }
});

router.get("/creator/me", authenticateToken, async (req, res) => {
    try {
        const snap = await db
            .collection("events")
            .where("creatorUid", "==", req.user.uid)
            .orderBy("createdAt", "desc")
            .get();

        const events = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.json(events);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo mis eventos",
        });
    }
});

router.get("/:id/share", authenticateToken, async (req, res) => {
    try {
        const eventDoc = await db.collection("events").doc(req.params.id).get();

        if (!eventDoc.exists) {
            return res.status(404).json({
                message: "Evento no encontrado",
            });
        }

        const event = eventDoc.data();
        const baseUrl = process.env.BASE_URL_PUBLIC || "http://localhost:3000";
        const shareUrl = `${baseUrl}/events/${req.params.id}`;

        return res.json({
            title: event.title,
            shareUrl,
            socialText: `Te comparto este evento: ${event.title}. Fecha: ${event.date}, hora: ${event.time}. Ubicación: ${event.location}. ${shareUrl}`,
            emailSubject: `Invitación al evento: ${event.title}`,
            emailBody: `Hola, te comparto este evento:\n\n${event.title}\nFecha: ${event.date}\nHora: ${event.time}\nUbicación: ${event.location}\nDescripción: ${event.description}\n\nEnlace: ${shareUrl}`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error generando información para compartir",
        });
    }
});

router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const eventDoc = await db.collection("events").doc(req.params.id).get();

        if (!eventDoc.exists) {
            return res.status(404).json({
                message: "Evento no encontrado",
            });
        }

        return res.json({
            id: eventDoc.id,
            ...eventDoc.data(),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo evento",
        });
    }
});

router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, date, time, location, description } = req.body;

        if (!title || !date || !time || !location || !description) {
            return res.status(400).json({
                message: "Faltan campos obligatorios",
            });
        }

        const userDoc = await db.collection("users").doc(req.user.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                message: "Usuario creador no encontrado",
            });
        }

        const userData = userDoc.data();

        const newEvent = {
            title,
            date,
            time,
            location,
            description,
            creatorUid: req.user.uid,
            creatorName: userData.name,
            createdAt: new Date().toISOString(),
        };

        const eventRef = await db.collection("events").add(newEvent);

        return res.status(201).json({
            id: eventRef.id,
            ...newEvent,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error creando evento",
        });
    }
});

router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const { title, date, time, location, description } = req.body;

        const eventDoc = await db.collection("events").doc(eventId).get();

        if (!eventDoc.exists) {
            return res.status(404).json({
                message: "Evento no encontrado",
            });
        }

        const eventData = eventDoc.data();

        const userDoc = await db.collection("users").doc(req.user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        const isOwner = eventData.creatorUid === req.user.uid;
        const isAdmin = userData?.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "Solo el creador o admin puede editar este evento",
            });
        }

        const updateData = {};

        if (title) updateData.title = title;
        if (date) updateData.date = date;
        if (time) updateData.time = time;
        if (location) updateData.location = location;
        if (description) updateData.description = description;

        await db.collection("events").doc(eventId).update(updateData);

        const updatedDoc = await db.collection("events").doc(eventId).get();

        return res.json({
            id: updatedDoc.id,
            ...updatedDoc.data(),
            message: "Evento actualizado correctamente",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error actualizando evento",
        });
    }
});

router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;

        const eventDoc = await db.collection("events").doc(eventId).get();

        if (!eventDoc.exists) {
            return res.status(404).json({
                message: "Evento no encontrado",
            });
        }

        const eventData = eventDoc.data();

        const userDoc = await db.collection("users").doc(req.user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        const isOwner = eventData.creatorUid === req.user.uid;
        const isAdmin = userData?.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "Solo el creador o admin puede eliminar este evento",
            });
        }

        const commentsSnap = await db
            .collection("events")
            .doc(eventId)
            .collection("comments")
            .get();

        const attendeesSnap = await db
            .collection("events")
            .doc(eventId)
            .collection("attendees")
            .get();

        const batch = db.batch();

        commentsSnap.forEach((commentDoc) => {
            batch.delete(commentDoc.ref);
        });

        attendeesSnap.forEach((attendeeDoc) => {
            batch.delete(attendeeDoc.ref);
        });

        batch.delete(db.collection("events").doc(eventId));

        await batch.commit();

        return res.json({
            message: "Evento eliminado correctamente",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error eliminando evento",
        });
    }
});

module.exports = router;
