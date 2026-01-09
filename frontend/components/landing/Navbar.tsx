"use client";
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
                scrolled ? "glass shadow-sm py-3" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-0">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative">
                        <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                            Insightly
                        </span>
                        <GraduationCap className="w-3 h-3 text-brand-cyan absolute -top-1 right-[0.35rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="w-1.5 h-1.5 bg-brand-cyan rounded-full absolute top-0.5 right-[0.85rem]" />
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="px-4 py-1.5 md:px-5 md:py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-full hover:border-brand-cyan hover:text-brand-cyan hover:shadow-[0_0_15px_rgba(165,243,252,0.5)] transition-all duration-300"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </nav>
    );
}
