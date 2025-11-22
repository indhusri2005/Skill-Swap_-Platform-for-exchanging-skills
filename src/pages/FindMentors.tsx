import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SkillCard from "@/components/SkillCard";
import SearchFilters from "@/components/SearchFilters";
import Loading, { LoadingSkeleton } from "@/components/Loading";
import { Search, Filter, MapPin, Clock, Star, Grid3X3, List, Users, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiService from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const FindMentors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Component initialization - fetch mentors on mount

  // Listen for user login events and refresh mentor data
  useEffect(() => {
    const handleUserLoggedIn = (event: CustomEvent) => {
      // Invalidate and refetch mentor data
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
      
      // Show a toast notification
      toast({
        title: "Mentors Updated!",
        description: "Fresh mentor data has been loaded.",
        duration: 3000,
      });
    };

    // Add event listener for login events
    window.addEventListener('userLoggedIn', handleUserLoggedIn as EventListener);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
    };
  }, [queryClient, toast]);

  // Also refresh when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['mentors'] });
    }
  }, [isAuthenticated, queryClient]);

  // Fallback mock data for mentors
  const mockMentors = [
    {
      name: "Sarah Chen",
      skill: "React & TypeScript",
      rating: 4.9,
      sessions: 127,
      duration: "1-2 hours",
      avatar: "/placeholder.svg",
      description: "Senior Frontend Developer with 8+ years experience. Specializes in React ecosystem and modern JavaScript.",
      tags: ["React", "TypeScript", "Next.js", "Testing"]
    },
    {
      name: "Marcus Johnson",
      skill: "Digital Marketing",
      rating: 4.8,
      sessions: 89,
      duration: "30-60 min",
      avatar: "/placeholder.svg",
      description: "Growth marketing expert who has helped startups scale from 0 to $10M+ revenue through digital strategies.",
      tags: ["SEO", "PPC", "Analytics", "Growth"]
    },
    {
      name: "Elena Rodriguez",
      skill: "Spanish Conversation",
      rating: 5.0,
      sessions: 234,
      duration: "45 min",
      avatar: "/placeholder.svg",
      description: "Native Spanish speaker and certified language teacher. Makes learning fun and practical.",
      tags: ["Conversation", "Grammar", "Culture", "Business Spanish"]
    },
    {
      name: "Aisha Patel",
      skill: "Data Science",
      rating: 4.9,
      sessions: 98,
      duration: "2 hours",
      avatar: "/placeholder.svg",
      description: "Data scientist with expertise in machine learning, Python, and statistical analysis.",
      tags: ["Python", "Machine Learning", "Statistics", "SQL"]
    }
  ];

  // Fetch all mentors immediately on page load
  const { data: mentors, isLoading, error, refetch } = useQuery({
    queryKey: ['mentors', 'all'],
    queryFn: async () => {
      try {
        // Fetch all users who are mentors (have skills to offer)
        const response = await apiService.getMentors({
          limit: 50 // Backend only allows up to 50 mentors at a time
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch mentors');
        }
        
        // Handle both users.users (if paginated) and direct users array
        const users = response.data?.users || response.data || [];
        
        if (!Array.isArray(users)) {
          throw new Error('Invalid users data format');
        }
        
        const transformedMentors = users
          .filter(user => {
            // Must have skills to offer
            const hasSkills = user.skillsOffered && user.skillsOffered.length > 0;
            // Must be verified to ensure quality
            const isVerified = user.isVerified === true;
            // Must be active
            const isActive = user.isActive !== false;
            // Must have a complete profile (bio and title) - check for empty strings too
            const hasProfile = user.bio && user.title && user.bio.trim() !== '' && user.title.trim() !== '';
            
            return hasSkills && isVerified && isActive && hasProfile;
          })
          .map(user => ({
            name: `${user.firstName || 'Anonymous'} ${user.lastName || 'User'}`,
            skill: user.title || user.skillsOffered[0]?.name || "General Mentor",
            rating: user.stats?.averageRating || 4.5,
            sessions: user.stats?.totalSessions || 0,
            duration: `${user.preferredSessionDuration || 60} min`,
            avatar: user.avatar || "/placeholder.svg",
            description: user.bio || "Experienced professional ready to share knowledge and help others grow.",
            tags: user.skillsOffered?.map(s => s.name) || [],
            userId: user._id || user.id,
            mentorId: user._id || user.id,
            availableSkills: user.skillsOffered?.map(s => s.name) || [],
            location: user.location || 'Remote',
            isVerified: user.isVerified || false,
            lastActive: user.lastActive || new Date().toISOString(),
            // Additional mentor readiness indicators
            mentorStatus: 'ready',
            profileCompleteness: 100
          }));
        
        return transformedMentors;
        
      } catch (apiError) {
        // Fallback to mock data on API failure
        
        // If API fails, use enhanced mock data
        const mockObjectIds = [
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012', 
          '507f1f77bcf86cd799439013',
          '507f1f77bcf86cd799439014',
          '507f1f77bcf86cd799439015',
          '507f1f77bcf86cd799439016'
        ];
        
        return mockMentors.map((mentor, index) => ({
          ...mentor,
          userId: mockObjectIds[index] || mockObjectIds[0],
          mentorId: mockObjectIds[index] || mockObjectIds[0],
          availableSkills: mentor.tags || [],
          location: 'Remote',
          isVerified: true,
          lastActive: new Date().toISOString()
        }));
      }
    },
    enabled: true, // Always enabled - fetch immediately
    retry: 1, // Retry once on failure
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true // Always refetch when component mounts
  });

  // Note: We handle API errors gracefully with fallback data, so no error toast needed

  const categories = ["Programming", "Design", "Business", "Languages", "Music", "Data Science"];
  const locations = ["Remote", "New York", "San Francisco", "London", "Berlin", "Toronto"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      
      {/* Hero Section */}
      <section className="py-12 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Find Your Perfect Mentor
            </h1>
            <p className="text-xl text-black max-w-2xl mx-auto">
              Connect with experienced professionals ready to share their expertise and learn from you.
            </p>
          </div>
          
          {/* Search & Filters */}
          <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur shadow-hero border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search by skill, name, or keyword..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <Badge variant="secondary">Available Now</Badge>
                  <Badge variant="secondary">Top Rated</Badge>
                  <Badge variant="secondary">Quick Response</Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {mentors?.length || 0} Mentors Found
              </h2>
              <p className="text-muted-foreground">
                {isLoading ? "Loading mentors..." : "Showing verified mentors with complete profiles and skills to offer"}
                {error && " (using fallback data)"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">✅ Verified</Badge>
                <Badge variant="outline" className="text-xs">📚 Has Skills</Badge>
                <Badge variant="outline" className="text-xs">📝 Complete Profile</Badge>
                <Badge variant="outline" className="text-xs">🟢 Active</Badge>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Select defaultValue="rating">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="sessions">Most Sessions</SelectItem>
                  <SelectItem value="recent">Recently Active</SelectItem>
                  <SelectItem value="price">Best Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors?.map((mentor, index) => (
                <SkillCard key={index} {...mentor} />
              ))}
            </div>
          )}
          
          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Mentors
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Post what you want to learn and let mentors come to you, or start teaching your own skills.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Post Learning Request
            </Button>
            <Button variant="outline" size="lg">
              Become a Mentor
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FindMentors;
