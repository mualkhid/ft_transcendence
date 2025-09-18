import fetch from 'node-fetch';
import { prisma } from '../prisma/prisma_lib.js';
import { generateToken } from './jwtService.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://localhost/api/auth/google/callback';

export async function getGoogleOAuthUrl() {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: GOOGLE_REDIRECT_URI,
    client_id: GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'openid',
      'profile',
      'email',
    ].join(' '),
  };
  const params = new URLSearchParams(options);
  return `${rootUrl}?${params.toString()}`;
}

export async function getGoogleTokens(code) {
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values),
  });
  return res.json();
}

export async function getGoogleUser(id_token, access_token) {
  const res = await fetch(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
    { headers: { Authorization: `Bearer ${id_token}` } }
  );
  return res.json();
}

export async function handleGoogleAuth(req, reply) {
  const url = await getGoogleOAuthUrl();
  reply.redirect(url);
}

export async function handleGoogleCallback(req, reply) {
  const code = req.query.code;
  if (!code) return reply.status(400).send({ error: 'No code provided' });
  const { id_token, access_token } = await getGoogleTokens(code);
  const googleUser = await getGoogleUser(id_token, access_token);
  if (!googleUser.email) return reply.status(400).send({ error: 'Google user info error' });

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email: googleUser.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: googleUser.email.split('@')[0],
        email: googleUser.email,
        avatarUrl: googleUser.picture,
        passwordHash: '', // Not used for Google users
      },
    });
  }
  const token = generateToken(user);
  reply.setCookie('token', token, {
    httpOnly: true,
    secure: true, 
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });
  reply.redirect('/dashboard.html');
}
