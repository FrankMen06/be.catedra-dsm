const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase.service");

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Token no proporcionado",
            });
        }

        const token = authHeader.split(" ")[1];

        const revokedDoc = await db.collection("revokedTokens").doc(token).get();

        if (revokedDoc.exists) {
            return res.status(401).json({
                message: "Sesión expirada o cerrada. Inicia sesión nuevamente.",
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
            if (error) {
                return res.status(403).json({
                    message: "Token inválido o expirado",
                });
            }

            req.user = user;
            req.token = token;
            next();
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error autenticando token",
        });
    }
};

module.exports = authenticateToken;
