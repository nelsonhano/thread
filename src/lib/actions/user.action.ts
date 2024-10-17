"use server"

import { revalidatePath } from "next/cache";
import User, { IUser } from "../models/user.model";
import { connectToDatabase } from "../mongoose"
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

interface Params {
    userId: string,
    username: string,
    name: string,
    bio: string,
    image: string,
    path: string,
}

export async function updateUser({
    userId,
    username,
    name,
    bio,
    image,
    path,
}: Params): Promise<void> {
    await connectToDatabase();

    try {
        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLocaleLowerCase(),
                name,
                bio,
                image,
                onboarded: true
            },
            { upsert: true }
        );

        if (path === '/profile/edit') {
            revalidatePath(path)
        }
    } catch (error: any) {
        throw new Error(`Failed to create/update user: ${error.message}`);
    }
}

export async function fetchUser(userId: string) {
    try {
        await connectToDatabase();

        return await User
            .findOne({ id: userId })
        // .populate({
        //     path: 'communities',
        //     model: Community
        // })
    } catch (error: any) {
        throw new Error(`Failed to fetch user: ${error.message}`);

    }
}

export async function fetchUserPost(userId: string) {
    try {
        connectToDatabase();

        // find all threads authored by user with the given userId

        // TODO: populate community
        const threads = await User.findOne({ id: userId })
            .populate({
                path: 'threads',
                model: Thread,
                populate: {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: 'name image id'
                    }
                }
            })

            return threads;
    } catch (error: any) {
        throw new Error(`Error trying to get threads authored by user with the given userId: ${error.message}`);
        
    }
}

// export async function fetchUsers({
//     userId,
//     searchString,
//     pageNumber = 1,
//     pageSize = 10,
//     sortBy = 'desc'
// }: {
//     userId: string,
//     searchString?: string,
//     pageNumber?: number,
//     pageSize?: number,
//     sortBy: SortOrder
// }) {
//     try {
//         await connectToDatabase();

//         const skipAmount = (pageNumber - 1) * pageSize;
//         const regex = searchString ? new RegExp(searchString, 'i') : null;

//         const query: FilterQuery<IUser> = {
//             _id: { $ne: userId } // use `_id` for MongoDB user ID
//         };

//         if (searchString?.trim() !== '' && regex) {
//             query.$or = [
//                 { username: { $regex: regex } },
//                 { name: { $regex: regex } }
//             ];
//         }

//         const sortOptions = { createdAt: sortBy };

//         const userQuery = User.find(query)
//             .sort(sortOptions)
//             .skip(skipAmount)
//             .limit(pageSize);

//         const totalUsersCount = await User.countDocuments(query);

//         const users = await userQuery.exec();

//         const isNext = totalUsersCount > skipAmount + users.length;

//         return { users, isNext };
//     } catch (error: any) {
//         console.log(error);

//         // Return an empty result on error to avoid 'undefined'
//         return { users: [], isNext: false };
//     }
// }



// Almost similar to Thead (search + pagination) and Community (search + pagination)

export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc",
}: {
    userId: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: 'asc' | 'desc';
}) {
    try {
        await connectToDatabase();

        // Calculate the number of users to skip based on the page number and page size.
        const skipAmount = (pageNumber - 1) * pageSize;

        // Create a case-insensitive regular expression for the provided search string.
        const regex = new RegExp(searchString, "i");

        // Create an initial query object to filter users.
        const query: FilterQuery<IUser> = {
            id: { $ne: userId }, // Exclude the current user from the results.
        };

        // If the search string is not empty, add the $or operator to match either username or name fields.
        if (searchString.trim() !== "") {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } },
            ];
        }

        // Define the sort options for the fetched users based on createdAt field and provided sort order.
        const sortOptions = { createdAt: sortBy };

        const usersQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        // Count the total number of users that match the search criteria (without pagination).
        const totalUsersCount = await User.countDocuments(query);

        const users = await usersQuery.exec();

        // Check if there are more users beyond the current page.
        const isNext = totalUsersCount > skipAmount + users.length;

        return { users, isNext };
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}

export async function getActivity(userId: string) {
    try {
        await connectToDatabase();

        //find all threads created by the user
        const userThreads = await Thread.find({ author: userId});

        // collect all the child thread ids (replies) from the 'children' field

        const childThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children)
        },[])

        const replies = await Thread.find({
            _id: { $in: childThreadIds },
            author: { $ne: userId } 
        }).populate({
            path: 'author',
            model: User,
            select: 'name image _id'
        })

        return  replies
    } catch (error: any) {
        throw new Error(`Failed to fetch activity: ${error.message}`);
        
    }
}