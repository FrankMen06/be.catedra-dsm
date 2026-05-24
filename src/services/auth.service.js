const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase.service");

const JWT_SECRET = process.env.JWT_SECRET || "clave_temporal_desarrollo";

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "7d",
    });
}

async function registerUser({ name, email, password, photoURL }) {
    if (!name || !email || !password) {
        const error = new Error("Faltan campos obligatorios");
        error.statusCode = 400;
        throw error;
    }

    const userSnapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();

    if (!userSnapshot.empty) {
        const error = new Error("El correo ya está registrado");
        error.statusCode = 400;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
        name,
        email,
        photoURL: photoURL || null,
        passwordHash,
        provider: "local",
        providerId: null,
        role: "user",
        createdAt: new Date().toISOString(),
    };

    const userRef = await db.collection("users").add(newUser);

    return {
        uid: userRef.id,
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL,
        provider: newUser.provider,
        providerId: newUser.providerId,
        role: newUser.role,
        message: "Usuario registrado correctamente. Ahora inicia sesión.",
    };
}

async function loginUser({ email, password }) {
    if (!email || !password) {
        const error = new Error("Faltan campos obligatorios");
        error.statusCode = 400;
        throw error;
    }

    const userSnapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();

    if (userSnapshot.empty) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.provider !== "local") {
        const error = new Error("Este usuario debe iniciar sesión con su proveedor social");
        error.statusCode = 401;
        throw error;
    }

    const isValidPassword = await bcrypt.compare(
        password,
        userData.passwordHash || ""
    );

    if (!isValidPassword) {
        const error = new Error("Credenciales inválidas");
        error.statusCode = 401;
        throw error;
    }
    console.log("INPUT PASSWORD:", password);
    console.log("HASH:", userData.passwordHash);
    console.log("MATCH:", await bcrypt.compare(password, userData.passwordHash));
    const token = generateToken({
        uid: userDoc.id,
        email: userData.email,
        provider: userData.provider,
        role: userData.role || "user",
    });

    return {
        uid: userDoc.id,
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoURL || null,
        provider: userData.provider,
        providerId: userData.providerId || null,
        role: userData.role || "user",
        token,
    };
}

module.exports = {
    generateToken,
    registerUser,
    loginUser,
};
