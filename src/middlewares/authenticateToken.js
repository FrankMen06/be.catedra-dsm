function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        console.log("AUTH HEADER:", authHeader);

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Token mal formado" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {
        console.log("JWT ERROR:", error.message);

        return res.status(403).json({
            message: "Token inválido o expirado"
        });
    }
}
