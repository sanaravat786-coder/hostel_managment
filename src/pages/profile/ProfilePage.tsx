import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const profileFormSchema = z.object({
    fullName: z.string().min(2, "Full name is required."),
    email: z.string().email(),
});

const passwordFormSchema = z.object({
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ProfilePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState({ profile: false, password: false });

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            fullName: "",
            email: "",
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (user) {
            profileForm.reset({
                fullName: user.user_metadata.full_name || "",
                email: user.email || "",
            });
        }
    }, [user, profileForm]);

    async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
        if (!user) return;
        setIsLoading(prev => ({ ...prev, profile: true }));

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: values.fullName })
            .eq('id', user.id);

        if (profileError) {
            toast.error(profileError.message);
            setIsLoading(prev => ({ ...prev, profile: false }));
            return;
        }

        const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: values.fullName }
        });

        setIsLoading(prev => ({ ...prev, profile: false }));
        if (authError) {
            toast.error(authError.message);
        } else {
            toast.success("Profile updated successfully!");
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
        setIsLoading(prev => ({ ...prev, password: true }));
        const { error } = await supabase.auth.updateUser({ password: values.newPassword });

        setIsLoading(prev => ({ ...prev, password: false }));
        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password changed successfully! Please log in again.");
            passwordForm.reset();
            await supabase.auth.signOut();
            navigate('/login');
        }
    }

    return (
        <div>
            <PageHeader
                title="Profile"
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin/dashboard" },
                    { label: "Profile", href: "/profile" }
                ]}
            />
            <div className="mt-8">
                <Tabs defaultValue="profile" className="max-w-2xl mx-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your personal details here.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...profileForm}>
                                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                        <FormField
                                            control={profileForm.control}
                                            name="fullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" {...field} readOnly disabled />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-end">
                                            <Button type="submit" disabled={isLoading.profile}>
                                                {isLoading.profile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Update Profile
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="password">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>Update your password here. After saving, you will be logged out.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...passwordForm}>
                                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                        <FormField
                                            control={passwordForm.control}
                                            name="newPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>New Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={passwordForm.control}
                                            name="confirmPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirm New Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-end">
                                            <Button type="submit" disabled={isLoading.password}>
                                                {isLoading.password && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Change Password
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
