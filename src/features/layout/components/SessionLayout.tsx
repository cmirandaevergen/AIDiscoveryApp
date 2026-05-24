import { Outlet } from 'react-router-dom'

export function SessionLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-white px-6 py-3 flex items-center shadow-md">
        <span className="font-bold text-lg tracking-tight">AI Discovery</span>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
