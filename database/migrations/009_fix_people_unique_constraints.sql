-- Correction des contraintes UNIQUE inappropriées sur la table people
-- Le dump MySQL a des contraintes UNIQUE sur first_name et last_name qui sont incorrectes
-- pour une table de personnes (plusieurs personnes peuvent avoir le même nom)

-- Supprimer les contraintes UNIQUE inappropriées
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_first_name_unique;
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_last_name_unique;

-- Conserver uniquement les contraintes UNIQUE légitimes
-- email doit être unique (correct)
-- phone peut être unique (correct) 
-- uid doit être unique (correct)
