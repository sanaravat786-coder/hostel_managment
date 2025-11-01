import StatCard from "@/components/StatCard";
import { BedDouble, Users, Wallet, MessageSquareWarning, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DashboardStats {
  totalStudents: number;
  occupiedRooms: number;
  totalRooms: number;
  feesCollected: number;
  pendingComplaints: number;
}

interface FeeSummary {
  month: string;
  collected: number;
  pending: number;
}

interface OccupancySummary {
  name: string;
  occupied: number;
  total: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feeData, setFeeData] = useState<FeeSummary[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        // Fetch main stats (parallel execution)
        const statsPromise = Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('rooms').select('*', { count: 'exact', head: true }),
          supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('status', 'occupied'),
          supabase.from('transactions').select('paid_amount').gte('payment_date', startOfMonth).lte('payment_date', endOfMonth),
          supabase.from('complaints').select('*', { count: 'exact', head: true }).in('status', ['Pending', 'In Progress']),
        ]);

        // Fetch chart data (parallel execution)
        const chartsPromise = Promise.all([
          supabase.rpc('get_monthly_fee_summary'),
          supabase.rpc('get_block_occupancy'),
        ]);

        const [statsResults, chartsResults] = await Promise.all([statsPromise, chartsPromise]);

        const [
          { count: totalStudents, error: studentsError },
          { count: totalRooms, error: roomsError },
          { count: occupiedRooms, error: occupiedRoomsError },
          { data: transactionsData, error: transactionsError },
          { count: pendingComplaints, error: complaintsError },
        ] = statsResults;

        if (studentsError) throw studentsError;
        if (roomsError) throw roomsError;
        if (occupiedRoomsError) throw occupiedRoomsError;
        if (transactionsError) throw transactionsError;
        if (complaintsError) throw complaintsError;

        const feesCollected = transactionsData?.reduce((acc, t) => acc + t.paid_amount, 0) || 0;
        
        setStats({
          totalStudents: totalStudents || 0,
          occupiedRooms: occupiedRooms || 0,
          totalRooms: totalRooms || 0,
          feesCollected: feesCollected,
          pendingComplaints: pendingComplaints || 0,
        });

        const [
          { data: feeSummaryData, error: feeSummaryError },
          { data: occupancySummaryData, error: occupancySummaryError },
        ] = chartsResults;

        if (feeSummaryError) throw feeSummaryError;
        if (occupancySummaryError) throw occupancySummaryError;

        if (feeSummaryData) {
          const formattedFeeData = feeSummaryData.map((item: any) => ({
            month: item.month,
            collected: item.collected,
            pending: item.total - item.collected,
          }));
          setFeeData(formattedFeeData);
        }

        if (occupancySummaryData) {
          const formattedOccupancyData = occupancySummaryData.map((item: any) => ({
            name: `Block ${item.block}`,
            occupied: item.occupied,
            total: item.total,
          }));
          setOccupancyData(formattedOccupancyData);
        }

      } catch (error: any) {
        toast.error("Failed to load dashboard data: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const occupancyPercentage = stats && stats.totalRooms > 0 ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(0) : 0;
  const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-6">
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard 
          title="Total Students"
          value={stats?.totalStudents.toString() || '0'}
          icon={Users}
          description={`${stats?.totalStudents || 0} students enrolled`}
        />
        <StatCard 
          title="Rooms Occupied"
          value={`${stats?.occupiedRooms || 0} / ${stats?.totalRooms || 0}`}
          icon={BedDouble}
          description={`${occupancyPercentage}% occupancy rate`}
        />
        <StatCard 
          title="Fees Collected"
          value={currencyFormatter.format(stats?.feesCollected || 0)}
          icon={Wallet}
          description="Total fees received this month"
        />
        <StatCard 
          title="Pending Complaints"
          value={stats?.pendingComplaints.toString() || '0'}
          icon={MessageSquareWarning}
          description={`${stats?.pendingComplaints || 0} issues to resolve`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fee Collection Overview (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="collected" name="Collected" stroke="hsl(var(--primary))" />
                <Line type="monotone" dataKey="pending" name="Pending" stroke="hsl(var(--destructive))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Room Occupancy by Block</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="occupied" name="Occupied" fill="hsl(var(--primary))" />
                <Bar dataKey="total" name="Total" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
