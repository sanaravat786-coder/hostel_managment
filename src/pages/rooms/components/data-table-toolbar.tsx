"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter"

const statuses = [
    { value: "vacant", label: "Vacant" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Maintenance" },
]

const blocks = [
    { value: "A", label: "Block A" },
    { value: "B", label: "Block B" },
    { value: "C", label: "Block C" },
    { value: "D", label: "Block D" },
]

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by room no..."
          value={(table.getColumn("room_no")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("room_no")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn("block") && (
            <DataTableFacetedFilter
                column={table.getColumn("block")}
                title="Block"
                options={blocks}
            />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
