import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import { 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Award, 
  Edit3, 
  Plus,
  MessageCircle,
  Settings,
  Camera,
  Globe,
  Linkedin,
  Twitter,
  Bell, 
  UserPlus, 
  CheckCircle2,
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
// Real-time notifications would be handled with proper WebSocket implementation

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit profile state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    bio: '',
    location: '',
    linkedinUrl: '',
    twitterHandle: ''
  });
  
  // Skill management state
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [skillForm, setSkillForm] = useState({
    name: '',
    level: '',
    category: '',
    experience: ''
  });
  const [goalForm, setGoalForm] = useState({
    name: '',
    level: '',
    category: '',
    priority: 'Medium'
  });
  
  // Local state for skills to immediately show added skills
  const [localSkillsOffered, setLocalSkillsOffered] = useState<any[]>([]);
  const [localSkillsWanted, setLocalSkillsWanted] = useState<any[]>([]);

  const { user, loading, refreshUser } = useAuth();

  // Initialize local skills when user data changes
  useEffect(() => {
    if (user) {
      setLocalSkillsOffered(user.skillsOffered || []);
      setLocalSkillsWanted(user.skillsWanted || []);
      // Initialize edit form with current user data
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        title: user.title || '',
        bio: user.bio || '',
        location: user.location || '',
        linkedinUrl: (user as any).socialLinks?.linkedin || '',
        twitterHandle: (user as any).socialLinks?.twitter || ''
      });
    }
  }, [user]);

  // Skill management handlers
  const handleAddSkill = async () => {
    console.log('🚀 Starting handleAddSkill');
    console.log('📝 Form data:', skillForm);
    
    // Validate form data
    if (!skillForm.name || !skillForm.level || !skillForm.category) {
      console.error('❌ Form validation failed - missing required fields');
      alert('Please fill in all required fields (Name, Level, Category)');
      return;
    }
    
    try {
      console.log('✅ Form validation passed');
      
      // Create new skill object
      const newSkill = {
        name: skillForm.name,
        level: skillForm.level,
        category: skillForm.category,
        experience: parseInt(skillForm.experience) || 0,
        sessions: 0,
        rating: 0,
        createdAt: new Date().toISOString()
      };
      
      console.log('🆕 New skill object:', newSkill);
      console.log('📊 Current skills before:', localSkillsOffered);
      
      // Add to local state immediately for optimistic UI update
      setLocalSkillsOffered(prev => {
        const updated = [...prev, newSkill];
        console.log('🔄 Updated local skills:', updated);
        return updated;
      });
      
      // Close modal and reset form
      setShowAddSkillModal(false);
      setSkillForm({ name: '', level: '', category: '', experience: '' });
      console.log('✅ Modal closed and form reset');
      
      // Persist to backend
      console.log('🌐 Calling API with:', {
        name: skillForm.name,
        level: skillForm.level,
        category: skillForm.category,
        experience: skillForm.experience
      });
      
      const response = await apiService.addOfferedSkill({
        name: skillForm.name,
        level: skillForm.level,
        category: skillForm.category,
        experience: skillForm.experience
      });
      
      console.log('📡 API Response:', response);
      
      if (response.success) {
        // Refresh user data to get updated skills from server
        console.log('✅ Skill added successfully, refreshing user data');
        await refreshUser();
        console.log('🔄 User data refreshed');
      } else {
        // Revert optimistic update on failure
        console.error('❌ API call failed:', response.error);
        setLocalSkillsOffered(prev => prev.filter(skill => 
          skill.name !== newSkill.name || skill.level !== newSkill.level
        ));
        alert('Failed to add skill: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      // Revert optimistic update on error
      console.error('💥 Exception in handleAddSkill:', error);
      setLocalSkillsOffered(prev => prev.filter(skill => 
        skill.name !== skillForm.name || skill.level !== skillForm.level
      ));
      alert('Error adding skill: ' + error.message);
    }
  };

  const handleAddGoal = async () => {
    try {
      // Create new goal object
      const newGoal = {
        name: goalForm.name,
        level: goalForm.level,
        category: goalForm.category,
        priority: goalForm.priority,
        progress: 0,
        createdAt: new Date().toISOString()
      };
      
      // Add to local state immediately for optimistic UI update
      setLocalSkillsWanted(prev => [...prev, newGoal]);
      
      // Close modal and reset form
      setShowAddGoalModal(false);
      setGoalForm({ name: '', level: '', category: '', priority: 'Medium' });
      
      // Persist to backend
      const response = await apiService.addWantedSkill({
        name: goalForm.name,
        level: goalForm.level,
        category: goalForm.category,
        priority: goalForm.priority
      });
      
      if (response.success) {
        // Refresh user data to get updated skills from server
        await refreshUser();
        console.log('Learning goal added successfully');
      } else {
        // Revert optimistic update on failure
        setLocalSkillsWanted(prev => prev.filter(skill => 
          skill.name !== newGoal.name || skill.level !== newGoal.level
        ));
        console.error('Failed to add learning goal:', response.error);
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalSkillsWanted(prev => prev.filter(skill => 
        skill.name !== goalForm.name || skill.level !== goalForm.level
      ));
      console.error('Error adding learning goal:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate required fields
      if (!editForm.firstName || !editForm.lastName) {
        alert('Please fill in your first and last name');
        return;
      }

      const profileData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        title: editForm.title,
        bio: editForm.bio,
        location: editForm.location,
        socialLinks: {
          linkedin: editForm.linkedinUrl,
          twitter: editForm.twitterHandle
        }
      };

      const response = await apiService.updateProfile(profileData);

      if (response.success) {
        setShowEditModal(false);
        await refreshUser();
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + (error as any).message);
    }
  };

  // Temporarily disable notifications query to isolate the issue
  // const { data: userNotifications } = useQuery({
  //   queryKey: ['user-notifications', user?.id],
  //   queryFn: async () => {
  //     if (!user) return [];
  //     try {
  //       const response = await apiService.getNotifications({ limit: 10 });
  //       return response.success ? (response.data as any[]) || [] : [];
  //     } catch (error) {
  //       console.warn('Failed to fetch user notifications:', error);
  //       return [];
  //     }
  //   },
  //   enabled: !!user,
  //   refetchInterval: 30000
  // });
  const userNotifications = [];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view your profile.</div>;
  }

  const userStats = {
    totalSessions: user.stats?.totalSessions || 0,
    hoursLearned: user.stats?.hoursLearned || 0,
    hoursTaught: user.stats?.hoursTaught || 0,
    rating: user.stats?.averageRating || 0,
    reviews: user.stats?.totalReviews || 0,
    joined: new Date((user as any).createdAt || Date.now()).toLocaleDateString()
  };

  // Use local skills state (includes API data + newly added skills)
  const skillsOffered = localSkillsOffered;
  const skillsWanted = localSkillsWanted;

  // Use actual user reviews from API, empty for new users
  // This should eventually fetch from a reviews API endpoint
  const recentReviews: any[] = [];

  // Use actual user achievements from API, empty for new users
  const achievements = (user as any).achievements || [];

  const notifications = userNotifications || [];

  // Real-time notifications would be implemented with WebSocket or SSE
  // useEffect(() => {
  //   // Setup real-time notification listener
  // }, []);

  const getNotificationIcon = (IconComponent: any, type: string) => {
    const iconColor = {
      message: "text-blue-500",
      booking: "text-green-500",
      review: "text-yellow-500",
      request: "text-purple-500",
      reminder: "text-orange-500"
    }[type] || "text-gray-500";

    return <IconComponent className={`h-5 w-5 ${iconColor}`} />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      message: "bg-blue-100 text-blue-700",
      booking: "bg-green-100 text-green-700",
      review: "bg-yellow-100 text-yellow-700",
      request: "bg-purple-100 text-purple-700",
      reminder: "bg-orange-100 text-orange-700"
    }[type] || "bg-gray-100 text-gray-700";

    return colors;
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Profile Header */}
      <section className="py-12 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-hero">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-gradient-primary text-white">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="sm" 
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full p-0 bg-white text-primary hover:bg-white/90"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 text-black">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-xl text-black/90 mb-2">
                      {user.title || "Skill Enthusiast"}
                    </p>
                    <div className="flex items-center gap-4 text-black/80">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{user.location || "Global"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {userStats.joined}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="border-black/30 text-black hover:bg-black/10"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-black/30 text-black hover:bg-black/10"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-black/90 mb-4 max-w-2xl">
                  {user.bio || "Passionate about sharing and learning new skills."}
                </p>
                
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="border-black/30 text-black hover:bg-black/10">
                    <Globe className="h-4 w-4 mr-2" />
                    Portfolio
                  </Button>
                  {(user as any).socialLinks?.linkedin && (
                    <Button variant="outline" size="sm" className="border-black/30 text-black hover:bg-black/10">
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </Button>
                  )}
                  {(user as any).socialLinks?.twitter && (
                    <Button variant="outline" size="sm" className="border-black/30 text-black hover:bg-black/10">
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8 -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{userStats.totalSessions}</div>
                <div className="text-xs text-muted-foreground">Total Sessions</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-accent">{userStats.hoursLearned}</div>
                <div className="text-xs text-muted-foreground">Hours Learned</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.hoursTaught}</div>
                <div className="text-xs text-muted-foreground">Hours Taught</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{userStats.rating}</div>
                <div className="text-xs text-muted-foreground">Avg Rating</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.reviews}</div>
                <div className="text-xs text-muted-foreground">Reviews</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-card border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{achievements.length}</div>
                <div className="text-xs text-muted-foreground">Achievements</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="achievements">Awards</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skills I Teach */}
                <Card className="bg-gradient-card shadow-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Skills I Teach
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAddSkillModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Skill
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skillsOffered.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{skill.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">{skill.level}</Badge>
                            <span>•</span>
                            <span>{skill.sessions} sessions</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{skill.rating}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Skills I Want to Learn */}
                <Card className="bg-gradient-card shadow-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Skills I Want to Learn
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAddGoalModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Goal
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skillsWanted.map((skill, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{skill.name}</h4>
                          <Badge variant="secondary" className="text-xs">{skill.level}</Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${skill.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {skill.progress}% progress
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Use actual user activity data - empty for new users */}
                  {userStats.totalSessions === 0 ? (
                    <div className="p-12 text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No recent activity
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Your learning and teaching activities will appear here once you start engaging with the community.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline">
                          Find Mentors
                        </Button>
                        <Button variant="outline">
                          Start Teaching
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* This would be populated with actual user activities from API */}
                      {/* For now showing empty since we don't have activity tracking yet */}
                      <div className="p-6 text-center text-muted-foreground">
                        Activity tracking will be implemented when sessions are completed.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Card className="bg-gradient-card shadow-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Reviews & Feedback
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xl font-bold">{userStats.rating}</span>
                      <span className="text-muted-foreground">({userStats.reviews} reviews)</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentReviews.length === 0 ? (
                    <div className="p-12 text-center">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No reviews yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Complete your first teaching session to receive reviews from learners.
                      </p>
                      <Button variant="outline">
                        Start Teaching
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {recentReviews.map((review, index) => (
                        <div key={index} className="border-b pb-6 last:border-b-0">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.avatar} />
                              <AvatarFallback>
                                {review.reviewer.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">{review.reviewer}</h4>
                                  <p className="text-sm text-muted-foreground">{review.skill}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-4 w-4 ${
                                          i < review.rating 
                                            ? "fill-yellow-400 text-yellow-400" 
                                            : "text-gray-300"
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">{review.date}</span>
                                </div>
                              </div>
                              <p className="text-muted-foreground">{review.comment}</p>
                              <Button variant="ghost" size="sm" className="mt-2 p-0">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              {achievements.length === 0 ? (
                <Card className="bg-gradient-card shadow-card border-0">
                  <CardContent className="p-12 text-center">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No achievements yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Complete sessions and build your reputation to earn achievements and badges.
                    </p>
                    <Button variant="outline">
                      Start Teaching
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {achievements.map((achievement, index) => (
                    <Card key={index} className="bg-gradient-card shadow-card border-0">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-4">{achievement.icon}</div>
                        <h3 className="text-lg font-semibold mb-2">{achievement.name}</h3>
                        <p className="text-muted-foreground">{achievement.description}</p>
                        <Badge className="mt-3">Earned</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              {notifications.length === 0 ? (
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
                notifications.map((notification: any) => (
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
                            {getNotificationIcon(notification.icon || Bell, notification.type)}
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
                                <Button variant="hero" size="sm">
                                  View
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {!notification.isRead && (
                                <Button variant="ghost" size="sm">
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

      {/* Add Skill Modal */}
      <Dialog open={showAddSkillModal} onOpenChange={setShowAddSkillModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Teaching Skill</DialogTitle>
            <DialogDescription>
              Share your expertise with the community by adding a skill you can teach.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                value={skillForm.name}
                onChange={(e) => setSkillForm(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g., React Development, Python Programming"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-level">Your Level</Label>
              <Select value={skillForm.level} onValueChange={(value) => setSkillForm(prev => ({...prev, level: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-category">Category</Label>
              <Select value={skillForm.category} onValueChange={(value) => setSkillForm(prev => ({...prev, category: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Languages">Languages</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill-experience">Years of Experience</Label>
              <Input
                id="skill-experience"
                type="number"
                value={skillForm.experience}
                onChange={(e) => setSkillForm(prev => ({...prev, experience: e.target.value}))}
                placeholder="e.g., 3"
                min="0"
                max="50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSkillModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSkill} disabled={!skillForm.name || !skillForm.level || !skillForm.category}>
              Add Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Learning Goal Modal */}
      <Dialog open={showAddGoalModal} onOpenChange={setShowAddGoalModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Learning Goal</DialogTitle>
            <DialogDescription>
              Set a new learning goal to track your progress and find mentors.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goal-name">Skill to Learn</Label>
              <Input
                id="goal-name"
                value={goalForm.name}
                onChange={(e) => setGoalForm(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g., Machine Learning, Photography"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-level">Target Level</Label>
              <Select value={goalForm.level} onValueChange={(value) => setGoalForm(prev => ({...prev, level: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-category">Category</Label>
              <Select value={goalForm.category} onValueChange={(value) => setGoalForm(prev => ({...prev, category: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Languages">Languages</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-priority">Priority</Label>
              <Select value={goalForm.priority} onValueChange={(value) => setGoalForm(prev => ({...prev, priority: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGoalModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGoal} disabled={!goalForm.name || !goalForm.level}>
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Your Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and professional details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({...prev, firstName: e.target.value}))}
                  placeholder="Your first name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({...prev, lastName: e.target.value}))}
                  placeholder="Your last name"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Professional Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                placeholder="e.g., Full Stack Developer, UI/UX Designer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({...prev, bio: e.target.value}))}
                placeholder="Tell us about yourself and your expertise"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({...prev, location: e.target.value}))}
                placeholder="City, Country or Global"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={editForm.linkedinUrl}
                onChange={(e) => setEditForm(prev => ({...prev, linkedinUrl: e.target.value}))}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="twitter">Twitter Handle</Label>
              <Input
                id="twitter"
                value={editForm.twitterHandle}
                onChange={(e) => setEditForm(prev => ({...prev, twitterHandle: e.target.value}))}
                placeholder="@yourhandle"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={!editForm.firstName || !editForm.lastName}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
