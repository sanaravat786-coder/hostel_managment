import StatCard from "@/components/StatCard";
import { BedDouble, Users, Wallet, MessageSquareWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';

const feeData: any[] = [];

const occupancyData: any[] = [];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard 
          title="Total Students"
          value="0"
          icon={Users}
          description="No data available"
        />
        <StatCard 
          title="Rooms Occupied"
          value="0 / 0"
          icon={BedDouble}
          description="0% occupancy rate"
        />
        <StatCard 
          title="Fees Collected"
          value="₹0"
          icon={Wallet}
          description="No data available"
        />
        <StatCard 
          title="Pending Complaints"
          value="0"
          icon={MessageSquareWarning}
          description="No data available"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fee Collection Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="collected" stroke="hsl(var(--primary))" />
                <Line type="monotone" dataKey="pending" stroke="hsl(var(--destructive))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Room Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="occupied" fill="hsl(var(--primary))" />
                <Bar dataKey="total" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
