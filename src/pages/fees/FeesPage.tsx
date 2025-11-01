import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { fees } from "./data/data";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Fee } from "./data/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddPaymentForm } from "./components/add-payment-form";

export default function FeesPage() {
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  const handleAddPayment = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const tableColumns = columns({ onAddPayment: handleAddPayment });

  return (
    <>
      <div>
        <PageHeader 
          title="Fees"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Fees", href: "/fees" }
          ]}
        />
        <div className="mt-8">
          <DataTable data={fees} columns={tableColumns}>
              <DataTableToolbar />
          </DataTable>
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a new payment for {selectedFee?.studentName}.
            </DialogDescription>
          </DialogHeader>
          {selectedFee && <AddPaymentForm fee={selectedFee} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
