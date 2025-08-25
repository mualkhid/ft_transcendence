import { getCurrentUserOpts, updateUsernameOpts, updatePasswordOpts, updateAvatarOpts} from "../schema/profileSchema.js";
import { getCurrentUser, updateUsername, updatePassword, updateAvatar} from "../controller/profileController.js";

export default function profileRoutes(fastify, _opts, done) {
	fastify.get ('/api/profile/me', getCurrentUserOpts, getCurrentUser);
	fastify.patch('/api/profile/username', updateUsernameOpts, updateUsername),
	fastify.patch('/api/profile/password', updatePasswordOpts, updatePassword),
	fastify.patch('/api/profile/avatar', updateAvatar),
	done ()
}

