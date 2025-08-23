import { getCurrentUserOpts, updateUsernameOpts, updatePasswordOpts, updateAvatarOpts} from "../schema/profileSchema.js";
import { getCurrentUser, updateUsername, updatePassword, updateAvatar} from "../controller/profileController.js";

export default function profileRoutes(fastify, _opts, done) {
	fastify.get ('/profile/me', getCurrentUserOpts, getCurrentUser);
	fastify.patch('/profile/username', updateUsernameOpts, updateUsername),
	fastify.patch('/profile/password', updatePasswordOpts, updatePassword),
	fastify.patch('/profile/avatar', updateAvatar),
	done ()
}