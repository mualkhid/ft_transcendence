import {requestOpts} from '../schema/friendsSchema.js';

import {getFriends, sendRequest, acceptRequest, declineRequest, removeFriend, blockFriend, searchUser} from '../controller/friendsController.js'

export default function friendsRoute(fastify, _opts, done) {
	fastify.get ('/api/friends', getFriends);
	fastify.post('/api/friends/sendRequest', requestOpts, sendRequest);
	fastify.post('/api/friends/acceptRequest', requestOpts, acceptRequest);
	fastify.post('/api/friends/declineRequest', requestOpts, declineRequest);
	fastify.post('/api/friends/removeFriend', requestOpts, removeFriend);
	fastify.post('/api/friends/blockFriend', requestOpts, blockFriend);
	fastify.get('/api/friends/searchUser', searchUser); // should create options
	done ()
}
