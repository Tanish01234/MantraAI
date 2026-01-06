import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Hero } from '@/components/ui/Hero'
import { FeatureCard } from '@/components/ui/FeatureCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { LandingNavbar } from '@/components/ui/LandingNavbar'
import { HowItWorks } from '@/components/ui/HowItWorks'
import { Footer } from '@/components/ui/Footer'

export default async function Home() {
  // Check if Supabase is configured
  let session = null
  try {
    const supabase = createServerSupabaseClient()
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      session = data.session
    }
  } catch (error) {
    console.warn('Supabase not configured, running without authentication')
  }

  if (session) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg-base)]">
      <LandingNavbar />

      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-[var(--accent-primary)] opacity-20 blur-[120px] animate-float"></div>
          <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] rounded-full bg-[var(--accent-secondary)] opacity-20 blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 animate-fade-in">
              <span className="text-xl">✨</span>
              <span className="text-sm font-semibold text-[var(--accent-primary)]">The Future of Learning is Here</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
              Master Your <span className="text-gradient-mantra">Future</span>
            </h1>

            <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
              Your personal AI mentor for exams, career guidance, and life skills. Explained simply in Hinglish.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/auth/signup" className="btn-aurora px-8 py-4 text-lg min-w-[180px] shadow-xl hover:scale-105 transition-transform duration-300">
                <span>Get Started</span>
              </a>
              <a href="/auth/login" className="px-8 py-4 text-lg font-semibold text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-full hover:bg-[var(--bg-elevated)] transition-all duration-300 min-w-[180px]">
                Join Free
              </a>
            </div>
          </ScrollReveal>

          {/* Hero Image/Card */}
          <ScrollReveal delay={0.2}>
            <div className="mt-20 relative mx-auto max-w-4xl">
              <div className="glass-card rounded-3xl p-4 md:p-8 shadow-2xl border border-[var(--border-subtle)] bg-white/40 dark:bg-black/40 backdrop-blur-xl">
                <div className="aspect-video rounded-2xl overflow-hidden bg-[var(--bg-base)] relative flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4 animate-bounce">👋</div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Hi, I'm MantraAI!</h3>
                    <p className="text-[var(--text-secondary)]">Ask me anything about your studies...</p>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute top-10 left-10 p-3 glass-panel rounded-xl animate-float" style={{ animationDelay: '1s' }}>
                    <span className="text-2xl">📚</span>
                  </div>
                  <div className="absolute bottom-10 right-10 p-3 glass-panel rounded-xl animate-float" style={{ animationDelay: '2s' }}>
                    <span className="text-2xl">🚀</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section id="features" className="py-24 px-4 relative z-10 bg-[var(--bg-elevated)]/50">
        <div className="container mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Why <span className="text-gradient-mantra">MantraAI?</span>
              </h2>
              <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                We combine advanced AI with simple Hinglish explanations to make learning addictive.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📚"
              title="Smart Study Help"
              description="Upload your notes and get instant explanations. It's like having a topper friend available 24/7."
              delay={0.1}
            />
            <FeatureCard
              icon="🎯"
              title="Exam Prep Mode"
              description="Generate quizzes, flashcards, and mock tests customized to your syllabus and weak areas."
              delay={0.2}
            />
            <FeatureCard
              icon="🚀"
              title="Career Roadmap"
              description="Not sure what to do next? Get a personalized step-by-step guide to your dream career."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="py-32 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="glass-panel p-12 rounded-[2.5rem] text-center relative z-10 shadow-2xl animate-fade-in">
            <ScrollReveal direction="up">
              <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
                Ready to <span className="text-gradient-cool">Level Up?</span>
              </h2>
              <p className="text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto font-medium">
                Join thousands of students who are already learning smarter, not harder. Start your journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                <a href="/auth/signup" className="btn-aurora text-xl px-12 py-5 min-w-[200px] inline-block font-extrabold tracking-wide shadow-xl hover:scale-105 transition-transform duration-300">
                  <span>Get Started Free</span>
                </a>
                <p className="text-sm text-[var(--text-muted)] mt-4 sm:mt-0 font-medium">
                  No credit card required
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
