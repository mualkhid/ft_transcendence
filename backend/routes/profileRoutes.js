import { getCurrentUserOpts, updateUsernameOpts, updatePasswordOpts, updateAvatarOpts} from "../schema/profileSchema.js";
import { getCurrentUser, updateUsername, updatePassword, updateAvatar, updateStats} from "../controller/profileController.js";

import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

export default function profileRoutes(fastify, _opts, done) {
	fastify.get ('/profile/me', {getCurrentUserOpts, preHandler: [authenticate, trackUserActivity]}, getCurrentUser);
	fastify.patch('/profile/username', {updateUsernameOpts, preHandler: [authenticate, trackUserActivity]}, updateUsername),
	fastify.patch('/profile/password', {updatePasswordOpts, preHandler: [authenticate, trackUserActivity]}, updatePassword),
	fastify.patch('/profile/avatar', {preHandler: [authenticate, trackUserActivity]}, updateAvatar),
	fastify.post('/profile/update-stats', {preHandler: [authenticate, trackUserActivity]}, updateStats),
	done ()
}

