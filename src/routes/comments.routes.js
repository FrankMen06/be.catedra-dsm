const express = require("express");
const { db } = require("../config/firebase.service");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.post("/:eventId", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { comment, rating } = req.body;

        if (!comment) {
            return res.status(400).json({
                message: "El comentario es obligatorio",
            });
        }

        const eventDoc = await db.collection("events").doc(eventId).get();

        if (!eventDoc.exists) {
            return res.status(404).json({
                message: "Evento no encontrado",
            });
        }

        const userDoc = await db.collection("users").doc(req.user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        const newComment = {
            uid: req.user.uid,
            userName: userData?.name || "Usuario",
            comment,
            rating: rating || null,
            createdAt: new Date().toISOString(),
        };

        const commentRef = await db
            .collection("events")
            .doc(eventId)
            .collection("comments")
            .add(newComment);

        return res.status(201).json({
            id: commentRef.id,
            ...newComment,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error creando comentario",
        });
    }
});

router.get("/:eventId", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        const snap = await db
            .collection("events")
            .doc(eventId)
            .collection("comments")
            .orderBy("createdAt", "desc")
            .get();

        const comments = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.json(comments);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo comentarios",
        });
    }
});

router.put("/:eventId/:commentId", authenticateToken, async (req, res) => {
    try {
        const { eventId, commentId } = req.params;
        const { comment, rating } = req.body;

        const commentRef = db
            .collection("events")
            .doc(eventId)
            .collection("comments")
            .doc(commentId);

        const commentDoc = await commentRef.get();

        if (!commentDoc.exists) {
            return res.status(404).json({
                message: "Comentario no encontrado",
            });
        }

        const commentData = commentDoc.data();

        const userDoc = await db.collection("users").doc(req.user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        const isOwner = commentData.uid === req.user.uid;
        const isAdmin = userData?.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "Solo el autor o admin puede editar este comentario",
            });
        }

        const updateData = {
            editedAt: new Date().toISOString(),
        };

        if (comment) updateData.comment = comment;
        if (rating !== undefined) updateData.rating = rating;

        await commentRef.update(updateData);

        const updatedDoc = await commentRef.get();

        return res.json({
            id: updatedDoc.id,
            ...updatedDoc.data(),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error editando comentario",
        });
    }
});

router.delete("/:eventId/:commentId", authenticateToken, async (req, res) => {
    try {
        const { eventId, commentId } = req.params;

        const commentRef = db
            .collection("events")
            .doc(eventId)
            .collection("comments")
            .doc(commentId);

        const commentDoc = await commentRef.get();

        if (!commentDoc.exists) {
            return res.status(404).json({
                message: "Comentario no encontrado",
            });
        }

        const commentData = commentDoc.data();

        const userDoc = await db.collection("users").doc(req.user.uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        const isOwner = commentData.uid === req.user.uid;
        const isAdmin = userData?.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "Solo el autor o admin puede eliminar este comentario",
            });
        }

        await commentRef.delete();

        return res.json({
            message: "Comentario eliminado correctamente",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error eliminando comentario",
        });
    }
});

router.get("/:eventId/rating", authenticateToken, async (req, res) => {
    try {
        const { eventId } = req.params;

        const snap = await db
            .collection("events")
            .doc(eventId)
            .collection("comments")
            .get();

        const ratings = snap.docs
            .map((doc) => doc.data().rating)
            .filter((rating) => rating !== null && rating !== undefined);

        if (ratings.length === 0) {
            return res.json({
                average: 0,
                count: 0,
            });
        }

        const sum = ratings.reduce((total, rating) => total + Number(rating), 0);

        return res.json({
            average: sum / ratings.length,
            count: ratings.length,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error calculando rating",
        });
    }
});

module.exports = router;
