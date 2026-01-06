import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Only check auth if Supabase is configured
  try {
    const supabase = createServerSupabaseClient()
    if (supabase) {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Session error in layout:', error)
        redirect('/auth/login')
      }

      if (!session) {
        redirect('/auth/login')
      }
    }
    // If Supabase is not configured, allow access (for demo purposes)
  } catch (_err) {
    // If Supabase is not properly configured, allow access (for demo purposes)
    console.warn('Supabase not configured, allowing access for demo')
  }

  return (
    <div className="min-h-screen relative bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden">
      {/* Noise Texture */}
      <div className="bg-noise"></div>

      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  )
}
