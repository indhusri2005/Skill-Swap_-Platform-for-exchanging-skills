import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/Header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import apiService from "@/services/api";
import { 
  Bell, 
  MessageCircle, 
  Calendar, 
  Star, 
  UserPlus, 
  Clock, 
  CheckCircle2,
  Settings,
  Trash2
} from "lucide-react";

const Notifications = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications for the authenticated user
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', user?.id, activeTab],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const params: any = { limit: 50 };
        if (activeTab === "unread") params.unreadOnly = true;
        
        const response = await apiService.getNotifications(params);
        return response.success ? (response.data?.notifications as any[]) || [] : [];
      } catch (error) {
        console.warn('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => apiService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: "Notification marked as read" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to mark notification as read" });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => apiService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: "Notification deleted" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete notification" });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: "All notifications marked as read" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to mark all notifications as read" });
    }
  });

  const notifications = (notificationsData as any[]) || [];

  // Fallback mock notifications for when API is not available
  const mockNotifications = [
    {
      id: 1,
      type: "message",
      title: "New message from Sarah Chen",
      description: "Thanks for the great React session! I have a follow-up question about...",
      time: "2 minutes ago",
      read: false,
      avatar: "/placeholder.svg",
      icon: MessageCircle,
      action: "Reply"
    },
    {
      id: 2,
      type: "booking",
      title: "Session confirmed with Marcus Johnson",
      description: "Your Digital Marketing session is confirmed for tomorrow at 2:00 PM",
      time: "1 hour ago",
      read: false,
      avatar: "/placeholder.svg",
      icon: Calendar,
      action: "View Details"
    },
    {
      id: 3,
      type: "review",
      title: "New review received",
      description: "Elena Rodriguez left you a 5-star review for your Spanish lesson",
      time: "3 hours ago",
      read: true,
      avatar: "/placeholder.svg",
      icon: Star,
      action: "View Review"
    },
    {
      id: 4,
      type: "request",
      title: "New skill swap request",
      description: "David Park wants to learn Web Design from you in exchange for UI/UX tips",
      time: "5 hours ago",
      read: false,
      avatar: "/placeholder.svg",
      icon: UserPlus,
      action: "Respond"
    },
    {
      id: 5,
      type: "reminder",
      title: "Session starting soon",
      description: "Your guitar lesson with James Wilson starts in 30 minutes",
      time: "6 hours ago",
      read: true,
      avatar: "/placeholder.svg",
      icon: Clock,
      action: "Join Session"
    },
    {
      id: 6,
      type: "message",
      title: "New message from Aisha Patel",
      description: "Hey! I'm ready for our Data Science session. Should we use Zoom or...",
      time: "1 day ago",
      read: true,
      avatar: "/placeholder.svg",
      icon: MessageCircle,
      action: "Reply"
    },
    {
      id: 7,
      type: "booking",
      title: "Session completed",
      description: "Your Photography session with Lisa Zhang has been completed. Rate your experience!",
      time: "2 days ago",
      read: true,
      avatar: "/placeholder.svg",
      icon: CheckCircle2,
      action: "Leave Review"
    }
  ];

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      message: MessageCircle,
      booking: Calendar,
      review: Star,
      request: UserPlus,
      reminder: Clock,
      session: Calendar,
      payment: Star
    };
    const IconComponent = iconMap[type as keyof typeof iconMap] || Bell;
    
    const iconColor = {
      message: "text-blue-500",
      booking: "text-green-500",
      review: "text-yellow-500",
      request: "text-purple-500",
      reminder: "text-orange-500",
      session: "text-green-500",
      payment: "text-yellow-500"
    }[type] || "text-gray-500";

    return <IconComponent className={`h-5 w-5 ${iconColor}`} />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      message: "bg-blue-100 text-blue-700",
      booking: "bg-green-100 text-green-700",
      review: "bg-yellow-100 text-yellow-700",
      request: "bg-purple-100 text-purple-700",
      reminder: "bg-orange-100 text-orange-700",
      session: "bg-green-100 text-green-700",
      payment: "bg-yellow-100 text-yellow-700"
    }[type] || "bg-gray-100 text-gray-700";

    return colors;
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const messageNotifications = notifications.filter((n: any) => n.type === "message");
  const bookingNotifications = notifications.filter((n: any) => n.type === "booking" || n.type === "reminder" || n.type === "session");

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "messages":
        return messageNotifications;
      case "bookings":
        return bookingNotifications;
      case "unread":
        return notifications.filter((n: any) => !n.isRead);
      default:
        return notifications;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Notifications
              </h1>
              <p className="text-xl text-white/90">
                Stay updated with your skill swaps and messages
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                Mark All Read
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{unreadCount}</div>
                <div className="text-sm text-muted-foreground">Unread</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{messageNotifications.length}</div>
                <div className="text-sm text-muted-foreground">Messages</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{bookingNotifications.length}</div>
                <div className="text-sm text-muted-foreground">Bookings</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {notifications.filter((n: any) => n.type === "review").length}
                </div>
                <div className="text-sm text-muted-foreground">Reviews</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="all" className="relative">
                All
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-primary">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="bookings">Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="bg-gradient-card shadow-card border-0">
                      <CardContent className="p-6">
                        <div className="animate-pulse flex space-x-4">
                          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : getFilteredNotifications().length === 0 ? (
                <Card className="bg-gradient-card shadow-card border-0">
                  <CardContent className="p-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No notifications
                    </h3>
                    <p className="text-muted-foreground">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                getFilteredNotifications().map((notification) => (
                  <Card 
                    key={notification._id} 
                    className={`bg-gradient-card shadow-card border-0 transition-all duration-200 hover:shadow-hero ${
                      !notification.isRead ? "ring-2 ring-primary/20" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={notification.sender?.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {getNotificationIcon(notification.type)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className={`font-semibold text-foreground ${
                                !notification.isRead ? "font-bold" : ""
                              }`}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                            <Badge className={getTypeColor(notification.type)} variant="secondary">
                              {notification.type}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {notification.actionUrl && (
                                <Button 
                                  variant="hero" 
                                  size="sm"
                                  onClick={() => window.location.href = notification.actionUrl}
                                >
                                  View
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteNotificationMutation.mutate(notification._id)}
                                disabled={deleteNotificationMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {!notification.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => markAsReadMutation.mutate(notification._id)}
                                  disabled={markAsReadMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Quick Actions
          </h2>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Enable Push Notifications
            </Button>
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              View All Messages
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              My Schedule
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Notifications;