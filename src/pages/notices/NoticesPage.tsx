import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { notices } from "./data/data";
import { format } from "date-fns";
import { PostNoticeForm } from "./components/post-notice-form";

export default function NoticesPage() {
  const [isPostNoticeOpen, setPostNoticeOpen] = useState(false);

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
            <PostNoticeForm onFinished={() => setPostNoticeOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notices.map((notice) => (
          <Card key={notice.id}>
            <CardHeader>
              <CardTitle>{notice.title}</CardTitle>
              <CardDescription>Posted on {format(notice.date, 'PPP')}</CardDescription>
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
    </div>
  );
}
