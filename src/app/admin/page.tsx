import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/auth/server-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, Settings, BarChart, Shield } from 'lucide-react'

export default async function AdminDashboardPage() {
    // Check if user is authenticated and is admin
    const user = await getCurrentUser()
    const adminStatus = await isAdmin()

    if (!user) {
        redirect('/') // Redirect to home if not authenticated
    }

    if (!adminStatus) {
        redirect('/') // Redirect to home if not admin
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground">
                            Manage your application and monitor key metrics
                        </p>
                    </div>
                </div>
                <Badge variant="secondary" className="h-6">
                    Admin
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,234</div>
                        <p className="text-xs text-muted-foreground">
                            +20% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flashcard Sets</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5,678</div>
                        <p className="text-xs text-muted-foreground">
                            +180 from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground">
                            +201 since yesterday
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Healthy</div>
                        <p className="text-xs text-muted-foreground">
                            All systems operational
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest user actions and system events
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {/* Add your recent activity list here */}
                            <div className="flex items-center">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        User Management
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        View and manage all users in the system
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Admin Actions</CardTitle>
                        <CardDescription>
                            Quick access to admin features
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4 rounded-md border p-4">
                                <Users className="h-6 w-6" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        User Management
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Manage users and permissions
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 rounded-md border p-4">
                                <BookOpen className="h-6 w-6" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        Content Management
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Manage flashcards and decks
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 rounded-md border p-4">
                                <Settings className="h-6 w-6" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        System Settings
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Configure application settings
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
