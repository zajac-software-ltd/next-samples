"use client"
import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    size?: "xs" | "sm" | "md" | "xl";
}
const Spinner: React.FC<Props> = ({ size = "sm" }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const sizeStyle = useMemo(() => {
        switch (size) {
            case "xs":
                return "h-5 w-5";
            case "sm":
                return "h-7 w-7";
            case "xl":
                return "h-20 w-20";
        }
        return "h-15 w-15"; // md; 
    }, [size])

    return (
        <LoaderCircle
            className={
                cn(
                    sizeStyle,
                    "animate-spin text-primary duration-500 opacity-0",
                    mounted && "opacity-100"
                )}
        />
    )
};

export default Spinner;