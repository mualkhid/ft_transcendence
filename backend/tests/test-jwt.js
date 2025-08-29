import { generateToken, verifyToken } from '../services/jwtService.js';

async function testJWT() {
  const payload = { id: 123, username: 'testuser' };
  const token = generateToken(payload);
  console.log('Generated Token:', token);

  const decoded = verifyToken(token);
  console.log('Decoded Payload:', decoded);
}

testJWT();