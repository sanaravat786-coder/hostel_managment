"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import { toast } from "sonner"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Complaint, complaintSchema } from "../data/schema"
import { supabase } from "@/lib/supabase"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onDataChange: () => void;
}

export function DataTableRowActions<TData>({
  row,
  onDataChange
}: DataTableRowActionsProps<TData>) {
  const complaint = complaintSchema.parse(row.original)
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusChange = async (status: string) => {
    setIsProcessing(true);
    const { error } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', complaint.id);

    setIsProcessing(false);
    if (error) {
      toast.error(`Failed to update status: ${error.message}`);
    } else {
      toast.success(`Complaint status updated to "${status}"`);
      onDataChange();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          disabled={isProcessing}
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>View Complaint</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup 
              value={complaint.status}
              onValueChange={handleStatusChange}
            >
                <DropdownMenuRadioItem value="Pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="In Progress">In Progress</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Resolved">Resolved</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
