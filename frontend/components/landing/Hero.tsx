"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/20 via-brand-lavender/20 to-brand-mint/20 -z-20" />

            {/* Animated Shapes */}
            <motion.div
                className="absolute top-20 left-10 w-64 h-64 bg-brand-cyan/30 rounded-full blur-3xl"
                animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-20 right-10 w-96 h-96 bg-brand-lavender/30 rounded-full blur-3xl"
                animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Text Content */}
                <div className="space-y-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]"
                    >
                        Run your campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">smart.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl text-slate-600 max-w-lg"
                    >
                        AI-powered attendance, academics & placements — all connected in one secure Supabase cloud.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-wrap gap-8 pt-4"
                    >
                        {[
                            { label: "Active Users", value: "10k+" },
                            { label: "Attendance Mark", value: "<400ms" },
                            { label: "Uptime", value: "99.9%" },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                                <span className="text-sm text-slate-500 font-medium uppercase tracking-wide">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Hero Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative h-[600px] w-full flex items-center justify-center"
                >
                    {/* 3D University Silhouette */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-80">
                        <Image
                            src="/hero-bg.png"
                            alt="University Silhouette"
                            width={800}
                            height={800}
                            className="object-contain w-full h-full animate-float"
                            priority
                        />
                    </div>

                    {/* Floating QR Code */}
                    <motion.div
                        className="absolute z-20 w-64 h-64 glass rounded-2xl flex items-center justify-center shadow-2xl border-white/50"
                        animate={{ y: [-10, 10, -10] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Image
                            src="/qr-float.png"
                            alt="Floating QR"
                            width={200}
                            height={200}
                            className="object-contain"
                        />

                        {/* Success Ripple Effect */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-green-400/50 animate-ping opacity-20" />
                        <div className="absolute -right-4 -top-4 bg-green-500 text-white p-2 rounded-full shadow-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
