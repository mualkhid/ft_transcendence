import {prisma} from '../prisma/prisma_lib.js'
import { notFoundError, ValidationError } from '../utils/errors.js';

const sanitizedUserSelect = { id: true, username: true, email: true, createdAt: true, lastSeen: true, updatedAt: true }

export async function getFriends(req, reply) {
	const id = req.user.id

	const friendship = await prisma.friendship.findMany ({
		where: {
			status: "ACCEPTED",
			OR: [{ requesterId: id }, {addresseeId: id}],
		},
		include: {
			requesterUser: { 
				select: sanitizedUserSelect
			},
			addresseeUser: {
				select: sanitizedUserSelect
			},
		}
	});

	return reply.status(200).send({
		friends: friendship.map (f => f.requesterId === id ? f.addresseeUser : f.requesterUser )
	})
}


export async function sendRequest(req, reply) {
	const id = req.user.id
	const userId = req.body.userId

	if (id === userId)
		throw new ValidationError("Cannot be friends with self")
	
	await prisma.friendship.create({data: {

		requesterId: id,
		addresseeId: userId
	}})

	// if request is pending then it should not allow it to send from the frontend
	reply.status(201).send({message: "request sent successfully"})

}

// 200 accepted, 404 if not pending
export async function acceptRequest(req, reply) {
	 const id = req.user.id

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
	const id = req.user.id

	await prisma.friendship.delete({
		where: {
			status: 'PENDING',
			requesterId_addresseeId: { // Composite key syntax 
				requesterId: req.body.userId,
				addresseeId: id,
			},
		},
	  })
	// convention is to send an empty message for deletion
	reply.status(204).send()
}

export async function removeFriend(req, reply) {
	const id = req.user.id

	const result = await prisma.friendship.deleteMany({
		where: {
			status: 'ACCEPTED',
			OR: [
				{ requesterId: id, addresseeId: req.body.userId },
				{ requesterId: req.body.userId, addresseeId: id }
			]
		}
	});

	if (result.count === 0)
		throw new notFoundError("No accepted friendship found")
	
	reply.status(200).send({message: "friend removed successfully"});
}

export async function blockFriend(req, reply) {
	const id = req.user.id

	const result = await prisma.friendship.updateMany({
		where: {
			status: 'ACCEPTED',
			OR : [
				{ requesterId: id, addresseeId: req.body.userId },
				{ requesterId: req.body.userId, addresseeId: id }
			]
		},
		data: { status: 'BLOCKED'}
	})

	if (result.count === 0)
		throw new notFoundError("No accepted friendship found")

	reply.status(200).send({message: "friend blocked successfully"})
}

export async function searchUser(req, reply) {
	const {q: searchTerm, page = 1} = req.query
	const pageNum = parseInt(page, 10) || 1
	const limit = 10
	const skip = (pageNum - 1) * limit

	const users = await prisma.user.findMany({
		where: {
			OR: [
					{email: { startsWith: searchTerm}},
					{username: {startsWith: searchTerm}}
			],
		},
		select: sanitizedUserSelect,
		take: limit,
		skip: skip
	})
	reply.status(200).send({users: users})
}
