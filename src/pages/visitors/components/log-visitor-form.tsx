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
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"

const formSchema = z.object({
  visitor_name: z.string().min(2, { message: "Visitor name is required." }),
  visitor_contact: z.string().min(10, { message: "Contact number is required." }),
  student_id: z.string().uuid({ message: "Please select a student." }),
  purpose: z.string().min(5, { message: "Purpose of visit is required." }),
})

interface LogVisitorFormProps {
    onFinished: () => void;
    students: { id: string; name: string }[];
}

export function LogVisitorForm({ onFinished, students }: LogVisitorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitor_name: "",
      visitor_contact: "",
      student_id: "",
      purpose: "",
    },
  })

  const studentOptions = students.map(s => ({ label: s.name, value: s.id }));

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { error } = await supabase
      .from('visitors')
      .insert({
        ...values,
        in_time: new Date().toISOString(),
      });

    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Visitor logged successfully!");
      onFinished();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="visitor_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visitor Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="visitor_contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact No.</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Student to Visit</FormLabel>
              <Combobox
                options={studentOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select a student..."
                searchPlaceholder="Search students..."
                emptyText="No student found."
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose of Visit</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Visitor
            </Button>
        </div>
      </form>
    </Form>
  )
}
