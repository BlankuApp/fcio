import { ProfileForm } from "@/components/profile-form"

export default function ProfilePage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mt-4">Profile Settings</h1>
                    <p className="text-muted-foreground">Manage your account information and language preferences</p>
                </div>
            </div>
            <ProfileForm />
        </div>
    )
}
