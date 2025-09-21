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
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values),
    });
    
    const data = await res.json();
    console.log('Google tokens response:', data);
    
    if (!res.ok) {
      throw new Error(`Google token error: ${data.error_description || data.error}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting Google tokens:', error);
    throw error;
  }
}

export async function getGoogleUser(id_token, access_token) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      { headers: { Authorization: `Bearer ${id_token}` } }
    );
    
    const user = await res.json();
    console.log('Google user data:', user);
    
    if (!res.ok) {
      throw new Error(`Google user info error: ${user.error_description || user.error}`);
    }
    
    return user;
  } catch (error) {
    console.error('Error getting Google user:', error);
    throw error;
  }
}

export async function handleGoogleAuth(req, reply) {
  try {
    const url = await getGoogleOAuthUrl();
    console.log('Redirecting to Google OAuth URL:', url);
    reply.redirect(url);
  } catch (error) {
    console.error('Google auth error:', error);
    reply.status(500).send({ error: 'Failed to initiate Google authentication' });
  }
}

export async function handleGoogleCallback(req, reply) {
  try {
    console.log('=== GOOGLE OAUTH CALLBACK ===');
    console.log('Query params:', req.query);
    
    const code = req.query.code;
    const error = req.query.error;
    
    if (error) {
      console.error('Google OAuth error:', error);
      return reply.redirect('/?auth=error&message=' + encodeURIComponent(error));
    }
    
    if (!code) {
      console.error('No authorization code provided');
      return reply.redirect('/?auth=error&message=' + encodeURIComponent('No authorization code'));
    }
    
    console.log('Getting Google tokens...');
    const tokenData = await getGoogleTokens(code);
    
    if (!tokenData.access_token) {
      console.error('No access token received:', tokenData);
      return reply.redirect('/?auth=error&message=' + encodeURIComponent('No access token'));
    }
    
    console.log('Getting Google user info...');
    const googleUser = await getGoogleUser(tokenData.id_token, tokenData.access_token);
    
    if (!googleUser.email) {
      console.error('No email in Google user data:', googleUser);
      return reply.redirect('/?auth=error&message=' + encodeURIComponent('No email from Google'));
    }
    
    console.log('Google user email:', googleUser.email);

    // Find or create user
    let user = await prisma.user.findUnique({ 
      where: { email: googleUser.email } 
    });
    
    if (!user) {
      console.log('Creating new user for Google OAuth');
      // Generate a unique username if needed
      let username = googleUser.email.split('@')[0];
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUser) {
        username = `${username}_${Date.now()}`;
      }
      
      user = await prisma.user.create({
        data: {
          username: username,
          email: googleUser.email,
          avatarUrl: googleUser.picture || null,
          passwordHash: '', // Not used for Google users
          isEmailVerified: true, // Google emails are verified
        },
      });
      console.log('New user created:', user.id);
    } else {
      console.log('Existing user found:', user.id);
      // Update avatar if Google has a newer one
      if (googleUser.picture && googleUser.picture !== user.avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: googleUser.picture }
        });
      }
    }
    
    console.log('Generating JWT token...');
    const token = generateToken(user);
    
    // Set cookie with proper settings for your domain
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    };
    
    // Don't set domain for localhost
    const host = req.headers.host || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      cookieOptions.domain = host.split(':')[0];
    }
    
    reply.setCookie('token', token, cookieOptions);
    
    console.log('🍪 Cookie set for Google OAuth user:', user.email);
    console.log('🔗 Redirecting to: /?auth=success');
    
    // Redirect to frontend with success parameter
    reply.redirect('/?auth=success');
    
  } catch (error) {
    console.error('Google callback error:', error);
    reply.redirect('/?auth=error&message=' + encodeURIComponent('Authentication failed'));
  }
}
