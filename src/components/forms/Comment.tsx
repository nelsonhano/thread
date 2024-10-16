'use client'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";


import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, usePathname } from "next/navigation";
// import { updateUser } from "@/lib/actions/user.action";
import { CommentValidation } from "@/lib/validation/thread";
import { Input } from "../ui/input";
import Image from "next/image";
import { addCommentToThread } from "@/lib/actions/thread.actions";
// import { createThread } from "@/lib/actions/thread.actions";


interface Props {
    threadId: string,
    currentUserId: string,
    currentUserImg: string,
}

export default function Comment({
    threadId,
    currentUserId,
    currentUserImg
}: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const form = useForm({
        resolver: zodResolver(CommentValidation),
        defaultValues: {
            thread: '',
        }
    });
    const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
        await addCommentToThread(threadId, values.thread, JSON.parse(currentUserId), pathname);
        router.push('/');

        form.reset();
    }
  return (
    <div>
      <h1 className="text-white">Comment Form</h1>

          <Form {...form}>
              <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="comment-form">
                  <FormField
                      control={form.control}
                      name="thread"
                      render={({ field }) => (
                          <FormItem className="mt-10 flex items-center gap-3 w-full">
                              <FormLabel>
                                  <Image 
                                    src={currentUserImg}
                                    alt='Profiile image'
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover"
                                  />
                              </FormLabel>
                              <FormControl className="border-none bg-transparent">
                                  <Input
                                    type="text"
                                    placeholder="Comment..."
                                    className="no-focus text-light-1 outline-none"
                                      {...field}
                                  />
                              </FormControl>
                          </FormItem>
                      )}
                  />
                  <Button
                      type="submit"
                      className="comment-form_btn"
                  >Reply</Button>
              </form>
          </Form>
    </div>
  )
}
