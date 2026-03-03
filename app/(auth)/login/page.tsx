import { LoginForm } from './components/login-form';

export const metadata = {
    title: 'Login - School ERP',
    description: 'Sign in to the School Management System',
};

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-vh-[100dvh] bg-slate-50 relative py-20 min-h-screen">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="z-10 w-full px-4">
                <LoginForm />
            </div>
        </div>
    );
}
