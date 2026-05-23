const express = require("express");
const { registerUser, loginUser } = require("../services/auth.service");
const { loginWithSocialProvider } = require("../services/socialAuth.service");
const { db } = require("../config/firebase.service");
const authenticateToken = require("../middlewares/authenticateToken");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const result = await registerUser(req.body);
        return res.status(201).json(result);
    } catch (error) {
        console.error(error);
        return res.status(error.statusCode || 500).json({
            message: error.message || "Error interno del servidor",
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const result = await loginUser(req.body);
        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(error.statusCode || 500).json({
            message: error.message || "Error interno del servidor",
        });
    }
});

router.post("/social", async (req, res) => {
    try {
        const result = await loginWithSocialProvider(req.body);
        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(error.statusCode || 500).json({
            message: error.message || "Error interno del servidor",
        });
    }
});

router.post("/logout", authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Token no proporcionado",
            });
        }

        const token = authHeader.split(" ")[1];

        await db.collection("revokedTokens").doc(token).set({
            token,
            uid: req.user.uid,
            revokedAt: new Date().toISOString(),
        });

        return res.json({
            message: "Sesión cerrada correctamente",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error cerrando sesión",
        });
    }
});

module.exports = router;
