import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogVisitorForm } from "./components/log-visitor-form";
import { Visitor } from "./data/schema";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SimpleStudent {
  id: string;
  name: string;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [students, setStudents] = useState<SimpleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogVisitorOpen, setLogVisitorOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [visitorsRes, studentsRes] = await Promise.all([
        supabase
          .from('visitors')
          .select(`*, student:student_id(profiles(full_name))`)
          .order('in_time', { ascending: false }),
        supabase
          .from('students')
          .select('id, profiles!inner(full_name)')
      ]);

      const { data: visitorsData, error: visitorsError } = visitorsRes;
      if (visitorsError) throw visitorsError;

      const { data: studentsData, error: studentsError } = studentsRes;
      if (studentsError) throw studentsError;

      const formattedVisitors: Visitor[] = visitorsData.map((v: any) => ({
        id: v.id,
        name: v.visitor_name,
        contact: v.visitor_contact,
        studentName: v.student?.profiles?.full_name || 'N/A',
        purpose: v.purpose,
        in_time: new Date(v.in_time),
        out_time: v.out_time ? new Date(v.out_time) : null,
        status: v.out_time ? 'Checked Out' : 'Inside',
      }));
      setVisitors(formattedVisitors);

      const formattedStudents: SimpleStudent[] = studentsData.map((s: any) => ({
        id: s.id,
        name: s.profiles.full_name,
      }));
      setStudents(formattedStudents);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkExit = async (visitor: Visitor) => {
    const { error } = await supabase
      .from('visitors')
      .update({ out_time: new Date().toISOString() })
      .eq('id', visitor.id);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Marked exit for ${visitor.name}.`);
      fetchData();
    }
  };

  const onVisitorLogged = () => {
    fetchData();
    setLogVisitorOpen(false);
  };

  const tableColumns = columns({ onMarkExit: handleMarkExit });

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Visitors"
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Visitors", href: "/visitors" }
            ]}
          />
          <Dialog open={isLogVisitorOpen} onOpenChange={setLogVisitorOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Log Visitor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log New Visitor</DialogTitle>
                <DialogDescription>
                  Fill in the details below to log a new visitor entry.
                </DialogDescription>
              </DialogHeader>
              <LogVisitorForm onFinished={onVisitorLogged} students={students} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable data={visitors} columns={tableColumns}>
                <DataTableToolbar />
            </DataTable>
          )}
        </div>
      </div>
    </>
  );
}
