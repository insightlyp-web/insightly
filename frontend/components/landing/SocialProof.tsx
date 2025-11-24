"use client";

import { motion } from "framer-motion";

const testimonials = [
    {
        quote: "Taking attendance now takes 10 seconds.",
        author: "Prof. Anjali",
        role: "CSE Department",
    },
    {
        quote: "I got my internship offer without printing a single résumé.",
        author: "Abhi",
        role: "4th year student",
    },
];

const logos = ["React", "Next.js", "Tailwind", "Supabase", "FastAPI"];

export default function SocialProof() {
    return (
        <section className="py-20 bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-6 space-y-16">
                {/* Testimonials */}
                <div className="grid md:grid-cols-2 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            className="glass p-8 rounded-3xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-cyan/20 to-brand-lavender/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                            <p className="text-2xl font-medium text-slate-800 mb-6 relative z-10">"{t.quote}"</p>
                            <div>
                                <div className="font-bold text-slate-900">{t.author}</div>
                                <div className="text-slate-500 text-sm">{t.role}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Logos */}
                <div className="relative overflow-hidden py-8">
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10" />

                    <div className="flex justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {logos.map((logo) => (
                            <span key={logo} className="text-xl font-bold text-slate-400">{logo}</span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
