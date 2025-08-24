import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Loading, { LoadingSkeleton } from "@/components/Loading";
import { 
  Calendar, 
  Clock, 
  MessageCircle, 
  Video, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Star,
  Plus,
  Loader2,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  ExternalLink
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import apiService from "@/services/api";
import { useNavigate } from "react-router-dom";

interface Session {
  _id: string;
  mentor: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    title?: string;
  };
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    title?: string;
  };
  skill: {
    name: string;
    category: string;
  };
  status: 'pending' | 'confirmed' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  scheduledAt: string;
  duration: number;
  sessionType: string;
  message?: string;
  mentorMessage?: string;
  swapDetails?: {
    skillOffered: string[];
    skillWanted: string;
    isSwapRequest: boolean;
    requiresResponse: boolean;
  };
  createdAt: string;
  respondedAt?: string;
  completedAt?: string;
  // Review-related properties added by backend
  hasReview?: boolean;
  userReview?: any;
  otherReview?: any;
  reviewCount?: number;
  averageRating?: number;
}

interface SessionStats {
  activeCount: number;
  pendingCount: number;
  completedCount: number;
  averageRating: number;
}

const MySwaps = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [skillRating, setSkillRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch user's sessions from API
  const { data: sessionsResponse, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await apiService.getSessions();
      if (!response.success) throw new Error(response.error);
      return response;
    },
    enabled: !!user
  });

  const sessions = sessionsResponse?.data?.sessions || [];

  // Calculate session stats
  const sessionStats: SessionStats = {
    activeCount: sessions.filter((s: Session) => s.status === 'confirmed' || s.status === 'accepted').length,
    pendingCount: sessions.filter((s: Session) => s.status === 'pending').length,
    completedCount: sessions.filter((s: Session) => s.status === 'completed').length,
    averageRating: 4.8 // TODO: Calculate from reviews
  };

  // Session response mutation
  const respondToSessionMutation = useMutation({
    mutationFn: async ({ sessionId, response, message }: { sessionId: string, response: 'accepted' | 'declined', message?: string }) => {
      const result = await apiService.respondToSession(sessionId, response, message);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Response Sent",
        description: `Session ${variables.response} successfully!`
      });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setResponseDialogOpen(false);
      setSelectedSession(null);
      setResponseMessage("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to respond to session"
      });
    }
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await apiService.completeSession(sessionId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data, sessionId) => {
      toast({
        title: "Session Completed",
        description: "Session marked as completed successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      
      // Open review dialog for the completed session
      const session = sessions.find((s: Session) => s._id === sessionId);
      if (session) {
        setSelectedSession(session);
        setReviewDialogOpen(true);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete session"
      });
    }
  });

  // Cancel session mutation
  const cancelSessionMutation = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string, reason?: string }) => {
      const result = await apiService.cancelSession(sessionId, reason);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Session Cancelled",
        description: "Session cancelled successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel session"
      });
    }
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ sessionId, rating, comment, skillRating, communicationRating, punctualityRating }: { 
      sessionId: string, 
      rating: number, 
      comment: string,
      skillRating: number,
      communicationRating: number,
      punctualityRating: number
    }) => {
      console.log('🔄 Submitting review with data:', {
        sessionId, rating, comment, skillRating, communicationRating, punctualityRating
      });
      
      const result = await apiService.createReview({
        sessionId,
        rating,
        comment,
        skillRating,
        communicationRating,
        punctualityRating
      });
      
      console.log('📋 Review API result:', result);
      
      if (!result.success) {
        console.error('❌ Review submission failed:', result.error);
        throw new Error(result.error || 'Failed to submit review');
      }
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Review submitted successfully:', data);
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!"
      });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setReviewDialogOpen(false);
      setSelectedSession(null);
      setReviewRating(5);
      setReviewComment("");
      setSkillRating(5);
      setCommunicationRating(5);
      setPunctualityRating(5);
    },
    onError: (error) => {
      console.error('❌ Review submission error:', error);
      toast({
        variant: "destructive",
        title: "Review Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit review"
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "declined":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "declined":
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getOtherParticipant = (session: Session) => {
    return user?.id === session.mentor._id ? session.student : session.mentor;
  };

  const getUserRole = (session: Session) => {
    return user?.id === session.mentor._id ? 'mentor' : 'student';
  };

  // Filter sessions by status
  const activeSessions = sessions.filter((s: Session) => s.status === 'confirmed' || s.status === 'accepted');
  const pendingSessions = sessions.filter((s: Session) => s.status === 'pending');
  const completedSessions = sessions.filter((s: Session) => s.status === 'completed');

  const handleAcceptSession = (session: Session) => {
    setSelectedSession(session);
    setResponseDialogOpen(true);
  };

  const handleDeclineSession = (session: Session) => {
    respondToSessionMutation.mutate({
      sessionId: session._id,
      response: 'declined',
      message: "Thank you for the request, but I'm not available at this time."
    });
  };

  const handleCompleteSession = (sessionId: string) => {
    completeSessionMutation.mutate(sessionId);
  };

  const handleCancelSession = (sessionId: string, reason?: string) => {
    cancelSessionMutation.mutate({ sessionId, reason });
  };

  const handleSubmitResponse = () => {
    if (!selectedSession) return;
    
    respondToSessionMutation.mutate({
      sessionId: selectedSession._id,
      response: 'accepted',
      message: responseMessage
    });
  };

  const handleOpenReview = (session: Session) => {
    setSelectedSession(session);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedSession) return;
    
    submitReviewMutation.mutate({
      sessionId: selectedSession._id,
      rating: reviewRating,
      comment: reviewComment,
      skillRating: skillRating,
      communicationRating: communicationRating,
      punctualityRating: punctualityRating
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Swaps</h2>
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "Something went wrong while loading your swaps."}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['sessions'] })}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              My Skill Swaps
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Manage your learning sessions, track progress, and connect with your mentors.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8 -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{sessionStats.activeCount}</div>
                <div className="text-sm text-muted-foreground">Active Swaps</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{sessionStats.pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending Requests</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{sessionStats.completedCount}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{sessionStats.averageRating}</div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
              <TabsTrigger value="active">Active ({sessionStats.activeCount})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({sessionStats.pendingCount})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({sessionStats.completedCount})</TabsTrigger>
            </TabsList>

            {/* Active Sessions Tab */}
            <TabsContent value="active" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Active Swaps</h2>
                <Button variant="hero" onClick={() => navigate('/find-mentors')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Swap
                </Button>
              </div>

              {activeSessions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any active learning sessions yet.
                    </p>
                    <Button variant="hero" onClick={() => navigate('/find-mentors')}>
                      Find a Mentor
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {activeSessions.map((session: Session) => {
                    const otherParticipant = getOtherParticipant(session);
                    const userRole = getUserRole(session);
                    
                    return (
                      <Card key={session._id} className="bg-gradient-card shadow-card border-0">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={otherParticipant.avatar} />
                                <AvatarFallback>
                                  {`${otherParticipant.firstName[0]}${otherParticipant.lastName[0]}`}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                                  </h3>
                                  <Badge variant={userRole === "student" ? "secondary" : "default"}>
                                    {userRole === "student" ? "Learning" : "Teaching"}
                                  </Badge>
                                  <Badge className={getStatusColor(session.status)}>
                                    {getStatusIcon(session.status)}
                                    <span className="ml-1 capitalize">{session.status}</span>
                                  </Badge>
                                </div>
                                
                                <p className="text-primary font-medium mb-3">{session.skill.name}</p>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(session.scheduledAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{session.duration} minutes</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="capitalize">{session.sessionType}</span>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button variant="hero" size="sm" onClick={() => window.open('https://meet.google.com', '_blank')}>
                                    <Video className="h-4 w-4 mr-2" />
                                    Join Session
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => navigate('/messages')}>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Chat
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCompleteSession(session._id)}
                                    disabled={completeSessionMutation.isPending}
                                  >
                                    {completeSessionMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Complete & Review
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleCancelSession(session._id)}
                                    disabled={cancelSessionMutation.isPending}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Pending Sessions Tab */}
            <TabsContent value="pending" className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Pending Requests</h2>
              
              {pendingSessions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                    <p className="text-muted-foreground">
                      All caught up! No pending swap requests at the moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {pendingSessions.map((session: Session) => {
                    const otherParticipant = getOtherParticipant(session);
                    const userRole = getUserRole(session);
                    const isIncoming = userRole === 'mentor'; // If user is mentor, it's an incoming request
                    
                    return (
                      <Card key={session._id} className="bg-gradient-card shadow-card border-0">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={otherParticipant.avatar} />
                                <AvatarFallback>
                                  {`${otherParticipant.firstName[0]}${otherParticipant.lastName[0]}`}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                                  </h3>
                                  <Badge variant={isIncoming ? "default" : "secondary"}>
                                    {isIncoming ? "Incoming" : "Outgoing"}
                                  </Badge>
                                </div>
                                
                                <p className="text-primary font-medium mb-3">{session.skill.name}</p>
                                {session.message && (
                                  <p className="text-muted-foreground mb-3">{session.message}</p>
                                )}
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatDate(session.scheduledAt)}</span>
                                  </div>
                                  <span>•</span>
                                  <span>{session.duration} minutes</span>
                                  <span>•</span>
                                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                </div>

                                {/* Show swap details if it's a swap request */}
                                {session.swapDetails?.isSwapRequest && (
                                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900 mb-1">Skill Swap Request</p>
                                    <p className="text-sm text-blue-700">
                                      Wants to learn: <strong>{session.swapDetails.skillWanted}</strong>
                                    </p>
                                    <p className="text-sm text-blue-700">
                                      Can teach: <strong>{session.swapDetails.skillOffered.join(', ')}</strong>
                                    </p>
                                  </div>
                                )}
                                
              {/* Show rating reminder for active sessions if user is student */}
                {userRole === 'student' && session.status === 'accepted' && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <p className="text-sm font-medium text-yellow-900 mb-1">💡 Tip for Learners</p>
                    <p className="text-sm text-yellow-700">
                      Remember to leave a detailed review after your session to help other learners find great mentors!
                    </p>
                  </div>
                )}
                                
                                {isIncoming ? (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="hero" 
                                      size="sm"
                                      onClick={() => handleAcceptSession(session)}
                                      disabled={respondToSessionMutation.isPending}
                                    >
                                      <ThumbsUp className="h-4 w-4 mr-2" />
                                      Accept
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDeclineSession(session)}
                                      disabled={respondToSessionMutation.isPending}
                                    >
                                      <ThumbsDown className="h-4 w-4 mr-2" />
                                      Decline
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => navigate('/messages')}>
                                      <MessageCircle className="h-4 w-4 mr-2" />
                                      Message
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleCancelSession(session._id, "Request cancelled by user")}
                                      disabled={cancelSessionMutation.isPending}
                                    >
                                      Cancel Request
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => navigate('/messages')}>
                                      <MessageCircle className="h-4 w-4 mr-2" />
                                      Follow Up
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Completed Sessions Tab */}
            <TabsContent value="completed" className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Completed Swaps</h2>
              
              {completedSessions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Completed Sessions</h3>
                    <p className="text-muted-foreground">
                      Your completed learning sessions will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {completedSessions.map((session: Session) => {
                    const otherParticipant = getOtherParticipant(session);
                    const userRole = getUserRole(session);
                    
                    return (
                      <Card key={session._id} className="bg-gradient-card shadow-card border-0">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={otherParticipant.avatar} />
                                <AvatarFallback>
                                  {`${otherParticipant.firstName[0]}${otherParticipant.lastName[0]}`}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                                  </h3>
                                  <Badge variant={userRole === "student" ? "secondary" : "default"}>
                                    {userRole === "student" ? "Learned" : "Taught"}
                                  </Badge>
                                </div>
                                
                                <p className="text-primary font-medium mb-3">{session.skill.name}</p>
                                
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-4 w-4 ${
                                          i < (session.reviewRating || 0) 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-gray-300"
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">
                                    {session.completedAt ? new Date(session.completedAt).toLocaleDateString() : 'Recently'}
                                  </span>
                                </div>
                                
                                <div className="flex gap-2">
                                  {!session.hasReview ? (
                                    <Button 
                                      variant="hero" 
                                      size="sm"
                                      onClick={() => handleOpenReview(session)}
                                    >
                                      <Star className="h-4 w-4 mr-2" />
                                      Leave Review
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleOpenReview(session)}
                                    >
                                      <Star className="h-4 w-4 mr-2" />
                                      Edit Review
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" onClick={() => navigate('/find-mentors')}>
                                    Book Again
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => navigate('/messages')}>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Message
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Session Request</DialogTitle>
            <DialogDescription>
              Send a message to confirm the session details with {selectedSession ? `${selectedSession.student.firstName} ${selectedSession.student.lastName}` : 'the student'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response-message">Message (Optional)</Label>
              <Textarea
                id="response-message"
                placeholder="Looking forward to our session! I'll be available at the requested time..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitResponse}
              disabled={respondToSessionMutation.isPending}
            >
              {respondToSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                'Accept Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {selectedSession ? `${getOtherParticipant(selectedSession).firstName} ${getOtherParticipant(selectedSession).lastName}` : 'this session'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReviewRating(i + 1)}
                  >
                    <Star 
                      className={`h-6 w-6 ${
                        i < reviewRating 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                      }`} 
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {reviewRating} star{reviewRating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="review-comment">Overall Review</Label>
              <Textarea
                id="review-comment"
                placeholder="Share your overall experience with this session. What did you learn? How was the teaching style?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-4">
              <Label>Detailed Ratings</Label>
              
              {/* Skill Teaching Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Skill Teaching Quality</Label>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSkillRating(i + 1)}
                    >
                      <Star 
                        className={`h-5 w-5 ${
                          i < skillRating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {skillRating}/5 - How well did they teach the skill?
                  </span>
                </div>
              </div>
              
              {/* Communication Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Communication</Label>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCommunicationRating(i + 1)}
                    >
                      <Star 
                        className={`h-5 w-5 ${
                          i < communicationRating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {communicationRating}/5 - How clear and helpful was their communication?
                  </span>
                </div>
              </div>
              
              {/* Punctuality Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Punctuality & Professionalism</Label>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPunctualityRating(i + 1)}
                    >
                      <Star 
                        className={`h-5 w-5 ${
                          i < punctualityRating 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {punctualityRating}/5 - Were they on time and professional?
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending || !reviewComment.trim()}
            >
              {submitReviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MySwaps;
