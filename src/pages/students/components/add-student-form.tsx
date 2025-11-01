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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  contact: z.string().min(10, { message: "Contact number must be at least 10 digits." }),
  course: z.string({ required_error: "Please select a course." }),
  year: z.coerce.number().min(1).max(5),
})

interface AddStudentFormProps {
  onFinished: () => void;
}

export function AddStudentForm({ onFinished }: AddStudentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      contact: "",
      year: 1,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    // Step 1: Create a new user for the student
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.name,
          role: 'student',
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      // Step 2: Insert into the students table using the new user's ID
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          id: authData.user.id, // Link to the user profile
          course: values.course,
          year: values.year,
          contact: values.contact,
        });

      if (studentError) {
        toast.error(`Failed to create student record: ${studentError.message}`);
        // Potentially delete the created user for cleanup
        // await supabase.auth.admin.deleteUser(authData.user.id)
      } else {
        toast.success("Student added successfully! Verification email sent.");
        onFinished();
      }
    }
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Name</FormLabel>
              <FormControl>
                <Input {...field} className="col-span-3" />
              </FormControl>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Email</FormLabel>
              <FormControl>
                <Input {...field} className="col-span-3" />
              </FormControl>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} className="col-span-3" />
              </FormControl>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Contact</FormLabel>
              <FormControl>
                <Input {...field} className="col-span-3" />
              </FormControl>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="course"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Course</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="col-span-3">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mechanical Eng.">Mechanical Eng.</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Civil Eng.">Civil Eng.</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Year</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="col-span-3" />
              </FormControl>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
        <div className="flex justify-end col-span-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
        </div>
      </form>
    </Form>
  )
}
