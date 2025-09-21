import {requestOpts} from '../schema/friendsSchema.js';

import {getFriends, sendRequest, acceptRequest, declineRequest, removeFriend, blockFriend, searchUser} from '../controller/friendsController.js'

import { authenticate } from '../services/jwtService.js';
import { trackUserActivity } from '../services/lastSeenService.js';

export default function friendsRoute(fastify, _opts, done) {
	fastify.get ('/friends', {preHandler: [authenticate, trackUserActivity]}, getFriends);
	fastify.post('/friends/sendRequest', {requestOpts, preHandler: [authenticate, trackUserActivity]}, sendRequest);
	fastify.post('/friends/acceptRequest', {requestOpts, preHandler: [authenticate, trackUserActivity]}, acceptRequest);
	fastify.post('/friends/declineRequest', {requestOpts, preHandler: [authenticate, trackUserActivity]}, declineRequest);
	fastify.post('/friends/removeFriend', {requestOpts, preHandler: [authenticate, trackUserActivity]}, removeFriend);
	fastify.post('/friends/blockFriend', {requestOpts, preHandler: [authenticate, trackUserActivity]}, blockFriend);
	fastify.get('/friends/searchUser', {preHandler: [authenticate, trackUserActivity]}, searchUser);
	done ()
}
