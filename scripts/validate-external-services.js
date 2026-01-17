#!/usr/bin/env node

/**
 * Script de validation des services externes
 * Vérifie la connexion et la configuration de tous les services externes
 */

// Charger les variables d'environnement depuis le fichier .env
require('dotenv').config();

// Initialiser la configuration en premier
const configValidation = require('../src/config/validation');
try {
  configValidation.validateConfig();
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

const emailService = require('../src/services/email.service');
const smsService = require('../src/services/sms.service');
const cacheService = require('../src/services/cache.service');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  console.log(`\n${colors.blue}================================${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}================================${colors.reset}`);
}

function printServiceStatus(service, configured, ready, details = {}) {
  const configuredIcon = configured ? '✅' : '❌';
  const readyIcon = ready ? '✅' : '❌';
  
  console.log(`\n${colors.yellow}${service.toUpperCase()} SERVICE${colors.reset}`);
  console.log(`  Configured: ${configuredIcon} ${configured}`);
  console.log(`  Ready: ${readyIcon} ${ready}`);
  
  if (Object.keys(details).length > 0) {
    console.log('  Details:');
    Object.entries(details).forEach(([key, value]) => {
      console.log(`    ${key}: ${value}`);
    });
  }
}

async function validateEmailService() {
  printHeader('📧 EMAIL SERVICE VALIDATION');
  
  try {
    const config = configValidation.getConfig();
    const isConfigured = configValidation.isServiceConfigured('email');
    const isReady = emailService.isReady();
    
    const details = {
      'SMTP Host': config.SMTP_HOST || 'Not configured',
      'SMTP Port': config.SMTP_PORT || 'Not configured',
      'SMTP User': config.SMTP_USER ? 'Set' : 'Not set',
      'SMTP Password': config.SMTP_PASS ? 'Set' : 'Not set'
    };
    
    printServiceStatus('Email', isConfigured, isReady, details);
    
    // Test d'envoi d'email
    if (isReady) {
      console.log('\n🧪 Testing email sending...');
      const testResult = await emailService.sendOTP('test@example.com', '123456', 'test');
      if (testResult) {
        colorLog('green', '✅ Email test successful');
      } else {
        colorLog('red', '❌ Email test failed');
      }
    } else {
      colorLog('yellow', '⚠️ Email service not ready - using fallback');
    }
    
    return { configured: isConfigured, ready: isReady, testPassed: isReady };
    
  } catch (error) {
    colorLog('red', `❌ Email validation error: ${error.message}`);
    return { configured: false, ready: false, testPassed: false, error: error.message };
  }
}

async function validateSMSService() {
  printHeader('📱 SMS SERVICE VALIDATION');
  
  try {
    const config = configValidation.getConfig();
    const isConfigured = configValidation.isServiceConfigured('sms');
    const isReady = smsService.isReady();
    
    const details = {
      'Account SID': config.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set',
      'Auth Token': config.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set',
      'Phone Number': config.TWILIO_PHONE_NUMBER || 'Not configured'
    };
    
    printServiceStatus('SMS', isConfigured, isReady, details);
    
    // Test de connexion Twilio
    if (isReady) {
      console.log('\n🧪 Testing Twilio connection...');
      const connectionResult = await smsService.testConnection();
      
      if (connectionResult.success) {
        colorLog('green', '✅ Twilio connection successful');
        console.log(`  Account: ${connectionResult.friendlyName}`);
        console.log(`  Status: ${connectionResult.status}`);
      } else {
        colorLog('red', `❌ Twilio connection failed: ${connectionResult.error}`);
      }
      
      // Test d'envoi de SMS
      console.log('\n🧪 Testing SMS sending...');
      const testResult = await smsService.sendOTP('+33612345678', '123456', 'test');
      if (testResult) {
        colorLog('green', '✅ SMS test successful');
      } else {
        colorLog('red', '❌ SMS test failed');
      }
    } else {
      colorLog('yellow', '⚠️ SMS service not ready - using fallback');
    }
    
    return { configured: isConfigured, ready: isReady, testPassed: isReady };
    
  } catch (error) {
    colorLog('red', `❌ SMS validation error: ${error.message}`);
    return { configured: false, ready: false, testPassed: false, error: error.message };
  }
}

async function validateRedisService() {
  printHeader('🗄️ REDIS SERVICE VALIDATION');
  
  try {
    const config = configValidation.getConfig();
    const isConfigured = configValidation.isServiceConfigured('redis');
    const isReady = cacheService.isReady();
    
    const details = {
      'Host': config.REDIS_HOST,
      'Port': config.REDIS_PORT,
      'Password': config.REDIS_PASSWORD ? 'Set' : 'Not set',
      'Database': config.REDIS_DB
    };
    
    printServiceStatus('Redis', isConfigured, isReady, details);
    
    // Test des opérations Redis
    if (isReady) {
      console.log('\n🧪 Testing Redis operations...');
      
      const testKey = 'validation:test';
      const testValue = { message: 'Test data', timestamp: new Date().toISOString() };
      
      // Test SET
      const setResult = await cacheService.setSession(testKey, testValue, 60);
      if (setResult) {
        colorLog('green', '✅ Redis SET successful');
      } else {
        colorLog('red', '❌ Redis SET failed');
      }
      
      // Test GET
      const getResult = await cacheService.getSession(testKey);
      if (getResult && getResult.message === testValue.message) {
        colorLog('green', '✅ Redis GET successful');
      } else {
        colorLog('red', '❌ Redis GET failed');
      }
      
      // Test DELETE
      const deleteResult = await cacheService.deleteSession(testKey);
      if (deleteResult) {
        colorLog('green', '✅ Redis DELETE successful');
      } else {
        colorLog('red', '❌ Redis DELETE failed');
      }
      
      // Test stats
      const stats = await cacheService.getStats();
      if (stats.connected) {
        colorLog('green', '✅ Redis stats retrieved');
        console.log(`  Keys: ${stats.keys || 'N/A'}`);
        console.log(`  Memory: ${stats.memory || 'N/A'}`);
      } else {
        colorLog('red', '❌ Redis stats failed');
      }
    } else {
      colorLog('yellow', '⚠️ Redis service not ready - cache disabled');
    }
    
    return { configured: isConfigured, ready: isReady, testPassed: isReady };
    
  } catch (error) {
    colorLog('red', `❌ Redis validation error: ${error.message}`);
    return { configured: false, ready: false, testPassed: false, error: error.message };
  }
}

function generateReport(results) {
  printHeader('📊 VALIDATION REPORT');
  
  const services = ['email', 'sms', 'redis'];
  let totalServices = services.length;
  let configuredServices = 0;
  let readyServices = 0;
  let passedTests = 0;
  
  services.forEach(service => {
    const result = results[service];
    if (result.configured) configuredServices++;
    if (result.ready) readyServices++;
    if (result.testPassed) passedTests++;
  });
  
  console.log('\n📈 SUMMARY:');
  console.log(`  Total Services: ${totalServices}`);
  console.log(`  Configured: ${configuredServices}/${totalServices} (${Math.round(configuredServices/totalServices*100)}%)`);
  console.log(`  Ready: ${readyServices}/${totalServices} (${Math.round(readyServices/totalServices*100)}%)`);
  console.log(`  Tests Passed: ${passedTests}/${totalServices} (${Math.round(passedTests/totalServices*100)}%)`);
  
  console.log('\n🎯 STATUS:');
  if (passedTests === totalServices) {
    colorLog('green', '🎉 All services are working perfectly!');
  } else if (readyServices === totalServices) {
    colorLog('yellow', '⚠️ All services are ready but some tests failed');
  } else if (configuredServices === totalServices) {
    colorLog('yellow', '⚠️ All services are configured but not all are ready');
  } else {
    colorLog('red', '❌ Some services are not properly configured');
  }
  
  console.log('\n🔧 ACTIONS NEEDED:');
  services.forEach(service => {
    const result = results[service];
    if (!result.configured) {
      console.log(`  ❌ ${service.toUpperCase()}: Configure environment variables`);
    } else if (!result.ready) {
      console.log(`  ⚠️ ${service.toUpperCase()}: Check service connectivity`);
    } else if (!result.testPassed) {
      console.log(`  ⚠️ ${service.toUpperCase()}: Review test failures`);
    }
  });
  
  console.log('\n📝 CONFIGURATION GUIDE:');
  console.log('  Email Service:');
  console.log('    - SMTP_HOST: smtp.gmail.com (or your provider)');
  console.log('    - SMTP_PORT: 587');
  console.log('    - SMTP_USER: your_email@gmail.com');
  console.log('    - SMTP_PASS: your_app_password');
  console.log('');
  console.log('  SMS Service:');
  console.log('    - TWILIO_ACCOUNT_SID: ACxxxxxxxxxxxx');
  console.log('    - TWILIO_AUTH_TOKEN: your_auth_token');
  console.log('    - TWILIO_PHONE_NUMBER: +1234567890');
  console.log('');
  console.log('  Redis Service:');
  console.log('    - REDIS_HOST: localhost');
  console.log('    - REDIS_PORT: 6379');
  console.log('    - REDIS_PASSWORD: your_redis_password (optional)');
}

async function main() {
  console.log('🚀 Starting External Services Validation...\n');
  
  const results = {};
  
  try {
    // Valider chaque service
    results.email = await validateEmailService();
    results.sms = await validateSMSService();
    results.redis = await validateRedisService();
    
    // Générer le rapport
    generateReport(results);
    
    // Code de sortie basé sur les résultats
    const allServicesReady = Object.values(results).every(r => r.ready);
    process.exit(allServicesReady ? 0 : 1);
    
  } catch (error) {
    colorLog('red', `❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter la validation
if (require.main === module) {
  main();
}

module.exports = { validateEmailService, validateSMSService, validateRedisService };
