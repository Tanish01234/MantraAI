import Link from "next/link"

export function Footer() {
    return (
        <footer className="bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] pt-20 pb-10">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-2">
                        <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent mb-6 inline-block">
                            MentraAI
                        </Link>
                        <p className="text-[var(--text-secondary)] max-w-sm text-lg">
                            Your personal AI mentor. Making education accessible, engaging, and effective for every student.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-[var(--text-primary)]">Product</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Features</Link></li>
                            <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Testimonials</Link></li>
                            <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-[var(--text-primary)]">Company</h4>
                        <ul className="space-y-4">
                            <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">About Us</Link></li>
                            <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Careers</Link></li>
                            <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Blog</Link></li>
                            <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[var(--text-muted)] text-sm">
                        © 2024 MentraAI. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
                        <Link href="#" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
