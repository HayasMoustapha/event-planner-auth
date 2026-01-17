#!/usr/bin/env node

// Test simple des services externes
require('dotenv').config();

const configValidation = require('../src/config/validation');

console.log('🚀 Testing External Services...\n');

try {
  // Valider la configuration
  configValidation.validateConfig();
  console.log('✅ Configuration validated successfully');
  
  const config = configValidation.getConfig();
  
  // Test Email Service
  console.log('\n📧 EMAIL SERVICE:');
  const emailConfigured = configValidation.isServiceConfigured('email');
  console.log(`  Configured: ${emailConfigured ? '✅' : '❌'}`);
  console.log(`  Host: ${config.SMTP_HOST || 'Not set'}`);
  console.log(`  User: ${config.SMTP_USER ? 'Set' : 'Not set'}`);
  
  // Test SMS Service
  console.log('\n📱 SMS SERVICE:');
  const smsConfigured = configValidation.isServiceConfigured('sms');
  console.log(`  Configured: ${smsConfigured ? '✅' : '❌'}`);
  console.log(`  Account SID: ${config.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set'}`);
  console.log(`  Phone Number: ${config.TWILIO_PHONE_NUMBER || 'Not set'}`);
  
  // Test Redis Service
  console.log('\n🗄️ REDIS SERVICE:');
  const redisConfigured = configValidation.isServiceConfigured('redis');
  console.log(`  Configured: ${redisConfigured ? '✅' : '❌'}`);
  console.log(`  Host: ${config.REDIS_HOST}`);
  console.log(`  Port: ${config.REDIS_PORT}`);
  console.log(`  Password: ${config.REDIS_PASSWORD ? 'Set' : 'Not set'}`);
  
  // Résumé
  console.log('\n📊 SUMMARY:');
  const totalServices = 3;
  const configuredServices = [emailConfigured, smsConfigured, redisConfigured].filter(Boolean).length;
  console.log(`  Configured: ${configuredServices}/${totalServices}`);
  
  if (configuredServices === 0) {
    console.log('  ⚠️ No services configured - using fallbacks');
  } else if (configuredServices === totalServices) {
    console.log('  🎉 All services configured!');
  } else {
    console.log(`  ⚠️ ${configuredServices}/${totalServices} services configured`);
  }
  
  console.log('\n✅ Test completed successfully');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
