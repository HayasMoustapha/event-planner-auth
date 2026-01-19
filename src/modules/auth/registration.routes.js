const express = require('express');
const router = express.Router();
const registrationController = require('./registration.controller');
const { body, param } = require('express-validator');
const validate = require('../../middlewares/validation.middleware');

/**
 * Routes pour l'inscription et la vérification des comptes
 */

// Validation pour l'inscription
const registerValidation = [
  body('first_name')
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .trim(),
  
  body('last_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le nom ne doit pas dépasser 50 caractères')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Format de numéro de téléphone invalide')
    .trim(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  
  body('username')
    .optional()
    .matches(/^[a-zA-Z0-9_]{3,20}$/)
    .withMessage('Le username doit contenir entre 3 et 20 caractères alphanumériques et underscores')
    .trim(),
  
  body('userCode')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le user code ne doit pas dépasser 50 caractères')
    .trim()
];

// Validation pour la vérification email
const verifyEmailValidation = [
  body('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
  
  body('otpCode')
    .notEmpty()
    .withMessage('Le code OTP est requis')
    .isLength({ min: 4, max: 10 })
    .withMessage('Le code OTP doit contenir entre 4 et 10 caractères')
    .trim()
];

// Validation pour le renvoi OTP
const resendOTPValidation = [
  body('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
];

// Validation pour la connexion post-vérification
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Validation pour vérification email
const checkEmailValidation = [
  param('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
];

// Validation pour vérification username
const checkUsernameValidation = [
  param('username')
    .matches(/^[a-zA-Z0-9_]{3,20}$/)
    .withMessage('Format de username invalide')
];

/**
 * @route   POST /api/auth/register
 * @desc    Inscrire un nouvel utilisateur
 * @access  Public
 */
router.post('/register', registerValidation, validate, registrationController.register);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Vérifier l'email avec un code OTP
 * @access  Public
 */
router.post('/verify-email', verifyEmailValidation, validate, registrationController.verifyEmail);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Renvoyer un code OTP
 * @access  Public
 */
router.post('/resend-otp', resendOTPValidation, validate, registrationController.resendOTP);

/**
 * @route   POST /api/auth/login-after-verification
 * @desc    Connecter un utilisateur après vérification
 * @access  Public
 */
router.post('/login-after-verification', loginValidation, validate, registrationController.loginAfterVerification);

/**
 * @route   GET /api/auth/check-email/:email
 * @desc    Vérifier la disponibilité d'un email
 * @access  Public
 */
router.get('/check-email/:email', checkEmailValidation, validate, registrationController.checkEmailAvailability);

/**
 * @route   GET /api/auth/check-username/:username
 * @desc    Vérifier la disponibilité d'un username
 * @access  Public
 */
router.get('/check-username/:username', checkUsernameValidation, validate, registrationController.checkUsernameAvailability);

module.exports = router;
