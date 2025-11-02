import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Download, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import { useState } from "react";

const formSchema = z.object({
    reportType: z.string({ required_error: "Please select a report type." }),
    dateRange: z.object({
        from: z.date(),
        to: z.date(),
    }),
});

export default function ReportsPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dateRange: {
                from: new Date(new Date().setDate(new Date().getDate() - 30)),
                to: new Date(),
            }
        },
    });

    const downloadCSV = (data: any[], fileName: string) => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsGenerating(true);
        toast.info(`Generating ${values.reportType} report...`);

        try {
            const { from, to } = values.dateRange;
            const toDate = new Date(to);
            toDate.setDate(toDate.getDate() + 1);

            let data;
            let fileName = `${values.reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`;

            switch (values.reportType) {
                case 'students': {
                    const { data: students, error } = await supabase
                        .from('students')
                        .select('id, course, year, contact, profiles!inner(full_name, email, status), rooms(room_no)');
                    if (error) throw error;
                    data = students.map((s: any) => ({
                        'ID': s.id,
                        'Name': s.profiles.full_name,
                        'Email': s.profiles.email,
                        'Course': s.course,
                        'Year': s.year,
                        'Contact': s.contact,
                        'Room No': s.rooms?.room_no || 'N/A',
                        'Status': s.profiles.status,
                    }));
                    break;
                }
                case 'fees_summary': {
                    const { data: fees, error } = await supabase
                        .from('fee_details')
                        .select('*')
                        .gte('created_at', from.toISOString())
                        .lt('created_at', toDate.toISOString());
                    if (error) throw error;
                    data = fees.map((f: any) => ({
                        'Student Name': f.student_name,
                        'Total Amount': f.total_amount,
                        'Paid Amount': f.paid_amount,
                        'Balance': f.balance,
                        'Status': f.status,
                    }));
                    break;
                }
                case 'visitor_log': {
                    const { data: visitors, error } = await supabase
                        .from('visitors')
                        .select('*, student:student_id(profiles(full_name))')
                        .gte('in_time', from.toISOString())
                        .lt('in_time', toDate.toISOString());
                    if (error) throw error;
                    data = visitors.map((v: any) => ({
                        'Visitor Name': v.visitor_name,
                        'Visitor Contact': v.visitor_contact,
                        'Student Visited': v.student.profiles.full_name,
                        'Purpose': v.purpose,
                        'In Time': format(new Date(v.in_time), 'PPpp'),
                        'Out Time': v.out_time ? format(new Date(v.out_time), 'PPpp') : 'Inside',
                    }));
                    break;
                }
                case 'complaints': {
                    const { data: complaints, error } = await supabase
                        .from('complaints')
                        .select('*, student:student_id(profiles(full_name))')
                        .gte('created_at', from.toISOString())
                        .lt('created_at', toDate.toISOString());
                    if (error) throw error;
                    data = complaints.map((c: any) => ({
                        'Complaint ID': c.id,
                        'Student Name': c.student.profiles.full_name,
                        'Title': c.title,
                        'Status': c.status,
                        'Date': format(new Date(c.created_at), 'PP'),
                    }));
                    break;
                }
                default:
                    throw new Error('Invalid report type');
            }

            if (data && data.length > 0) {
                downloadCSV(data, fileName);
                toast.success("Report generated and downloaded successfully!");
            } else {
                toast.info("No data found for the selected criteria.");
            }

        } catch (error: any) {
            toast.error(`Failed to generate report: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Reports"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin/dashboard" },
                    { label: "Reports", href: "/reports" }
                ]}
            />
            <div className="mt-8">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Generate Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="reportType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Report Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a report to generate" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="students">Student List</SelectItem>
                                                    <SelectItem value="fees_summary">Fees Summary</SelectItem>
                                                    <SelectItem value="visitor_log">Visitor Log</SelectItem>
                                                    <SelectItem value="complaints">Complaints</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dateRange"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date range</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value?.from ? (
                                                                field.value.to ? (
                                                                    <>
                                                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                                                        {format(field.value.to, "LLL dd, y")}
                                                                    </>
                                                                ) : (
                                                                    format(field.value.from, "LLL dd, y")
                                                                )
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        initialFocus
                                                        mode="range"
                                                        defaultMonth={field.value?.from}
                                                        selected={{ from: field.value.from, to: field.value.to }}
                                                        onSelect={field.onChange}
                                                        numberOfMonths={2}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button type="submit" disabled={isGenerating}>
                                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Download className="mr-2 h-4 w-4" />
                                        Generate & Download
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
