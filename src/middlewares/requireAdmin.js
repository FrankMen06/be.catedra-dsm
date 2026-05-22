const { db } = require("../config/firebase.service");

async function requireAdmin(req, res, next) {
    try {
        const uid = req.user?.uid;

        if (!uid) {
            return res.status(403).json({
                message: "Acceso denegado",
            });
        }

        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                message: "Usuario no encontrado",
            });
        }

        const userData = userDoc.data();

        if (userData.role !== "admin") {
            return res.status(403).json({
                message: "Requiere permiso de administrador",
            });
        }

        return next();
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error validando permisos de administrador",
        });
    }
}

module.exports = requireAdmin;
