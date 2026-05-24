const admin = require("firebase-admin");

function initializeFirebase() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const {
        FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY,
    } = process.env;

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw new Error(
            "Faltan variables de entorno de Firebase."
        );
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}

initializeFirebase();

// 👇 AGREGA ESTO
const auth = admin.auth();
const db = admin.firestore();

module.exports = {
    admin,
    auth,
    db,
};