import { fetchUser, fetchUsers } from "@/lib/actions/user.action";
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"


import ProfileHeader from "@/components/forms/ProfileHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { TabsContent } from "@radix-ui/react-tabs";
import ThreadsTab from "@/components/shared/ThreadsTab";
import UserCard from "@/components/cards/UserCard";

export default async function page({ params }: { params: { id: string } }) {
    const user = await currentUser();

    if (!user) return null;

    const userInfo = await fetchUser(user.id);

    if (!userInfo?.onboarded) redirect('/onboarding');

    // Fetch Users
  const fetchedUser = await fetchUsers({
    userId: user.id,
    searchString: '',
    pageNumber: 1,
    pageSize: 25,
    sortBy: 'desc'
  })
 
  return ( 
    <section>
      <h1 className="head-text mb-10">Search</h1>
    
      {/*  Search Bar */}

      <div className="mt-14 flex flex-col gap-9">
        {fetchedUser.users.length === 0 ? (
          <div className="no-result">No User</div>
        ):(
          <>
            {fetchedUser.users.map((person) => (
              <UserCard
                key={person.id}
                id={person.id}
                name={person.name}
                username={person.username}
                imgUrl={person.image}
                personType='User'
              />
            ))}
          </>
        )}
      </div>
    </section>
  )
}
