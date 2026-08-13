import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import FloatingChatbot from '../Chatbot/FloatingChatbot'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #0f1f3a 50%, #0a1628 100%)' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <main
        className="flex-1 transition-all duration-300 overflow-y-auto"
        style={{ marginLeft: sidebarOpen ? '260px' : '72px' }}
      >
        <div className="p-6 max-w-screen-xl mx-auto">
          <Outlet />
        </div>
      </main>
      <FloatingChatbot />
    </div>
  )
}
