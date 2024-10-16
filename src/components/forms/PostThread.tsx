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
import { ThreadValidation } from "@/lib/validation/thread";
import { createThread } from "@/lib/actions/thread.actions";


interface Props {
  userId: string
}

export default function PostThread({ userId }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: '',
      accountId: userId
    }
  });

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    await createThread({
      text: values.thread,
      author: userId,
      communityId: null!,
      path: pathname
    });
    router.push('/')
  }
  
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col justify-start gap-10">
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="mt-10 flex flex-col items-start gap-3 w-full">
              <FormLabel className="text-base-semibold text-light-2">
                Thread
              </FormLabel>
              <FormControl className="no-focus border border-dark-4 bg-dark-3 text-light-1">
                <Textarea
                  rows={15}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit"
          className="bg-primary-500"
        >Post Thread</Button>
      </form>
    </Form>
  )
}
