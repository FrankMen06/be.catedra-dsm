//const admin = require("firebase-admin");
//
//async function authenticateToken(req, res, next) {
//    try {
//        const authHeader = req.headers.authorization;
//
//        console.log("AUTH HEADER:", authHeader);
//
//        if (!authHeader) {
//            return res.status(401).json({ message: "No token provided" });
//        }
//
//        const token = authHeader.split(" ")[1];
//
//        if (!token) {
//            return res.status(401).json({ message: "Token mal formado" });
//        }
//
//        // 🔥 VERIFICACIÓN CORRECTA CON FIREBASE
//        const decoded = await admin.auth().verifyIdToken(token);
//
//        req.user = decoded;
//
//        next();
//
//    } catch (error) {
//        console.log("FIREBASE AUTH ERROR:", error.message);
//
//        return res.status(403).json({
//            message: "Token inválido o expirado"
//        });
//    }
//}
//
//module.exports = authenticateToken;
const admin = require("firebase-admin");

// Asegúrate de inicializar Firebase Admin en otro archivo (firebase.service.js)
const { auth } = require("../config/firebase.service");

function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        console.log("AUTH HEADER:", authHeader);

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        auth.verifyIdToken(token)
            .then((decoded) => {
                req.user = decoded; // aquí viene uid, email, name, etc.
                next();
            })
            .catch((error) => {
                console.log("FIREBASE TOKEN ERROR:", error.message);
                return res.status(403).json({ message: "Invalid Firebase token" });
            });

    } catch (error) {
        console.log("AUTH ERROR:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = authenticateToken;