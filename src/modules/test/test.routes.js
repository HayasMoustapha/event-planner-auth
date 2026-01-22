const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createResponse } = require('../../utils/response');
const zxcvbn = require('zxcvbn');

/**
 * @swagger
 * /api/test/password-strength:
 *   post:
 *     summary: Tester la force d'un mot de passe
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 128
 *                 description: Mot de passe à tester
 *               userInputs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Informations personnelles à éviter (email, nom, etc.)
 *     responses:
 *       200:
 *         description: Force du mot de passe évaluée
 *       400:
 *         description: Erreur de validation
 */
router.post('/password-strength',
  [
    body('password')
      .notEmpty()
      .withMessage('Le mot de passe est requis')
      .isLength({ min: 1, max: 128 })
      .withMessage('Le mot de passe doit contenir entre 1 et 128 caractères'),
    body('userInputs')
      .optional()
      .isArray()
      .withMessage('Les user inputs doivent être un tableau')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(createResponse(
        false,
        'Erreur de validation',
        errors.array()
      ));
    }
    next();
  },
  (req, res) => {
    try {
      const { password, userInputs = [] } = req.body;

      // Utiliser zxcvbn pour évaluer la force du mot de passe
      const result = zxcvbn(password, userInputs);

      // Calculer un score sur 100 (plus intuitif)
      const score100 = Math.round((result.score / 4) * 100);

      // Déterminer la catégorie de force
      let strength = 'Très faible';
      let color = '#dc3545'; // rouge
      
      if (score100 >= 80) {
        strength = 'Très fort';
        color = '#28a745'; // vert
      } else if (score100 >= 60) {
        strength = 'Fort';
        color = '#28a745'; // vert
      } else if (score100 >= 40) {
        strength = 'Moyen';
        color = '#ffc107'; // jaune
      } else if (score100 >= 20) {
        strength = 'Faible';
        color = '#fd7e14'; // orange
      }

      // Recommandations
      const recommendations = [];
      if (result.feedback.warning) {
        recommendations.push(result.feedback.warning);
      }
      if (result.feedback.suggestions && result.feedback.suggestions.length > 0) {
        recommendations.push(...result.feedback.suggestions);
      }

      // Temps de craquage estimé
      const crackTime = result.crack_times_display.offline_slow_hashing_1e4_per_second;

      const response = {
        password: password.replace(/./g, '*'), // Cacher le mot de passe dans la réponse
        score: result.score,
        score100: score100,
        strength: strength,
        color: color,
        crackTime: crackTime,
        guesses: result.guesses,
        guessesLog10: result.guesses_log10,
        sequence: result.sequence,
        pattern: result.pattern,
        warning: result.feedback.warning || null,
        suggestions: recommendations,
        passed: score100 >= 40, // Considéré comme acceptable si >= 40%
        requirements: {
          minLength: password.length >= 8,
          hasLowercase: /[a-z]/.test(password),
          hasUppercase: /[A-Z]/.test(password),
          hasNumbers: /\d/.test(password),
          hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        }
      };

      res.status(200).json(createResponse(
        true,
        'Force du mot de passe évaluée avec succès',
        response
      ));

    } catch (error) {
      console.error('Error testing password strength:', error);
      res.status(500).json(createResponse(
        false,
        'Erreur lors du test de force du mot de passe',
        { error: error.message }
      ));
    }
  }
);

module.exports = router;
