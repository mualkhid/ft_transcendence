import jwt from 'jsonwebtoken';
import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET;

export function generateToken(user) {
  return jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });
}

export function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

export function authenticate(request, reply, done) {
  try {
    const token = request.cookies.token;
    if (!token) throw new Error('No token');
    request.user = verifyToken(token);
    
    done();
  } catch (err) {
    reply.status(401).send({ error: err.message });
  }
}