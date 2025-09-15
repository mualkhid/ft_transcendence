// services/imageService.js
import path from 'node:path'
import * as fs from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { fileTypeFromFile } from 'file-type'
import {ValidationError, AuthenticationError, notFoundError } from '../utils/errors.js'
import glob from 'fast-glob'
const AVATARS_DIR = path.join(process.cwd(), 'public', 'avatars')
const TMP_DIR = path.join(AVATARS_DIR, '_tmp')
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function assertFilePresent(file)
{
	if (!file)
    	throw new notFoundError('No file uploaded')
}

export function assertAllowedMime(mimetype)
{
	if (!ALLOWED_MIME.has(mimetype))
		throw new ValidationError('Unsupported file type')
}

export async function assertMagicMimeAllowed(filePath)
{
	await fs.mkdir(TMP_DIR, { recursive: true })

	
	const ft = await fileTypeFromFile(filePath) // returns { ext, mime } or undefined
	if (!ft || !ALLOWED_MIME.has(ft.mime))
		{
			await fs.unlink(filePath)
			throw new ValidationError('Invalid image file')
		}
	return ft // e.g., { ext: 'jpg', mime: 'image/jpeg' }
}

export function assertMaxSizeNotExceeded(bytesRead)
{
	if (bytesRead > MAX_SIZE_BYTES)
		throw new ValidationError('File too large. Maximum size is 5MB')
}

export function deduceExtensionFromMime(mimetype)
{
	return mimetype === 'image/jpeg' ? 'jpg'
		: mimetype === 'image/png'  ? 'png'
		: 'webp'
}

export async function ensureDir(dir)
{
	await fs.mkdir(dir, { recursive: true })
	return dir
}

export function buildAvatarFilename(userId, ext)
{
	return `${userId}.${ext}`
}

export function buildPath(basePath, filename)
{
	return path.join(basePath, filename)
}

export async function deleteUserAvatars(userId)
{
	const matches = await glob(`${AVATARS_DIR}/${userId}.*`)
	for (const file of matches)
		await fs.unlink(file)
}

export async function writeStreamToFile(readable, destPath)
{
	const writeStream = (await import('node:fs')).createWriteStream(destPath)
	await pipeline(readable, writeStream)
}

export function assertNotTruncated(file)
{
	if (file.file?.truncated)
		throw new ValidationError('File too large. Maximum size is 5MB')
}

export function buildPublicUrl(filename)
{
	return `/avatars/${filename}`
}
