const fs = require('fs');
const path = require('path');

/**
 * Script de vérification finale des incohérences
 * Analyse tous les fichiers JavaScript pour trouver les incohérences restantes
 */

class InconsistencyChecker {
  constructor() {
    this.inconsistencies = [];
    this.jsFiles = [];
  }

  /**
   * Scanne tous les fichiers JavaScript du projet
   */
  scanJsFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        this.scanJsFiles(fullPath);
      } else if (file.name.endsWith('.js')) {
        this.jsFiles.push(fullPath);
      }
    }
  }

  /**
   * Analyse un fichier pour les incohérences
   */
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Vérifier les fonctions snake_case
        if (this.hasSnakeCaseFunction(line)) {
          this.addInconsistency('snake_case_function', filePath, lineNumber, line);
        }
        
        // Vérifier les variables snake_case
        if (this.hasSnakeCaseVariable(line)) {
          this.addInconsistency('snake_case_variable', filePath, lineNumber, line);
        }
        
        // Vérifier les fonctions non documentées
        if (this.hasUndocumentedFunction(line)) {
          this.addInconsistency('undocumented_function', filePath, lineNumber, line);
        }
        
        // Vérifier les erreurs de syntaxe
        if (this.hasSyntaxError(line)) {
          this.addInconsistency('syntax_error', filePath, lineNumber, line);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error.message);
    }
  }

  /**
   * Vérifie si une ligne contient une fonction snake_case
   */
  hasSnakeCaseFunction(line) {
    const snakeCaseFunctionRegex = /^\s*(async\s+)?[a-zA-Z_][a-zA-Z0-9_]*_[a-zA-Z][a-zA-Z0-9_]*\s*\(/;
    return snakeCaseFunctionRegex.test(line);
  }

  /**
   * Vérifie si une ligne contient une variable snake_case
   */
  hasSnakeCaseVariable(line) {
    const snakeCaseVariableRegex = /\b[a-z][a-z0-9]*_[a-z][a-z0-9_]*\b/;
    return snakeCaseVariableRegex.test(line);
  }

  /**
   * Vérifie si une fonction n'est pas documentée
   */
  hasUndocumentedFunction(line) {
    const functionRegex = /^\s*(async\s+)?function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/;
    const hasFunction = functionRegex.test(line);
    const hasJSDoc = line.includes('/**') || line.includes('*');
    return hasFunction && !hasJSDoc;
  }

  /**
   * Vérifie les erreurs de syntaxe courantes
   */
  hasSyntaxError(line) {
    // Vérifier les accolades non fermées
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return true;
    }
    
    // Vérifier les parenthèses non fermées
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      return true;
    }
    
    return false;
  }

  /**
   * Ajoute une incohérence à la liste
   */
  addInconsistency(type, filePath, lineNumber, line) {
    this.inconsistencies.push({
      type,
      file: path.relative(process.cwd(), filePath),
      lineNumber,
      line: line.trim(),
      severity: this.getSeverity(type)
    });
  }

  /**
   * Détermine la sévérité d'une incohérence
   */
  getSeverity(type) {
    const severityMap = {
      'snake_case_function': 'high',
      'snake_case_variable': 'medium',
      'undocumented_function': 'medium',
      'syntax_error': 'critical'
    };
    
    return severityMap[type] || 'low';
  }

  /**
   * Génère le rapport d'incohérences
   */
  generateReport() {
    console.log('\n🔍 RAPPORT DE VÉRIFICATION DES INCOHÉRENCES\n');
    
    if (this.inconsistencies.length === 0) {
      console.log('✅ Aucune incohérence détectée !');
      return;
    }
    
    // Grouper par type
    const grouped = this.inconsistencies.reduce((acc, inc) => {
      if (!acc[inc.type]) {
        acc[inc.type] = [];
      }
      acc[inc.type].push(inc);
      return acc;
    }, {});
    
    // Afficher les incohérences par sévérité
    const bySeverity = this.inconsistencies.reduce((acc, inc) => {
      if (!acc[inc.severity]) {
        acc[inc.severity] = [];
      }
      acc[inc.severity].push(inc);
      return acc;
    }, {});
    
    console.log(`📊 STATISTIQUES :`);
    console.log(`   Total des incohérences : ${this.inconsistencies.length}`);
    console.log(`   Critiques : ${bySeverity.critical?.length || 0}`);
    console.log(`   Hautes : ${bySeverity.high?.length || 0}`);
    console.log(`   Moyennes : ${bySeverity.medium?.length || 0}`);
    console.log(`   Basses : ${bySeverity.low?.length || 0}`);
    
    console.log('\n📋 DÉTAIL PAR TYPE :');
    Object.entries(grouped).forEach(([type, items]) => {
      console.log(`\n${type.toUpperCase()} (${items.length} occurrences) :`);
      items.slice(0, 5).forEach(item => {
        console.log(`   📄 ${item.file}:${item.lineNumber} - ${item.line}`);
      });
      if (items.length > 5) {
        console.log(`   ... et ${items.length - 5} autres`);
      }
    });
    
    // Générer le fichier JSON
    const reportPath = path.join(process.cwd(), 'inconsistencies-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        total: this.inconsistencies.length,
        bySeverity,
        byType: grouped
      },
      inconsistencies: this.inconsistencies
    }, null, 2));
    
    console.log(`\n📄 Rapport détaillé sauvegardé dans : ${reportPath}`);
  }

  /**
   * Exécute la vérification complète
   */
  run() {
    console.log('🔍 Début de la vérification des incohérences...\n');
    
    // Scanner tous les fichiers JavaScript
    this.scanJsFiles(path.join(__dirname, '../src'));
    
    console.log(`📁 ${this.jsFiles.length} fichiers JavaScript à analyser...\n`);
    
    // Analyser chaque fichier
    this.jsFiles.forEach(file => {
      console.log(`🔍 Analyse de : ${path.relative(process.cwd(), file)}`);
      this.analyzeFile(file);
    });
    
    // Générer le rapport
    this.generateReport();
  }
}

// Exécuter la vérification
const checker = new InconsistencyChecker();
checker.run();
