// Global icon initialization for client-side
"use client"

import { Settings, UserPlus, Menu, Search, Cog, Sliders } from "lucide-react"

// Initialize global icons on client side
if (typeof window !== 'undefined') {
  // Main icons
  (window as any).Settings = Settings;
  (window as any).UserPlus = UserPlus;
  (window as any).Menu = Menu;
  (window as any).Search = Search;
  
  // Alternative icons
  (window as any).Cog = Cog;
  (window as any).Sliders = Sliders;
  
  console.log('🎯 Global icons initialized:', {
    Settings: !!Settings,
    UserPlus: !!UserPlus,
    Menu: !!Menu,
    Search: !!Search,
    Cog: !!Cog,
    Sliders: !!Sliders
  });
}

export { Settings, UserPlus, Menu, Search, Cog, Sliders }
