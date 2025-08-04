/**
 * Comprehensive Icon Library
 * 
 * This file provides a centralized export of all commonly used Lucide React icons
 * to prevent ReferenceError issues across the application.
 * 
 * Usage: import { Search, UserPlus, Menu, Settings } from "@/lib/icons"
 */

// Re-export all commonly used icons from lucide-react
export {
  // ⚡ CRITICAL ICONS (Fix for ReferenceErrors)
  Settings,        // ← MAIN ERROR CAUSING ICON
  UserPlus,        // ← Previously missing
  Menu,            // ← Previously missing  
  Search,          // ← Previously missing
  
  // Alternative Settings Icons (in case naming conflicts)
  Cog,             // ← Alternative to Settings
  Sliders,         // ← Alternative settings icon
  
  // Core Navigation & UI Icons  
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Home,
  
  // User & People Icons
  Users,
  User,
  UserMinus,
  UserCheck,
  UserX,
  
  // Action Icons
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Copy,
  Share,
  RefreshCw,
  RotateCcw,
  Filter,
  SortAsc,
  SortDesc,
  
  // File & Document Icons
  FileText,
  File,
  FileCheck,
  FilePlus,
  FileX,
  Files,
  Folder,
  FolderOpen,
  FolderPlus,
  FileSearch,
  
  // Status & Feedback Icons
  CheckCircle,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  Star,
  Heart,
  ThumbsUp,
  HelpCircle,
  
  // Business & Analytics Icons
  TrendingUp,
  TrendingDown,
  BarChart,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
  Award,
  Trophy,
  Briefcase,
  Building,
  Building2,
  
  // Technology & Features Icons
  Sparkles,
  Zap,
  Brain,
  Cpu,
  Server,
  Database,
  Globe,
  Globe2,
  Wifi,
  Shield,
  Lock,
  Unlock,
  Key,
  
  // Interface Elements
  Calendar,
  CalendarDays,
  Clock,
  Timer,
  Bell,
  BellRing,
  // Sliders,    // ← Moved to CRITICAL ICONS section
  Eye,
  EyeOff,
  Image,
  Camera,
  Video,
  
  // Communication Icons
  Mail,
  Phone,
  MessageCircle,
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  
  // Workflow & Process Icons
  Workflow,
  GitBranch,
  Repeat,
  Play,
  Pause,
  
  // Layout & Design Icons
  Layout,
  Grid,
  List,
  Columns,
  Rows,
  Layers,
  
  // Location & Contact Icons
  MapPin,
  Map,
  Compass,
  Navigation,
  
  // Financial Icons
  DollarSign,
  CreditCard,
  Banknote,
  
  // Utility Icons
  Sun,
  Moon,
  Flame,
  Power,
  PowerOff,
  Battery,
  Plug,
  ExternalLink,
  Link,
  Maximize,
  Minimize,
  
  // Loading & States
  Loader2,
  
  // Legal & Compliance Icons
  Gavel,
  
  // System & Settings Icons
  // Cog,           // ← Moved to CRITICAL ICONS section
  
  // Miscellaneous
  Palette,
  Monitor,
  Lightbulb,
  
} from "lucide-react"

// Type definitions for icon props
export type IconProps = {
  size?: number | string
  color?: string
  strokeWidth?: number
  className?: string
}

// Common icon sizes
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

// Default icon props
export const defaultIconProps: Partial<IconProps> = {
  size: IconSizes.md,
  strokeWidth: 2,
}

// Alternative Settings exports (APPROACH 3)
export { Settings as SettingsIcon } from "lucide-react"
export { Cog as SettingsAlt } from "lucide-react"
export { Sliders as SettingsSliders } from "lucide-react"
