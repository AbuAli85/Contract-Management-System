"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "@/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/lib/auth-service"

interface NavItem {
  title: string
  href: string
}

interface MobileNavProps {
  navItems: NavItem[]
  locale: string
}

export function MobileNav({ navItems, locale }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
      setIsOpen(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="px-2 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-xs pe-0 ps-6 pt-8">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="mb-8 flex items-center justify-between">
          <Link
            href={"/" + locale}
            className="font-heading text-xl font-bold text-primary"
            onClick={() => setIsOpen(false)}
          >
            Contract Management
          </Link>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="me-4">
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </div>
        <nav className="flex flex-col space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={"/" + locale + (item.href === "/" ? "" : item.href)}
              className={
                "py-2 text-lg font-medium transition-colors hover:text-primary " +
                (pathname?.includes(item.href) ? "text-primary" : "text-foreground/80")
              }
              onClick={() => setIsOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          {user && (
            <div className="border-t pt-4">
              <div className="py-2 text-sm text-muted-foreground">Signed in as: {user.email}</div>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 text-lg font-medium text-foreground/80 transition-colors hover:text-primary"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
