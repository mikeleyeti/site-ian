import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import database from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Inscription d'un nouvel utilisateur
 */
router.post('/signup',
    [
        body('email').isEmail().withMessage('Email invalide'),
        body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
        body('displayName').notEmpty().withMessage('Le nom d\'affichage est requis')
    ],
    async (req, res) => {
        try {
            // Validation des données
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: errors.array()[0].msg
                });
            }

            const { email, password, displayName } = req.body;

            // Vérifier si l'utilisateur existe déjà
            const existingUser = await database.users.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Cette adresse email est déjà utilisée'
                });
            }

            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            // Créer l'utilisateur
            const newUser = {
                email: email.toLowerCase(),
                password: hashedPassword,
                displayName,
                createdAt: new Date(),
                ianProfile: {
                    avatar: '👤',
                    firstName: '',
                    lastName: '',
                    discipline: '',
                    department: '',
                    academicEmail: '',
                    objectives: '',
                    notes: ''
                },
                contacts: [],
                newsletters: [],
                actualites: [],
                usages: []
            };

            const result = await database.users.insertOne(newUser);
            const userId = result.insertedId.toString();

            // Générer le token JWT
            const token = generateToken(userId, email.toLowerCase(), displayName);

            res.status(201).json({
                success: true,
                token,
                user: {
                    userId,
                    email: email.toLowerCase(),
                    displayName
                }
            });

        } catch (error) {
            console.error('[Auth] Erreur lors de l\'inscription:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de l\'inscription'
            });
        }
    }
);

/**
 * POST /api/auth/signin
 * Connexion d'un utilisateur
 */
router.post('/signin',
    [
        body('email').isEmail().withMessage('Email invalide'),
        body('password').notEmpty().withMessage('Le mot de passe est requis')
    ],
    async (req, res) => {
        try {
            // Validation des données
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: errors.array()[0].msg
                });
            }

            const { email, password } = req.body;

            // Trouver l'utilisateur
            const user = await database.users.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }

            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Email ou mot de passe incorrect'
                });
            }

            // Générer le token JWT
            const userId = user._id.toString();
            const token = generateToken(userId, user.email, user.displayName);

            res.json({
                success: true,
                token,
                user: {
                    userId,
                    email: user.email,
                    displayName: user.displayName
                }
            });

        } catch (error) {
            console.error('[Auth] Erreur lors de la connexion:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la connexion'
            });
        }
    }
);

export default router;
