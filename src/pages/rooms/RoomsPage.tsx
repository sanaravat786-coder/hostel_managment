import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddRoomForm } from "./components/add-room-form";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Room } from "./data/schema";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);

  async function fetchRooms() {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_no', { ascending: true });

    if (error) {
      toast.error(error.message);
      setRooms([]);
    } else {
      setRooms(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  const onRoomAdded = () => {
    fetchRooms();
    setDialogOpen(false);
  };

  const tableColumns = columns({ onDataChange: fetchRooms });

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
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
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
            <AddRoomForm onFinished={onRoomAdded} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <DataTable data={rooms} columns={tableColumns}>
              <DataTableToolbar />
          </DataTable>
        )}
      </div>
    </div>
  );
}
