const express = require("express");
const { db } = require("../config/firebase.service");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.get("/me", authenticateToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                message: "Usuario no encontrado",
            });
        }

        const userData = userDoc.data();

        return res.json({
            uid: userDoc.id,
            name: userData.name,
            email: userData.email,
            photoURL: userData.photoURL || null,
            provider: userData.provider,
            providerId: userData.providerId || null,
            role: userData.role || "user",
            createdAt: userData.createdAt,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error obteniendo perfil",
        });
    }
});

router.put("/me", authenticateToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, photoURL } = req.body;

        const updateData = {};

        if (name) updateData.name = name;
        if (photoURL !== undefined) updateData.photoURL = photoURL;

        await db.collection("users").doc(uid).update(updateData);

        const updatedDoc = await db.collection("users").doc(uid).get();
        const userData = updatedDoc.data();

        return res.json({
            uid: updatedDoc.id,
            name: userData.name,
            email: userData.email,
            photoURL: userData.photoURL || null,
            provider: userData.provider,
            providerId: userData.providerId || null,
            role: userData.role || "user",
            createdAt: userData.createdAt,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error actualizando perfil",
        });
    }
});

module.exports = router;
