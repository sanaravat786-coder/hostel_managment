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
import { Fee } from "../data/schema"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  paymentMode: z.string({ required_error: "Please select a payment mode." }),
  paymentDate: z.date({ required_error: "Please select a payment date." }),
})

interface AddPaymentFormProps {
    fee: Fee;
    onFinished: () => void;
}

export function AddPaymentForm({ fee, onFinished }: AddPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        paymentDate: new Date(),
        amount: fee.balance,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const newPaidAmount = fee.paidAmount + values.amount;

    const { error } = await supabase
      .from('fees')
      .update({ paid_amount: newPaidAmount })
      .eq('id', fee.id);

    // We can also log the transaction in a separate table if needed
    // For now, just updating the fee record is enough.

    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Payment of ${values.amount} for ${fee.studentName} recorded successfully!`);
      onFinished();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Amount</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="col-span-3" />
              </FormControl>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentMode"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Mode</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="col-span-3">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage className="col-span-4 col-start-2" />
            </FormItem>
          )}
        />
        <div className="flex justify-end col-span-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Payment
            </Button>
        </div>
      </form>
    </Form>
  )
}
