"use client";

import { motion } from "framer-motion";
import { User, Laptop, Shield, PieChart, Briefcase } from "lucide-react";

const features = [
    {
        title: "Student Portal",
        description: "One login. Your schedule, attendance, and dream jobs — automatically tracked.",
        icon: User,
        color: "bg-blue-500",
        visual: "glass-card",
    },
    {
        title: "Faculty Dashboard",
        description: "Generate QR codes in one click. Track who’s in, who’s out, export CSV instantly.",
        icon: Laptop,
        color: "bg-purple-500",
        visual: "laptop",
    },
    {
        title: "Admin / Placement Officer UI",
        description: "Post jobs, shortlist talent, add recruiter feedback — zero spreadsheets.",
        icon: Briefcase,
        color: "bg-pink-500",
        visual: "console",
    },
    {
        title: "HOD Analytics",
        description: "Department-wide attendance, placement stats and at-risk student alerts powered by Phase-2 AI.",
        icon: PieChart,
        color: "bg-orange-500",
        visual: "hologram",
    },
    {
        title: "Security & Scale",
        description: "Row-Level Security baked in. Scales to 10k+ concurrent users out of the box.",
        icon: Shield,
        color: "bg-green-500",
        visual: "badges",
    },
];

export default function FeatureSection() {
    return (
        <section className="py-24 px-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto space-y-24">
                {features.map((feature, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12`}
                    >
                        {/* Text Content */}
                        <div className="flex-1 space-y-6">
                            <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center shadow-lg shadow-current/30`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-4xl font-bold text-slate-900">{feature.title}</h2>
                            <p className="text-xl text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>

                        {/* Visual Content */}
                        <div className="flex-1 w-full flex justify-center">
                            <div className="relative w-full max-w-md aspect-square">
                                {/* Abstract 3D shape background */}
                                <div className={`absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl transform rotate-6 scale-95 opacity-50`} />

                                <div className="relative w-full h-full glass rounded-3xl border border-white/60 shadow-2xl p-8 flex items-center justify-center overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                                    {feature.visual === "glass-card" && (
                                        <div className="w-full h-full bg-white/50 rounded-xl border border-white/40 p-4 space-y-3">
                                            <div className="h-8 w-1/3 bg-slate-200 rounded-md animate-pulse" />
                                            <div className="h-32 w-full bg-slate-100 rounded-md" />
                                            <div className="h-12 w-full bg-blue-50 rounded-md border border-blue-100 flex items-center justify-center text-blue-600 font-medium">Upload Résumé</div>
                                        </div>
                                    )}
                                    {feature.visual === "laptop" && (
                                        <div className="w-64 h-40 bg-slate-800 rounded-t-xl relative border-4 border-slate-700 border-b-0 flex items-center justify-center">
                                            <div className="absolute inset-0 bg-slate-900 rounded-t-lg overflow-hidden flex items-center justify-center">
                                                <div className="w-24 h-24 bg-white p-2 rounded-lg"><div className="w-full h-full bg-black" /></div>
                                            </div>
                                            <div className="absolute -bottom-3 w-72 h-3 bg-slate-700 rounded-b-xl" />
                                        </div>
                                    )}
                                    {feature.visual === "console" && (
                                        <div className="w-full h-full bg-slate-900 rounded-xl p-4 font-mono text-xs text-green-400 space-y-2 overflow-hidden">
                                            <div className="flex gap-2"><span className="text-blue-400">➜</span> <span>init_placement_drive()</span></div>
                                            <div className="flex gap-2"><span className="text-blue-400">➜</span> <span>shortlist_candidates --gpa {'>'} 8.0</span></div>
                                            <div className="bg-slate-800/50 p-2 rounded border border-slate-700 mt-4">
                                                <div className="text-white mb-1">Status: Active</div>
                                                <div className="w-full h-1 bg-slate-700 rounded-full"><div className="w-3/4 h-full bg-green-500 rounded-full" /></div>
                                            </div>
                                        </div>
                                    )}
                                    {feature.visual === "hologram" && (
                                        <div className="relative w-48 h-48">
                                            <div className="absolute inset-0 rounded-full border-8 border-orange-400/30 animate-[spin_10s_linear_infinite]" />
                                            <div className="absolute inset-4 rounded-full border-8 border-purple-400/30 animate-[spin_15s_linear_infinite_reverse]" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <PieChart className="w-16 h-16 text-slate-400/50" />
                                            </div>
                                        </div>
                                    )}
                                    {feature.visual === "badges" && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {['Supabase', 'Postgres', 'RLS', 'Edge'].map((badge) => (
                                                <div key={badge} className="bg-white/80 px-4 py-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 font-semibold text-slate-700">
                                                    <Shield className="w-4 h-4 text-green-500" /> {badge}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
