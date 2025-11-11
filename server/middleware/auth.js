import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware d'authentification JWT
 * Vérifie le token JWT dans les headers et ajoute les informations utilisateur à req.user
 */
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token d\'authentification manquant'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    error: 'Token invalide ou expiré'
                });
            }

            // Ajouter les informations de l'utilisateur à la requête
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                displayName: decoded.displayName
            };

            next();
        });
    } catch (error) {
        console.error('[Auth] Erreur d\'authentification:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur d\'authentification'
        });
    }
};

/**
 * Générer un token JWT
 */
export const generateToken = (userId, email, displayName) => {
    return jwt.sign(
        { userId, email, displayName },
        process.env.JWT_SECRET,
        { expiresIn: parseInt(process.env.JWT_EXPIRATION) || 86400 }
    );
};
