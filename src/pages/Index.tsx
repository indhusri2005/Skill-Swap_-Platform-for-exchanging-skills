import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SkillCard from "@/components/SkillCard";
import SkillCategoryCard from "@/components/SkillCategoryCard";
import { AuthModal } from "@/components/auth/AuthModal";
import { 
  Code, 
  Palette, 
  TrendingUp, 
  Music, 
  Languages, 
  Camera,
  ArrowRight,
  Users,
  Clock,
  Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// Hero image is available in assets

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const handleProtectedAction = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setAuthMode('register');
      setAuthModalOpen(true);
    }
  };
  
  const skillCategories = [
    {
      title: "Programming",
      description: "Learn coding, web development, and software engineering",
      icon: Code,
      count: 124,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Design",
      description: "UI/UX design, graphic design, and digital art",
      icon: Palette,
      count: 89,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Business",
      description: "Marketing, entrepreneurship, and business strategy",
      icon: TrendingUp,
      count: 156,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Music",
      description: "Instruments, music theory, and audio production",
      icon: Music,
      count: 67,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Languages",
      description: "Learn new languages with native speakers",
      icon: Languages,
      count: 203,
      color: "from-red-500 to-red-600"
    },
    {
      title: "Photography",
      description: "Photo editing, composition, and studio techniques",
      icon: Camera,
      count: 45,
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const featuredMentors = [
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
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header hideSearch={true} />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(/hero-bg.jpg)` }}
        ></div>
        
        <div className="relative container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-white/20 text-black border-white/30">
            🚀 Join 10,000+ learners already swapping skills
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Learn Skills.
            <br />
            <span className="bg-gradient-to-r from-black to-black/80 bg-clip-text text-transparent">
              Teach Skills.
            </span>
            <br />
            <span className="text-black">Grow Together.</span>
          </h1>
          
          <p className="text-xl text-black mb-8 max-w-2xl mx-auto">
            Connect with passionate learners and mentors worldwide. Exchange your expertise 
            for new skills in a supportive peer-to-peer learning community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="hero" 
              className="text-lg px-8" 
              onClick={() => handleProtectedAction(() => navigate("/my-swaps"))}
            >
              Start Learning Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="hero" 
              className="text-lg px-8" 
              onClick={() => handleProtectedAction(() => navigate("/browse-skills"))}
            >
              Browse Skills
            </Button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-black">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-bold">10K+</span>
              </div>
              <p className="text-sm">Active Members</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold">50K+</span>
              </div>
              <p className="text-sm">Hours Exchanged</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Star className="h-5 w-5" />
                <span className="text-2xl font-bold">4.9</span>
              </div>
              <p className="text-sm">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Skill Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Explore Skill Categories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover thousands of skills across diverse categories. Find your next learning adventure or share your expertise.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillCategories.map((category, index) => (
              <SkillCategoryCard key={index} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Mentors
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with experienced professionals ready to share their knowledge and learn something new from you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMentors.map((mentor, index) => (
              <SkillCard key={index} {...mentor} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleProtectedAction(() => navigate("/find-mentors"))}
            >
              View All Mentors
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How SkillSwap Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps and begin your learning journey today.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Create Your Profile</h3>
              <p className="text-muted-foreground">
                List your skills to teach and what you want to learn. Add your experience and availability.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Find Your Match</h3>
              <p className="text-muted-foreground">
                Browse mentors, send swap requests, and schedule sessions that work for both of you.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Start Learning</h3>
              <p className="text-muted-foreground">
                Connect via video chat, share knowledge, and grow your skills together in a supportive environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of learners and mentors who are already growing their skills together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="hero" 
              className="text-lg px-8 bg-white text-primary hover:bg-white/90"
              onClick={() => {
                setAuthMode('register');
                setAuthModalOpen(true);
              }}
            >
              Join SkillSwap Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 border-white/30 text-white hover:!bg-transparent !bg-transparent"
              onClick={() => {
                // Scroll to how it works section
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
};

export default Index;
