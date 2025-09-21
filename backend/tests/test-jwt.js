import { generateToken, verifyToken } from '../services/jwtService.js';

async function testJWT() {
  const payload = { id: 123, username: 'testuser' };
  const token = generateToken(payload);
  // Token generated successfully

  const decoded = verifyToken(token);
  // Token verified successfully
}

testJWT();