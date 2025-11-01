import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { visitors } from "./data/data";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogVisitorForm } from "./components/log-visitor-form";
import { Visitor } from "./data/schema";
import { toast } from "sonner";

export default function VisitorsPage() {
  const [isLogVisitorOpen, setLogVisitorOpen] = useState(false);

  const handleMarkExit = (visitor: Visitor) => {
    // In a real app, you would call an API to update the visitor's out_time
    toast.info(`Marking exit for ${visitor.name}.`);
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
              <LogVisitorForm onFinished={() => setLogVisitorOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-8">
          <DataTable data={visitors} columns={tableColumns}>
              <DataTableToolbar />
          </DataTable>
        </div>
      </div>
    </>
  );
}
