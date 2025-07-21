"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/src/components/auth/auth-provider"

const navItems = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Contracts", href: "/contracts" },
  { title: "Generate Contract", href: "/generate-contract" },
  { title: "Manage Parties", href: "/manage-parties" },
  { title: "Manage Promoters", href: "/manage-promoters" },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Extract locale from pathname
  const locale = pathname?.split('/')[1] || 'en'

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
            href={`/${locale}`}
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
              href={`/${locale}${item.href}`}
              className={`py-2 text-lg font-medium transition-colors hover:text-primary ${
                pathname?.includes(item.href) ? 'text-primary' : 'text-foreground/80'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          {user && (
            <div className="pt-4 border-t">
              <div className="py-2 text-sm text-muted-foreground">
                Signed in as: {user.email}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 text-lg font-medium text-foreground/80 transition-colors hover:text-primary"
                onClick={() => {
                  signOut()
                  setIsOpen(false)
                }}
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
