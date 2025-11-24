"use client";

import { motion } from "framer-motion";
import { Brain, Target, AlertTriangle, FileText } from "lucide-react";

export default function Phase2Teaser() {
    return (
        <section className="py-24 relative overflow-hidden bg-slate-900 text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >

                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        AI that spots skill gaps <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-lavender">
                            before recruiters do.
                        </span>
                    </h2>
                </motion.div>

                <div className="relative h-[400px] flex items-center justify-center">
                    {/* Central Brain Mesh */}
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-20"
                    >
                        <div className="w-32 h-32 bg-gradient-to-br from-brand-cyan to-purple-600 rounded-full blur-2xl opacity-50 absolute inset-0" />
                        <Brain className="w-32 h-32 text-white relative z-10" />
                    </motion.div>

                    {/* Floating Particles/Icons */}
                    {[
                        { icon: FileText, label: "Résumé Score", x: -150, y: -50, delay: 0 },
                        { icon: AlertTriangle, label: "Risk Alert", x: 150, y: -50, delay: 1 },
                        { icon: Target, label: "Placement Match", x: 0, y: 120, delay: 2 },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            className="absolute flex flex-col items-center gap-2"
                            initial={{ x: 0, y: 0, opacity: 0 }}
                            animate={{
                                x: item.x,
                                y: item.y,
                                opacity: 1,
                            }}
                            transition={{ duration: 1, delay: 0.5 }}
                        >
                            <div className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center border border-white/10">
                                <item.icon className="w-6 h-6 text-brand-cyan" />
                            </div>
                            <span className="text-sm text-slate-400 font-medium">{item.label}</span>

                            {/* Connecting Line */}
                            <svg className="absolute top-6 left-1/2 -translate-x-1/2 -z-10 w-[200px] h-[200px] overflow-visible pointer-events-none">
                                <motion.path
                                    d={`M 0 0 L ${-item.x} ${-item.y}`}
                                    stroke="url(#gradient)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, delay: 1 }}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="rgba(165, 243, 252, 0)" />
                                        <stop offset="100%" stopColor="rgba(165, 243, 252, 0.5)" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
