"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  Package,
  Settings,
  Gift,
  TicketIcon,
  Calendar,
  CreditCard,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Mail,
  User as UserIcon,
  Gamepad2,
  Shield,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import { ReadOnlyBanner, ReadOnlyModeIndicator } from "@/components/ui/read-only-mode";

const sidebarItems = [
  {
    title: "운영 현황",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "사용자 관리",
    href: "/users",
    icon: Users,
  },
  {
    title: "액션 관리",
    href: "/actions",
    icon: Gamepad2,
  },
  {
    title: "타임미션 관리",
    href: "/time-missions",
    icon: Calendar,
  },
  {
    title: "상품 관리",
    href: "/prizes",  // 🔄 /gifts → /prizes로 변경
    icon: Gift,
  },
  {
    title: "박스 관리",
    href: "/boxes",
    icon: Package,
  },
  {
    title: "뽑기 관리",
    href: "/draws",
    icon: Gift,
  },
  {
    title: "티켓 관리",
    href: "/tickets",
    icon: TicketIcon,
  },
  {
    title: "포인트 관리",
    href: "/points",
    icon: CreditCard,
  }, 
  {
    title: "푸시 알림",
    href: "/push",
    icon: MessageSquare,
  },
  {
    title: "이벤트 관리",
    href: "/events",
    icon: Calendar,
  },
  {
    title: "배치 관리",
    href: "/batch",
    icon: Package,
  },
  {
    title: "보안 관리",
    href: "/security",
    icon: Shield,
  },
  {
    title: "설정",
    href: "/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout, isLoading } = useAuth();

  // 인증 확인 및 리디렉션
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // 로딩 상태이거나 사용자가 없으면 내용을 표시하지 않음
  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden p-4 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 dark:text-gray-300"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">RewardPlatform Admin</h1>
          <ReadOnlyModeIndicator />
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:flex`}
      >
        <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">RewardPlatform Admin</h1>
              <ReadOnlyModeIndicator />
            </div>
            <button onClick={toggleTheme} className="hidden md:block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon size={20} className="mr-3" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="mb-4">
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">로그인 사용자</p>
                
                {/* 이메일 표시 */}
                {user.email && (
                  <div className="flex items-center mt-1">
                    <Mail size={16} className="text-gray-400 mr-2" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {user.email}
                    </p>
                  </div>
                )}
                
                {/* 사용자 이름 표시 */}
                <div className="flex items-center mt-1">
                  <UserIcon size={16} className="text-gray-400 mr-2" />
                  <p className="font-medium">{user.name || "관리자"}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light w-full px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LogOut size={20} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-6">
          <ReadOnlyBanner />
          {children}
        </div>
      </main>
    </div>
  );
}