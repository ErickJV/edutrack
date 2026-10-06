import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'

export function AuthShell({
  title,
  description,
  children,
}: {
  title?: string
  eyebrow?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-[#dce6ef] dark:bg-[#030d14] px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-500">
      {/* Top-right Minimalist Theme Toggle */}
      <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      {/* Expansive Container */}
      <div className="w-full max-w-4xl">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 text-[#0d3950] shadow-2xl transition-colors duration-500 sm:p-12 lg:p-14 dark:border-white/10 dark:bg-[#081a26] dark:text-white dark:shadow-black/90">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 lg:items-start">
            
            {/* Left Column: Brand & Title */}
            <div className="flex flex-col justify-start space-y-4 lg:col-span-5 lg:border-r lg:border-slate-100 dark:lg:border-white/10 lg:pr-8">
              <div>
                <Brand />
              </div>
              {title ? (
                <h1 className="font-montserrat text-3xl font-extrabold tracking-tight text-[#0d3950] dark:text-white sm:text-4xl">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="font-arial text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              ) : null}
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-7">
              {children}
            </div>

          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="mt-6 text-center">
          <p className="font-arial text-xs text-slate-500 dark:text-white/40">
            EduTrack • Gestão Acadêmica
          </p>
        </footer>
      </div>
    </main>
  )
}
