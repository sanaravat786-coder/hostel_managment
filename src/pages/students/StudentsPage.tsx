import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddStudentForm } from "./components/add-student-form";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Student } from "./data/schema";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        course,
        year,
        contact,
        profiles!inner (
          full_name,
          status
        ),
        rooms (
          id,
          room_no
        )
      `);

    if (error) {
      toast.error(error.message);
    } else {
      const formattedStudents: Student[] = data.map((s: any) => ({
        id: s.id,
        name: s.profiles.full_name,
        course: s.course,
        year: s.year,
        contact: s.contact,
        room: {
          id: s.rooms?.id || 'N/A',
          number: s.rooms?.room_no || 'Unassigned',
        },
        status: s.profiles.status,
      }));
      setStudents(formattedStudents);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  const onStudentAdded = () => {
    fetchStudents(); // Refetch students after a new one is added
    setDialogOpen(false); // Close the dialog
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Students"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Students", href: "/students" }
          ]}
        />
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new student record.
              </DialogDescription>
            </DialogHeader>
            <AddStudentForm onFinished={onStudentAdded} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-8">
        <DataTable data={students} columns={columns}>
            <DataTableToolbar />
        </DataTable>
      </div>
    </div>
  );
}
