"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { studentSchema } from "../data/schema"
import { Loader2 } from "lucide-react"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onDataChange: () => void;
}

export function DataTableRowActions<TData>({
  row,
  onDataChange,
}: DataTableRowActionsProps<TData>) {
  const student = studentSchema.parse(row.original)
  const [isStatusSubmenuOpen, setStatusSubmenuOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusChange = async (status: 'active' | 'inactive') => {
    setIsProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .update({ status: status })
      .eq('id', student.id);
    
    setIsProcessing(false);
    if (error) {
      toast.error(`Failed to update status: ${error.message}`);
    } else {
      toast.success(`Student status updated to "${status}"`);
      onDataChange();
    }
    setStatusSubmenuOpen(false);
  }

  const handleDelete = async () => {
    setIsProcessing(true);
    const { error } = await supabase.rpc('delete_user_and_profile', { user_id: student.id });
    
    setIsProcessing(false);
    setDeleteDialogOpen(false);
    if (error) {
      toast.error(`Failed to delete student: ${error.message}`);
    } else {
      toast.success("Student deleted successfully.");
      onDataChange();
    }
  }

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              student's account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub onOpenChange={setStatusSubmenuOpen} open={isStatusSubmenuOpen}>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup 
                value={student.status}
                onValueChange={(value) => handleStatusChange(value as 'active' | 'inactive')}
              >
                  <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="inactive">Inactive</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDeleteDialogOpen(true)} className="text-red-600">
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
