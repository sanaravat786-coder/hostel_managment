"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import { useState } from "react"
import { toast } from "sonner"
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
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Fee } from "../data/schema"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onAddPayment: (fee: Fee) => void;
  onDataChange: () => void;
  isAdmin: boolean;
}

export function DataTableRowActions<TData>({
  row,
  onAddPayment,
  onDataChange,
  isAdmin
}: DataTableRowActionsProps<TData>) {
  const fee = row.original as Fee;
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async () => {
    setIsProcessing(true);
    const { error } = await supabase.from('fee_records').delete().eq('id', fee.id);
    setIsProcessing(false);
    setDeleteDialogOpen(false);

    if (error) {
      toast.error(`Failed to delete fee record: ${error.message}`);
    } else {
      toast.success(`Fee record deleted successfully.`);
      onDataChange();
    }
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this fee record and all associated transactions.
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
          {isAdmin && fee.status !== 'Paid' && (
            <DropdownMenuItem onClick={() => onAddPayment(fee)}>
              Add Payment
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>View Transactions</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Generate Receipt</DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDeleteDialogOpen(true)} className="text-red-600">
                Delete Record
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
