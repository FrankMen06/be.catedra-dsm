const { db } = require("../config/firebase.service");
const { generateToken } = require("./auth.service");

async function loginWithSocialProvider({
                                           provider,
                                           providerId,
                                           name,
                                           email,
                                           photoURL,
                                       }) {
    if (!provider || !providerId || !name) {
        const error = new Error("provider, providerId y name son obligatorios");
        error.statusCode = 400;
        throw error;
    }

    const allowedProviders = ["instagram", "google", "facebook"];

    if (!allowedProviders.includes(provider)) {
        const error = new Error("Proveedor social no permitido");
        error.statusCode = 400;
        throw error;
    }

    const userSnapshot = await db
        .collection("users")
        .where("provider", "==", provider)
        .where("providerId", "==", providerId)
        .limit(1)
        .get();

    let userId;
    let userData;

    if (userSnapshot.empty) {
        const newUser = {
            name,
            email: email || null,
            photoURL: photoURL || null,
            passwordHash: null,
            provider,
            providerId,
            role: "user",
            createdAt: new Date().toISOString(),
        };

        const userRef = await db.collection("users").add(newUser);

        userId = userRef.id;
        userData = newUser;
    } else {
        const userDoc = userSnapshot.docs[0];

        userId = userDoc.id;
        userData = userDoc.data();

        const updateData = {
            name,
            photoURL: photoURL || userData.photoURL || null,
        };

        if (email !== undefined) {
            updateData.email = email || null;
        }

        await db.collection("users").doc(userId).update(updateData);

        userData = {
            ...userData,
            ...updateData,
        };
    }

    const token = generateToken({
        uid: userId,
        email: userData.email || null,
        provider: userData.provider,
        role: userData.role || "user",
    });

    return {
        uid: userId,
        name: userData.name,
        email: userData.email || null,
        photoURL: userData.photoURL || null,
        provider: userData.provider,
        providerId: userData.providerId,
        role: userData.role || "user",
        token,
    };
}

module.exports = {
    loginWithSocialProvider,
};
