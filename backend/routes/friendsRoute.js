import {getFriendsOpts, requestOpts} from '../schema/friendsSchema.js';

import {getFriends, sendRequest, acceptRequest, declineRequest, removeFriend, blockFriend} from '../controller/friendsController.js'

export default function friendsRoute(fastify, _opts, done) {
	fastify.get ('/friends', getFriendsOpts, getFriends);
	fastify.post('/friends/sendRequest', requestOpts, sendRequest);
	fastify.post('/friends/acceptRequest', requestOpts, acceptRequest);
	fastify.post('/friends/declineRequest', requestOpts, declineRequest);
	fastify.post('/friends/removeFriend', requestOpts, removeFriend);
	fastify.post('/friends/blockFriend', requestOpts, blockFriend);
	// fastify.get('/friends/searchUser', requestOpts, searchUser);
	done ()
}