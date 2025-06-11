'use client'

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
const navContent = [
    { path: "/", label: "Home", match: /\/$/ },
    { path: "/users-with-suspense", label: "Users (with suspense)", match: /\/users-with-suspense(?:\/|$).*?$/ },
    { path: "/catch-all-example", label: "Catch all example", match: /\/catch-all-example.*$/ }
] as const;

export function MainNav() {
    const currentPath = usePathname();

    const activePathId = useMemo(() => {
        return navContent.findIndex(n => n.match.test(currentPath))
    }, [currentPath, navContent]);

    return (
        <div className="flex items-center justify-between w-full px-4 py-3 border-b">
            <div className="text-xl font-semibold">Logo</div>
            <nav className="hidden md:flex items-center gap-6">
                {navContent.map((navItem, index) => (
                    <NavLink key={`key${navItem.path}`} navItem={navItem} isActive={index === activePathId} />
                ))}
            </nav>

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
                            {navContent.map((navItem, index) => (
                                <NavLink key={`key${navItem.path}`} navItem={navItem} isActive={index === activePathId} />
                            ))}
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
