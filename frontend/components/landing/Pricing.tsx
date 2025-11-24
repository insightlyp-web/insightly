"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Student",
        price: "Free",
        features: ["Attendance tracking", "Placement feed", "Résumé upload"],
        cta: "Get Started",
        popular: false,
    },
    {
        name: "Faculty Pro",
        price: "$4",
        period: "/mo",
        features: ["Unlimited sessions", "Advanced analytics", "CSV export", "Priority support"],
        cta: "Choose Plan",
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        features: ["Custom AI modules", "White-labeling", "SLA support", "On-premise option"],
        cta: "Contact Sales",
        popular: false,
    },
];

export default function Pricing() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
                    <p className="text-xl text-slate-600">Choose the plan that fits your campus needs.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ y: -10, rotateX: 2, rotateY: 2 }}
                            className={`relative p-8 rounded-3xl border ${plan.popular
                                    ? "bg-slate-900 text-white border-slate-800 shadow-2xl"
                                    : "bg-white text-slate-900 border-slate-200 shadow-xl"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-cyan to-brand-lavender text-slate-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-medium opacity-80">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.period && <span className="opacity-60">{plan.period}</span>}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <Check className={`w-5 h-5 ${plan.popular ? "text-brand-cyan" : "text-green-500"}`} />
                                        <span className="opacity-80">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className={`w-full py-3 rounded-xl font-bold transition-all ${plan.popular
                                    ? "bg-white text-slate-900 hover:bg-brand-cyan"
                                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                                }`}>
                                {plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
