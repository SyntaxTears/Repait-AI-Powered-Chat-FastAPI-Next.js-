"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Car, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { logoutUser } from "@/lib/auth"

export function DashboardHeader() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="font-bold">Detect Auto</span>
          </Link>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <MobileNav />
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center">
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

function MobileNav() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="flex flex-col space-y-3 py-4">
      <div className="flex items-center space-x-2 px-4">
        <Car className="h-6 w-6 text-primary" />
        <span className="font-bold">Detect Auto</span>
      </div>
      <div className="px-1">
        <div className="space-y-1 p-2">
          <Link
            href="/dashboard"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-accent hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
