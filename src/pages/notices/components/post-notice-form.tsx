import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }),
})

interface PostNoticeFormProps {
    onFinished: () => void;
}

export function PostNoticeForm({ onFinished }: PostNoticeFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast.error("You must be logged in to post a notice.");
      return;
    }
    setIsLoading(true);

    const { error } = await supabase
      .from('notices')
      .insert({
        posted_by: user.id,
        title: values.title,
        message: values.message,
      });

    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Notice posted successfully!");
      onFinished();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Maintenance Schedule Update" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter the full notice message here." rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Notice
            </Button>
        </div>
      </form>
    </Form>
  )
}
