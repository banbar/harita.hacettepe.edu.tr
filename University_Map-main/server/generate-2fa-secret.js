// generate-2fa-secret.js
const speakeasy = require('speakeasy');
const secret = speakeasy.generateSecret({
  name: 'HacettepeGIS (supervisor1@hacettepe.edu.tr)',
  length: 20
});
console.log('BASE32 SECRET:', secret.base32);
console.log('OTPAuth URI:', secret.otpauth_url);
