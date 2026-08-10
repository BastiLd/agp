import { z } from "zod";

export const SEEDED_SERVER_ID = "171faeea";
export const SEEDED_SERVER_UUID = "171faeea-9bc1-44ed-bb08-6273b1c70be1";
export const SEEDED_SERVER_HOSTNAME = "51.75.118.165:20119";
export const SEEDED_SERVER_IP = "51.75.118.165";
export const SEEDED_SERVER_NODE = "GRA-N47 - Gratuit";
export const SEEDED_SFTP_USERNAME = "686f00b3b6ac3a5.171faeea";
export const SEEDED_ALLOC_PORT = 20119;

export const navGroups = [
  {
    title: "GENERAL",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/server/171faeea", icon: "LayoutGrid" },
      { key: "console", label: "Console", href: "/server/171faeea/console", icon: "SquareTerminal" },
      { key: "settings", label: "Settings", href: "/server/171faeea/settings", icon: "Settings" },
      { key: "activity", label: "Activity", href: "/server/171faeea/activity", icon: "Eye" }
    ]
  },
  {
    title: "MANAGEMENT",
    items: [
      { key: "files", label: "Files", href: "/server/171faeea/files", icon: "Folder" },
      { key: "databases", label: "Databases", href: "/server/171faeea/databases", icon: "Database" },
      { key: "backups", label: "Backups", href: "/server/171faeea/backups", icon: "Archive" },
      { key: "network", label: "Network", href: "/server/171faeea/network", icon: "Globe" }
    ]
  },
  {
    title: "CONFIGURATION",
    items: [
      { key: "schedules", label: "Schedules", href: "/server/171faeea/schedules", icon: "CalendarDays" },
      { key: "users", label: "Users", href: "/server/171faeea/users", icon: "Users" },
      { key: "startup", label: "Startup", href: "/server/171faeea/startup", icon: "SlidersVertical" }
    ]
  }
];

export const planPresets = [
  { slug: "free", name: "FREE", ramMb: 308, diskMb: 716, cpuPercent: 25, ioWeight: 100, databases: 0, backups: 0, maxFiles: 500000, renewPeriodDays: 4, autoRenew: false },
  { slug: "starter", name: "STARTER", ramMb: 1512, diskMb: 4096, cpuPercent: 150, ioWeight: 100, databases: 1, backups: 2, maxFiles: 500000, renewPeriodDays: 30, autoRenew: true },
  { slug: "pro", name: "PRO", ramMb: 2048, diskMb: 8192, cpuPercent: 200, ioWeight: 100, databases: 2, backups: 3, maxFiles: 500000, renewPeriodDays: 30, autoRenew: true },
  { slug: "advanced", name: "ADVANCED", ramMb: 4096, diskMb: 16384, cpuPercent: 300, ioWeight: 100, databases: 5, backups: 5, maxFiles: 500000, renewPeriodDays: 30, autoRenew: true },
  { slug: "expert", name: "EXPERT", ramMb: 8192, diskMb: 32768, cpuPercent: 500, ioWeight: 100, databases: 10, backups: 10, maxFiles: 500000, renewPeriodDays: 30, autoRenew: true }
];

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const serverDetailsSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().max(512).optional().default("")
});

export const startupSchema = z.object({
  startupCommand: z.string().min(1),
  dockerImage: z.string().min(1),
  pyFile: z.string().max(255).optional().default(""),
  jsFile: z.string().max(255).optional().default(""),
  additionalPyModules: z.string().max(255).optional().default(""),
  additionalNodePackages: z.string().max(255).optional().default(""),
  uninstallNodePackages: z.string().max(255).optional().default("")
});

export const scheduleSchema = z.object({
  name: z.string().min(1).max(64),
  cronExpression: z.string().min(5).max(64),
  actionType: z.enum(["power", "command"]),
  actionPayload: z.string().min(1).max(255),
  isEnabled: z.boolean().default(true)
});

export const subuserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(64),
  permissions: z.array(z.string()).min(1)
});

export const databaseSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_]+$/).min(3).max(32)
});

export const allocationNoteSchema = z.object({
  notes: z.string().max(128).default("")
});

export const runtimeSocketPayloadSchema = z.object({
  serverId: z.string(),
  userId: z.string(),
  exp: z.number()
});

export function formatPlan(plan) {
  return `${plan.name} · ${plan.ramMb} MB RAM · ${plan.diskMb} MB Disk · ${plan.cpuPercent}% CPU`;
}