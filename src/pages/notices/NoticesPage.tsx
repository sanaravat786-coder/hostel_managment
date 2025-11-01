import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { PostNoticeForm } from "./components/post-notice-form";
import { Notice } from "./data/schema";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPostNoticeOpen, setPostNoticeOpen] = useState(false);
  const { isAdmin } = useAuth();

  async function fetchNotices() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notices')
      .select(`*, profiles(full_name)`)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(error.message);
      setNotices([]);
    } else {
      const formattedData: Notice[] = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        postedBy: n.profiles.full_name,
        date: new Date(n.created_at),
      }));
      setNotices(formattedData);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchNotices();
  }, []);

  const onNoticePosted = () => {
    fetchNotices();
    setPostNoticeOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Notices"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Notices", href: "/notices" }
          ]}
        />
        {isAdmin && (
          <Dialog open={isPostNoticeOpen} onOpenChange={setPostNoticeOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Post Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Post a New Notice</DialogTitle>
                <DialogDescription>
                  This notice will be visible to all students and wardens.
                </DialogDescription>
              </DialogHeader>
              <PostNoticeForm onFinished={onNoticePosted} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center text-muted-foreground mt-16">No notices posted yet.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notices.map((notice) => (
              <Card key={notice.id}>
                <CardHeader>
                  <CardTitle>{notice.title}</CardTitle>
                  <CardDescription>Posted by {notice.postedBy} on {format(notice.date, 'PPP')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4">{notice.message}</p>
                </CardContent>
                <CardFooter>
                    <Button variant="link" className="p-0">Read More</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
