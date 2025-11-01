import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitComplaintForm } from "./components/submit-complaint-form";
import { Complaint } from "./data/schema";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitComplaintOpen, setSubmitComplaintOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  async function fetchComplaints() {
    setLoading(true);
    
    let query = supabase
      .from('complaints')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        profiles ( full_name )
      `)
      .order('created_at', { ascending: false });

    // If user is not admin, only fetch their complaints
    if (!isAdmin && user) {
      query = query.eq('student_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      toast.error(error.message);
      setComplaints([]);
    } else {
      const formattedData: Complaint[] = data.map((c: any) => ({
        id: c.id,
        studentName: c.profiles.full_name,
        title: c.title,
        description: c.description,
        status: c.status,
        date: new Date(c.created_at),
      }));
      setComplaints(formattedData);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user, isAdmin]);

  const onComplaintSubmitted = () => {
    fetchComplaints();
    setSubmitComplaintOpen(false);
  };

  const tableColumns = columns({ onDataChange: fetchComplaints });

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Complaints"
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Complaints", href: "/complaints" }
            ]}
          />
          <Dialog open={isSubmitComplaintOpen} onOpenChange={setSubmitComplaintOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Submit Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit a New Complaint</DialogTitle>
                <DialogDescription>
                  Describe the issue you are facing. It will be forwarded to the concerned authority.
                </DialogDescription>
              </DialogHeader>
              <SubmitComplaintForm onFinished={onComplaintSubmitted} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable data={complaints} columns={tableColumns}>
                <DataTableToolbar />
            </DataTable>
          )}
        </div>
      </div>
    </>
  );
}
