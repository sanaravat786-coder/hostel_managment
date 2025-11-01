import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { complaints } from "./data/data";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitComplaintForm } from "./components/submit-complaint-form";

export default function ComplaintsPage() {
  const [isSubmitComplaintOpen, setSubmitComplaintOpen] = useState(false);

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
              <SubmitComplaintForm onFinished={() => setSubmitComplaintOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-8">
          <DataTable data={complaints} columns={columns}>
              <DataTableToolbar />
          </DataTable>
        </div>
      </div>
    </>
  );
}
