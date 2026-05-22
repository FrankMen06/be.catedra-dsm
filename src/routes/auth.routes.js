const express = require("express");
const { registerUser, loginUser } = require("../services/auth.service");
const { loginWithSocialProvider } = require("../services/socialAuth.service");

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

module.exports = router;
