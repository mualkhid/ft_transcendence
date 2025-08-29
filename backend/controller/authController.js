// ESM: no module.exports; use named exports
import { prisma } from '../prisma/prisma_lib.js';

import bcrypt from 'bcrypt';
import { generateToken } from '../services/jwtService.js';
import sanitizeHtml from 'sanitize-html';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

const sanitizedUserSelect = { id: true, username: true, email: true, createdAt: true, lastSeen: true, updatedAt: true }

function generateBackupCodes(count = 5) {
    return Array.from({ length: count }, () =>
        crypto.randomBytes(4).toString('hex')
    );
}

export async function registerUser(req, reply) {
    const { username, email, password } = req.body;

    // Sanitize input to prevent XSS
    const cleanUsername = sanitizeHtml(username);
    const cleanEmail = sanitizeHtml(email);

    if (!cleanUsername || !cleanEmail || !password) {
        return reply.status(400).send({ error: "Username, email, and password are required." });
    }

    // Password strength check
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return reply.status(400).send({ error: "Password must be at least 8 characters, include a number and an uppercase letter." });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existingUser) {
            return reply.status(409).send({ error: "Email already registered." });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await prisma.user.create({
            data: {
                username: cleanUsername,
                email: cleanEmail,
                passwordHash
            }
        });

        return reply.status(201).send({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastSeen: user.lastSeen
            }
        });
    } catch (err) {
        console.error("Registration error:", err);
        return reply.status(500).send({ error: "Internal server error." });
    }
}

export async function login(req, reply) {
    const { email, password } = req.body;

    // Sanitize input to prevent XSS
    const cleanEmail = sanitizeHtml(email);

    if (!cleanEmail || !password) {
        return reply.status(400).send({ error: "Email and password are required." });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) {
            return reply.status(401).send({ error: "Invalid email or password." });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return reply.status(401).send({ error: "Invalid email or password." });
        }

        // 2FA verification
        if (user.isTwoFactorEnabled) {
            const { twoFactorCode } = req.body;
            let verified = false;
            const backupCodesArray = user.backupCodes ? user.backupCodes.split(',') : [];
            if (twoFactorCode) {
                verified = speakeasy.totp.verify({
                    secret: user.twoFactorSecret,
                    encoding: 'base32',
                    token: twoFactorCode
                });
                // If not verified, check backup codes
                if (!verified && backupCodesArray.includes(twoFactorCode)) {
                    // Remove used backup code
                    const updatedCodes = backupCodesArray.filter(code => code !== twoFactorCode);
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { backupCodes: updatedCodes.join(',') }
                    });
                    verified = true;
                }
            }
            if (!verified) {
                return reply.status(401).send({ error: "Invalid 2FA or backup code." });
            }
        }

        const token = generateToken(user);
        reply.setCookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 3600
        });
        // await prisma.user.update({
        //     where: { id: user.id },
        //     data: { lastSeen: new Date(now) }
        // });
        return reply.status(200).send({ message: 'Login successful', token });
    } catch (err) {
        console.error("Login error:", err);
        return reply.status(500).send({ error: err.message });
    }
}

export async function getCurrentUser(req, reply) {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: "User not found" });
    return reply.status(200).send({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastSeen: user.lastSeen
        }
    });
}

export function logout(req, reply) {
    reply.clearCookie('token', { path: '/' });
    return reply.status(200).send({ message: "logged-out" });
}

export async function setup2FA(req, reply) {
    const userId = req.user.id;
    const secret = speakeasy.generateSecret({ name: `ft_transcendence (${req.user.email})` });

    // Save secret to user in DB
    const backupCodesArray = generateBackupCodes();
    const backupCodesString = backupCodesArray.join(',');

    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorSecret: secret.base32,
            isTwoFactorEnabled: true,
            backupCodes: backupCodesString
        }
    });

    const qr = await qrcode.toDataURL(secret.otpauth_url);

    // Return backupCodesArray to the user (show only once!)
    return reply.send({ qr, secret: secret.base32, backupCodes: backupCodesArray });
}
