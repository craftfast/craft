const crypto = require('crypto');

// Your values from the logs
const secret = 'polar_whs_hbUJs2KUMUU84RECuEhLtXAgPabMDLRd7YFbs2CCOIy';
const webhookId = '4cd55447-6004-4701-9bf1-e02678bd2b7b';
const webhookTimestamp = '1763011573';
const payload = '{"type":"checkout.created","timestamp":"2025-11-13T05:26:13.528848Z","data":{"id":"2f373846-7366-42a9-8934-25c8cfbe7e75","created_at":"2025-11-13T05:26:13.522315Z","modified_at":null,"custom_field_dat';
const expectedSignature = 'A09j73qu0eJ2N8fu4FclKTNefsVFrMlIA91FN/serXA=';

console.log('Testing webhook signature verification...\n');

// Remove prefix and decode base64
const base64Secret = secret.slice(10); // Remove 'polar_whs_'
console.log('Base64 secret (after prefix):', base64Secret);

const secretBytes = Buffer.from(base64Secret, 'base64');
console.log('Secret bytes length:', secretBytes.length);
console.log('Secret bytes (hex):', secretBytes.toString('hex').substring(0, 40) + '...\n');

// Construct signed content
const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`;
console.log('Signed content sample:', signedContent.substring(0, 100) + '...\n');

// Compute HMAC
const hmac = crypto.createHmac('sha256', secretBytes);
hmac.update(signedContent, 'utf-8');
const computedSignature = hmac.digest('base64');

console.log('Expected signature: ', expectedSignature);
console.log('Computed signature: ', computedSignature);
console.log('Match:', expectedSignature === computedSignature);
