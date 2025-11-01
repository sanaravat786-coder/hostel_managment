import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { rooms } from "./data/data";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddRoomForm } from "./components/add-room-form";

export default function RoomsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Rooms"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Rooms", href: "/rooms" }
          ]}
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new room record.
              </DialogDescription>
            </DialogHeader>
            <AddRoomForm />
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-8">
        <DataTable data={rooms} columns={columns}>
            <DataTableToolbar />
        </DataTable>
      </div>
    </div>
  );
}
