const express = require("express");
const { db } = require("../config/firebase.service");
const authenticateToken = require("../middlewares/authenticateToken");
const requireAdmin = require("../middlewares/requireAdmin");

const router = express.Router();

router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const snap = await db.collection("users").get();

        const users = snap.docs.map((doc) => {
            const data = doc.data();

            return {
                uid: doc.id,
                name: data.name,
                email: data.email,
                photoURL: data.photoURL || null,
                provider: data.provider,
                providerId: data.providerId || null,
                role: data.role || "user",
                createdAt: data.createdAt,
            };
        });

        return res.json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo usuarios",
        });
    }
});

router.post("/users/:uid/make-admin", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { uid } = req.params;

        await db.collection("users").doc(uid).update({
            role: "admin",
        });

        return res.json({
            message: "Usuario promovido a admin correctamente",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error promoviendo usuario a admin",
        });
    }
});

module.exports = router;
