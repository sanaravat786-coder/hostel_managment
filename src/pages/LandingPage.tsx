import { NavLink } from 'react-router-dom';
import { Building2, ShieldCheck, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <NavLink to="/" className="flex items-center justify-center">
          <Building2 className="h-6 w-6" />
          <span className="ml-2 font-semibold">Hostel Management System</span>
        </NavLink>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <NavLink
            to="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Login
          </NavLink>
          <Button asChild>
            <NavLink to="/signup">Get Started</NavLink>
          </Button>
          <ModeToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    The All-In-One Hostel Management Solution
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Streamline your operations, from student registration to fee collection, with our powerful and intuitive system.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <NavLink to="/signup">Get Started</NavLink>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                     <NavLink to="#">Learn More</NavLink>
                  </Button>
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1517840901100-8179e982acb7?q=80&w=2070&auto=format&fit=crop"
                width="550"
                height="550"
                alt="Hero"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Manage Your Hostel</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides a comprehensive suite of tools to simplify hostel administration for staff and students alike.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <div className="grid gap-1 text-center">
                <Users className="h-8 w-8 mx-auto" />
                <h3 className="text-lg font-bold">Student Management</h3>
                <p className="text-sm text-muted-foreground">
                  Easily manage student records, room allocations, and personal details in one centralized database.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <Wallet className="h-8 w-8 mx-auto" />
                <h3 className="text-lg font-bold">Fee Collection</h3>
                <p className="text-sm text-muted-foreground">
                  Automate fee tracking, payment collection, and receipt generation with our integrated billing system.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <ShieldCheck className="h-8 w-8 mx-auto" />
                <h3 className="text-lg font-bold">Complaint & Visitor Logs</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain secure and organized logs for student complaints and visitor entries, ensuring safety and accountability.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Hostel Management System. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <NavLink to="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </NavLink>
          <NavLink to="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </NavLink>
        </nav>
      </footer>
    </div>
  );
}
