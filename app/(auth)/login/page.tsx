import { LoginForm } from './components/login-form';

export const metadata = {
    title: 'Login - School ERP',
    description: 'Sign in to the School Management System',
};

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-vh-[100dvh] bg-muted/20 relative py-20 min-h-screen">
            <div className="absolute inset-0 z-0 bg-grid-slate-200/50 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)] dark:bg-grid-slate-800/50 dark:[mask-image:linear-gradient(to_bottom,black_20%,transparent_100%)]"></div>
            <div className="z-10 w-full px-4">
                <LoginForm />
            </div>
        </div>
    );
}
