export default function Footer() {
    return (
        <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 relative overflow-hidden">
            {/* Campus Night Silhouette Divider */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
                <div className="space-y-4">
                    <span className="text-2xl font-bold text-white">Insightly</span>
                    <p className="text-sm">
                        AI-powered academic management for the next generation of campuses.
                    </p>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4">Product</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-brand-cyan transition-colors">Features</a></li>

                        <li><a href="#" className="hover:text-brand-cyan transition-colors">Roadmap</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4">Docs & API</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-brand-cyan transition-colors">Supabase Schema</a></li>
                        <li><a href="#" className="hover:text-brand-cyan transition-colors">Edge Functions</a></li>
                        <li><a href="#" className="hover:text-brand-cyan transition-colors">GitHub</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4">Contact</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="mailto:insightlyp@gmail.com" className="hover:text-brand-cyan transition-colors">insightlyp@gmail.com</a></li>
                        <li><a href="#" className="hover:text-brand-cyan transition-colors">Twitter</a></li>
                        <li><a href="#" className="hover:text-brand-cyan transition-colors">LinkedIn</a></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                <p>© 2025 Insightly. All rights reserved.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                </div>

            </div>
        </footer>
    );
}
