// import {prisma} from '../server.js';
import {prisma} from '../prisma/prisma_lib.js'

// const users = await prisma.user.findMany() gets all the users

// 200
export async function getFriends(req, reply) {
	// we want to get friends for a specific user from his id
	const id = 2; // later will strap from jwt token

	const friendship = await prisma.friendship.findMany ({
		where: {
			status: "ACCEPTED",
			OR: [{ requesterId: id }, {addresseeId: id}],
		},
		include: {
			requesterUser: { 
				omit: {passwordHash: true}
			},
			addresseeUser: {
				omit: {passwordHash: true}
			},
		}
	});
	console.log('Any friendships for user 2:', friendship);
	return reply.status(200).send({
		friends: friendship.map (f => f.requesterId === id ? f.addresseeUser : f.requesterUser )
	})
}

// 201
export async function sendRequest(req, reply) {
	const id = 2; // later will strap from jwt token

	// if it failed to create it, it means that there is already a request / user is blocked.
	await prisma.friendship.create({data: {

		requesterId: id,
		addresseeId: req.body.userId
	}})

	// if request is pending then it should not allow it to send from the frontend
	reply.status(200).send({message: "request sent successfully"})

}
// 200 accepted, 404 if not pending
export async function acceptRequest(req, reply) {
	const id = 3;

	// it shows that the updatedAt changes even if it was accepted before,
	await prisma.friendship.update({
		where: {
			status: 'PENDING',
			requesterId_addresseeId: { // Composite key syntax 
				requesterId: req.body.userId,
				addresseeId: id,
			},
		},
		data: { status: 'ACCEPTED' }
	});

	reply.status(200).send({message: "request accepted successfully"});
}

export async function declineRequest(req, reply) {
	const id = 3;

	await prisma.friendship.delete({
		where: {
			status: 'PENDING',
			requesterId_addresseeId: { // Composite key syntax 
				requesterId: req.body.userId,
				addresseeId: id,
			},
		},
	  })
	reply.status(200).send({message: "request declined successfully"})
}

export async function removeFriend(req, reply) {
	const id = 3;

	await prisma.friendship.deleteMany({
		where: {
			status: 'ACCEPTED',
			OR: [
				{ requesterId: id, addresseeId: req.body.userId },
				{ requesterId: req.body.userId, addresseeId: id }
			]
		}
	});
	
	reply.status(200).send({message: "friend removed successfully"});
}

export async function blockFriend(req, reply) {
	const id = 3;

	await prisma.friendship.updateMany({
		where: {
			status: 'ACCEPTED',
			OR : [
				{ requesterId: id, addresseeId: req.body.userId },
				{ requesterId: req.body.userId, addresseeId: id }
			]
		},
		data: { status: 'BLOCKED'}
	  })
	reply.status(200).send({message: "friend blocked successfully"})
}

export async function searchUser(req, reply) {
	const {q: searchTerm, page = 1} = req.query
	const limit = 10
	const skip = (page - 1) * limit



	const users = await prisma.user.findMany({
		where: {
			OR: [
					{email: { startsWith: searchTerm}},
					{username: {startsWith: searchTerm}}
			],
		},
		omit: {passwordHash: true},
		take: limit,
		skip: skip
	})
	reply.status(200).send({users: users})
}
