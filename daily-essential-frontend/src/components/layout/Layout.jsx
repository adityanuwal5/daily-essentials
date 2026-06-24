import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

// App shell: persistent navbar + footer wrapping routed page content.
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
