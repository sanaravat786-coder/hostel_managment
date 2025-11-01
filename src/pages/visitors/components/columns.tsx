"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

import { Visitor } from "../data/schema"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { format } from "date-fns"

interface ColumnsProps {
    onMarkExit: (visitor: Visitor) => void;
}

export const columns = ({ onMarkExit }: ColumnsProps): ColumnDef<Visitor>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Visitor Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[200px] truncate font-medium">
            {row.getValue("name")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "studentName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student Visited" />
    ),
    cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("studentName")}</div>
    },
  },
  {
    accessorKey: "in_time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="In Time" />
    ),
    cell: ({ row }) => {
        const inTime = row.getValue("in_time") as Date;
        return <div>{format(inTime, 'PPpp')}</div>
    },
  },
  {
    accessorKey: "out_time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Out Time" />
    ),
    cell: ({ row }) => {
        const outTime = row.getValue("out_time") as Date | null;
        return <div>{outTime ? format(outTime, 'PPpp') : 'N/A'}</div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant = status === 'Inside' ? 'destructive' : 'default';
      return (
        <Badge variant={variant}>
            {status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} onMarkExit={onMarkExit} />,
  },
]
