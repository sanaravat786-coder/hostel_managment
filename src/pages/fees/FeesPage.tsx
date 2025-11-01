import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/data-table";
import { columns } from "./components/columns";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { Fee } from "./data/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddPaymentForm } from "./components/add-payment-form";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const { user, isAdmin } = useAuth();

  async function fetchFees() {
    setLoading(true);

    let query = supabase
      .from('fee_details')
      .select(`*`)
      .order('created_at', { ascending: false });

    if (!isAdmin && user) {
      query = query.eq('student_id', user.id);
    }
    
    const { data, error } = await query;

    if (error) {
      toast.error(error.message);
      setFees([]);
    } else {
      const formattedData: Fee[] = data.map((f: any) => ({
        id: f.id,
        studentId: f.student_id,
        studentName: f.student_name,
        totalAmount: f.total_amount,
        paidAmount: f.paid_amount,
        balance: f.balance,
        status: f.status,
      }));
      setFees(formattedData);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      fetchFees();
    }
  }, [user, isAdmin]);

  const handleAddPayment = (fee: Fee) => {
    if (!isAdmin) {
      toast.error("Only admins can add payments.");
      return;
    }
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const onPaymentAdded = () => {
    fetchFees();
    setPaymentDialogOpen(false);
  }

  const tableColumns = columns({ onAddPayment: handleAddPayment, onDataChange: fetchFees, isAdmin });

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
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable data={fees} columns={tableColumns}>
                <DataTableToolbar />
            </DataTable>
          )}
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
            <DialogDescription>
              Record a new payment for {selectedFee?.studentName}. Current balance is {selectedFee?.balance}.
            </DialogDescription>
          </DialogHeader>
          {selectedFee && <AddPaymentForm fee={selectedFee} onFinished={onPaymentAdded} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
