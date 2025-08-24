import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import SkillCategoryCard from "@/components/SkillCategoryCard";
import { 
  Search, 
  Code, 
  Palette, 
  TrendingUp, 
  Music, 
  Languages, 
  Camera,
  Briefcase,
  Heart,
  Utensils,
  Dumbbell,
  BookOpen,
  Wrench,
  Lightbulb
} from "lucide-react";

const BrowseSkills = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const skillCategories = [
    {
      title: "Programming",
      description: "Web development, mobile apps, and software engineering",
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
      title: "Languages",
      description: "Learn new languages with native speakers",
      icon: Languages,
      count: 203,
      color: "from-red-500 to-red-600"
    },
    {
      title: "Music",
      description: "Instruments, music theory, and audio production",
      icon: Music,
      count: 67,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Photography",
      description: "Photo editing, composition, and studio techniques",
      icon: Camera,
      count: 45,
      color: "from-indigo-500 to-indigo-600"
    },
    {
      title: "Professional Skills",
      description: "Public speaking, leadership, and career development",
      icon: Briefcase,
      count: 98,
      color: "from-gray-500 to-gray-600"
    },
    {
      title: "Health & Wellness",
      description: "Fitness, nutrition, mental health, and self-care",
      icon: Heart,
      count: 87,
      color: "from-pink-500 to-pink-600"
    },
    {
      title: "Cooking",
      description: "Culinary skills, baking, and international cuisines",
      icon: Utensils,
      count: 76,
      color: "from-yellow-500 to-yellow-600"
    },
    {
      title: "Fitness",
      description: "Personal training, yoga, sports, and wellness",
      icon: Dumbbell,
      count: 54,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Academic",
      description: "Math, science, writing, and test preparation",
      icon: BookOpen,
      count: 112,
      color: "from-blue-600 to-blue-700"
    },
    {
      title: "DIY & Crafts",
      description: "Woodworking, crafting, home improvement, and repairs",
      icon: Wrench,
      count: 43,
      color: "from-amber-500 to-amber-600"
    }
  ];

  const popularSkills = [
    "React", "Python", "Spanish", "Guitar", "Photography", "Digital Marketing",
    "Data Science", "UI Design", "Public Speaking", "Yoga", "Cooking", "Writing",
    "Japanese", "Piano", "JavaScript", "Graphic Design", "SEO", "Leadership"
  ];

  const trendingSkills = [
    "AI & Machine Learning", "Blockchain", "Remote Work Skills", "Mental Health",
    "Sustainable Living", "Content Creation", "Cryptocurrency", "NFT Art"
  ];

  const filteredCategories = selectedCategory === "all" 
    ? skillCategories 
    : skillCategories.filter(cat => 
        cat.title.toLowerCase().includes(selectedCategory.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Discover New Skills
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Explore thousands of skills across diverse categories. Find your next learning adventure.
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Search for any skill..." 
                className="pl-12 h-14 text-lg bg-white/95 backdrop-blur border-0 shadow-hero"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                variant="hero" 
                size="lg" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              variant={selectedCategory === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Button>
            {["Programming", "Design", "Business", "Languages", "Creative"].map((category) => (
              <Button 
                key={category}
                variant={selectedCategory === category ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Skills */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            🔥 Popular Skills Right Now
          </h2>
          <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
            {popularSkills.map((skill, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find skills organized by category to discover your next learning opportunity.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => (
              <SkillCategoryCard key={index} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Skills */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              📈 Trending Skills
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Skills that are gaining popularity and in high demand right now.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {trendingSkills.map((skill, index) => (
              <Card key={index} className="bg-gradient-card shadow-card hover:shadow-hero transition-all duration-300 border-0 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground">{skill}</h3>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Trending
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of learners already growing their skills with expert mentors.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Find a Mentor
            </Button>
            <Button variant="outline" size="lg">
              Teach a Skill
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrowseSkills;