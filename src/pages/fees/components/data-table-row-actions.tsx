"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"

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

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onAddPayment: (fee: Fee) => void;
}

export function DataTableRowActions<TData>({
  row,
  onAddPayment
}: DataTableRowActionsProps<TData>) {
  const fee = row.original as Fee;
  return (
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
        <DropdownMenuItem onClick={() => onAddPayment(fee)}>
            Add Payment
        </DropdownMenuItem>
        <DropdownMenuItem>View Payments</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Generate Receipt</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Delete Record
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
