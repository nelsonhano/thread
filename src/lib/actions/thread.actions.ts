'use server'

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import Community from "../models/community.model";
import { connectToDatabase } from "../mongoose"

interface Params {
    text: string,
    author: string,
    communityId?: string | null,
    path: string
}

export async function createThread({
    text,
    author,
    communityId,
    path
}: Params) {
    try {
        await connectToDatabase();

        // Resolve community if provided (supports either Mongo _id or custom community.id)
        let communityDoc = null as any;
        if (communityId) {
            try {
                communityDoc = await Community.findById(communityId);
            } catch {}
            if (!communityDoc) {
                communityDoc = await Community.findOne({ id: communityId });
            }
        }

        // Create thread
        const createdThread = await Thread.create({
            text,
            author,
            community: communityDoc ? communityDoc._id : null,
        });

        // Update user model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id }
        });

        // If thread belongs to a community, link it on the community document
        if (communityDoc) {
            await Community.findByIdAndUpdate(communityDoc._id, {
                $push: { threads: createdThread._id }
            });
        }

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Error creating a thread ${error.message}`);
    }
}

export async function fetchPost(pageNum = 1, pageSize = 20) {
    try {
        await connectToDatabase();

        const skipAmount = (pageNum - 1) * pageSize;

        // Fetch the posts that have no parents (only top-level threads)
        const getThreads = Thread.find({
            parentId: { $in: [null, undefined] } // Correct query
        })
            .sort({ createdAt: 'desc' })
            .skip(skipAmount)
            .limit(pageSize)
            .populate({ path: 'author', model: User })
            .populate({
                path: 'children',
                populate: {
                    path: 'author',
                    model: User,
                    select: '_id name parentId image'
                }
            });

        const totalPostCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } });
        const posts = await getThreads.exec();
        const isNext = totalPostCount > skipAmount + posts.length;

        return { posts, isNext };
    } catch (error: any) {
        console.log(`Error while fetching the thread post: ${error.message}`);
    }
}

export async function fetchThreadById(threadId: string) {
    try {
        await connectToDatabase()

        // TODO: Populate Community
        const thread = await Thread.findById(threadId)
            .populate({
                path: 'author',
                model: User,
                select: '_id id name parentId image'
            })
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author',
                        model: User,
                        select: '_id id name parentId image'
                    },
                    {
                        path: 'children',
                        model: Thread,
                        populate: {
                            path: 'author',
                            model: User,
                            select: '_id id name parentId image'
                        }
                    }
                ]
            }).exec();

        return thread
    } catch (error: any) {
        throw new Error(`Error fetching thread: ${error.message}`);
    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) {
    try {
        await connectToDatabase();

        // find the original thread
        const originalThread = await Thread.findById(threadId);

        if (!originalThread) throw new Error("Thread Not Found");

        // create a new thread with the comment text
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId
        });

        // save the new thread
        const savedCommentThread = await commentThread.save();

        // update the original thread to include the new comment
        originalThread.children.push(savedCommentThread._id);

        // save the original thread 
        await originalThread.save();

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Error when creating comment to thread: ${error.message}`);

    }
}