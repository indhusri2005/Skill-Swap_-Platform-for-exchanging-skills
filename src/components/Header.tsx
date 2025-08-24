import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Bell, User, Menu, Settings, LogOut, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { useQuery } from "@tanstack/react-query";
import apiService from "@/services/api";

const Header = ({ hideSearch = false }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Fetch notifications for authenticated users
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!isAuthenticated) return { notifications: [], unreadCount: 0 };
      try {
        const response = await apiService.getNotifications({ limit: 3, unreadOnly: false });
        const countResponse = await apiService.getUnreadNotificationCount();
        return {
          notifications: response.success ? (response.data as any[]) || [] : [],
          unreadCount: countResponse.success ? (countResponse.data as any)?.count || 0 : 0
        };
      } catch (error) {
        console.warn('Failed to fetch notifications:', error);
        return { notifications: [], unreadCount: 0 };
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000 // Consider data stale after 10 seconds
  });

  const notifications = (notificationsData?.notifications as any[]) || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const publicNavItems = [
    { label: "About", path: "/#about" },
    { label: "How It Works", path: "/#how-it-works" },
  ];

  const authNavItems = [
    { label: "Find Mentors", path: "/find-mentors" },
    { label: "Browse Skills", path: "/browse-skills" },
    { label: "My Swaps", path: "/my-swaps" },
    { label: "Notifications", path: "/notifications" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-xl text-foreground">SkillSwap</span>
        </Link>

        {/* Search Bar - Hidden on mobile */}
        {!hideSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search skills, mentors, or topics..." 
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>
        )}

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            authNavItems.slice(0, 3).map((item) => (
              <Link key={item.path} to={item.path}>
                <Button variant="ghost" size="sm">{item.label}</Button>
              </Link>
            ))
          ) : (
            publicNavItems.map((item) => (
              <a key={item.path} href={item.path}>
                <Button variant="ghost" size="sm">{item.label}</Button>
              </a>
            ))
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          {!hideSearch && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {isAuthenticated ? (
            // Authenticated User Actions
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                  </div>
                  {notifications.length > 0 ? (
                    <>
                      {notifications.slice(0, 3).map((notification) => (
                        <DropdownMenuItem key={notification._id} className="p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/notifications")}>
                        View all notifications
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem className="p-4">
                      <div className="text-center text-muted-foreground">
                        <p className="text-sm">No notifications</p>
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/my-swaps")}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    My Learning
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // Non-authenticated User Actions
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex"
                onClick={() => {
                  setAuthMode('login');
                  setAuthModalOpen(true);
                }}
              >
                Sign In
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="hidden sm:flex"
                onClick={() => {
                  setAuthMode('register');
                  setAuthModalOpen(true);
                }}
              >
                Join Now
              </Button>
            </>
          )}
          
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col space-y-4 mt-8">
                <div className="pb-4 border-b">
                  <h3 className="font-semibold text-lg">Navigation</h3>
                </div>
                
                {isAuthenticated ? (
                  authNavItems.map((item) => (
                    <Link key={item.path} to={item.path}>
                      <Button variant="ghost" className="w-full justify-start" size="lg">
                        {item.label}
                      </Button>
                    </Link>
                  ))
                ) : (
                  publicNavItems.map((item) => (
                    <a key={item.path} href={item.path}>
                      <Button variant="ghost" className="w-full justify-start" size="lg">
                        {item.label}
                      </Button>
                    </a>
                  ))
                )}
                
                <div className="pt-4 border-t space-y-4">
                  {isAuthenticated ? (
                    <Link to="/start-teaching">
                      <Button variant="hero" className="w-full" size="lg">
                        Start Teaching
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="lg"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthModalOpen(true);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button 
                        variant="default" 
                        className="w-full" 
                        size="lg"
                        onClick={() => {
                          setAuthMode('register');
                          setAuthModalOpen(true);
                        }}
                      >
                        Join Now
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* CTA Button - Desktop */}
          {isAuthenticated && (
            <Link to="/start-teaching">
              <Button variant="hero" size="sm" className="hidden sm:flex">
                Start Swapping
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      {isSearchOpen && !hideSearch && (
        <div className="border-t bg-background p-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search skills, mentors, or topics..." 
              className="pl-10 bg-muted/50"
              autoFocus
            />
          </div>
        </div>
      )}
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </header>
  );
};

export default Header;
