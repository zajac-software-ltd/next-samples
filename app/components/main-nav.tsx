'use client'

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { AuthButton } from '@/components/AuthButton';
import { useAuth } from '@/hooks/useAuth';

const navContent = [
    { path: "/", label: "Home", match: /\/$/, requireAuth: false },
    { path: "/dashboard", label: "Dashboard", match: /\/dashboard(?:\/|$).*?$/, requireAuth: true },
] as const;

const adminNavContent = [
    { path: "/admin/users", label: "Manage Users", match: /\/admin\/users(?:\/|$).*?$/ },
] as const;

export function MainNav() {
    const currentPath = usePathname();
    const { isAuthenticated, isAdmin } = useAuth();

    const visibleNavContent = navContent.filter(item =>
        !item.requireAuth || isAuthenticated
    );

    const activePathId = useMemo(() => {
        const allVisibleContent = [...visibleNavContent, ...(isAdmin ? adminNavContent : [])];
        return allVisibleContent.findIndex(n => n.match.test(currentPath))
    }, [currentPath, visibleNavContent, isAdmin]);

    return (
        <div className="flex items-center justify-between w-full px-4 py-3 border-b">
            <div className="text-xl font-semibold">Logo</div>
            <nav className="hidden md:flex items-center gap-6">
                {visibleNavContent.map((navItem, index) => (
                    <NavLink key={`key${navItem.path}`} navItem={navItem} isActive={index === activePathId} />
                ))}
                {isAdmin && adminNavContent.map((navItem, index) => (
                    <AdminNavLink key={`admin-${navItem.path}`} navItem={navItem} isActive={visibleNavContent.length + index === activePathId} />
                ))}
            </nav>

            <div className="hidden md:block">
                <AuthButton />
            </div>

            {/* mobile*/}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className='p-3'>
                        <SheetTitle>Navigation</SheetTitle>
                        <div className="flex flex-col gap-4 mt-6">
                            {visibleNavContent.map((navItem, index) => (
                                <NavLink key={`mobile-${navItem.path}`} navItem={navItem} isActive={index === activePathId} />
                            ))}
                            {isAdmin && adminNavContent.map((navItem, index) => (
                                <AdminNavLink key={`mobile-admin-${navItem.path}`} navItem={navItem} isActive={visibleNavContent.length + index === activePathId} />
                            ))}
                            <div className="mt-4 pt-4 border-t">
                                <AuthButton />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}

const NavLink: React.FC<{ navItem: (typeof navContent)[number], isActive: boolean }> = ({ navItem: { path, label }, isActive }) => {
    return (
        <Link
            href={path}
            aria-current={isActive ? "page" : undefined}
            shallow
            className={cn("text-sm font-medium hover:underline underline-offset-4 transition-colors duration-200", isActive && "text-primary")}>
            {label}
        </Link>
    )
}

const AdminNavLink: React.FC<{ navItem: (typeof adminNavContent)[number], isActive: boolean }> = ({ navItem: { path, label }, isActive }) => {
    return (
        <Link
            href={path}
            aria-current={isActive ? "page" : undefined}
            shallow
            className={cn("text-sm font-medium hover:underline underline-offset-4 transition-colors duration-200", isActive && "text-primary")}>
            {label}
        </Link>
    )
}
