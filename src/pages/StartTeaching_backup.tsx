import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import apiService from "@/services/api";
import { 
  Users, 
  Clock, 
  DollarSign, 
  Award, 
  CheckCircle, 
  Plus,
  Video,
  MessageCircle,
  Globe,
  Star,
  ArrowRight
} from "lucide-react";

const StartTeaching = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const [formData, setFormData] = useState({
    skillsOffered: [],
    skillsWanted: [],
    bio: "",
    experience: "",
    credentials: "",
    availability: {
      days: [],
      times: [],
      timezone: ""
    },
    sessionTypes: [],
    preferredSessionDuration: 60,
    whatYouWant: ""
  });
  
  const { toast } = useToast();
  const { updateUser } = useAuth();

  const steps = [
    { number: 1, title: "Your Expertise", description: "Tell us what you can teach" },
    { number: 2, title: "Profile Setup", description: "Create your teaching profile" },
    { number: 3, title: "Availability", description: "Set your schedule" },
    { number: 4, title: "Session Details", description: "Configure your sessions" }
  ];

  const skillCategories = [
    "Programming", "Design", "Business", "Languages", "Music", "Photography",
    "Writing", "Marketing", "Data Science", "Fitness", "Cooking", "Art"
  ];

  const benefits = [
    {
      icon: Users,
      title: "Share Your Knowledge",
      description: "Help others learn while expanding your network"
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Teach when it works for you, set your own hours"
    },
    {
      icon: Award,
      title: "Build Your Reputation",
      description: "Gain recognition as an expert in your field"
    },
    {
      icon: DollarSign,
      title: "Learn New Skills",
      description: "Exchange your expertise for skills you want to learn"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "React Mentor",
      quote: "Teaching on SkillSwap has been incredibly rewarding. I've helped 50+ developers while learning Spanish and guitar!",
      rating: 5,
      sessions: 127
    },
    {
      name: "Marcus Johnson",
      role: "Marketing Expert",
      quote: "The platform makes it easy to connect with motivated learners. Plus, I've picked up amazing design skills in return.",
      rating: 5,
      sessions: 89
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Start Teaching Today
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Share your expertise, help others grow, and learn new skills in return.
            Join thousands of mentors making a difference.
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 text-white/90">
            <div className="text-center">
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">4.9</div>
              <div className="text-sm">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm">Sessions Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Teach on SkillSwap?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join a community where teaching and learning go hand in hand.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-gradient-card shadow-card border-0 text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Form */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.number 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {step.number < steps.length && (
                    <div className={`h-1 w-16 mx-4 ${
                      currentStep > step.number ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-foreground">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-muted-foreground">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          {/* Form Steps */}
          <Card className="bg-gradient-card shadow-card border-0">
            <CardContent className="p-8">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">What skills can you teach?</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select all the skills you're confident teaching to others.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {skillCategories.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox id={skill} />
                          <Label htmlFor={skill} className="text-sm">{skill}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-skill">Add a custom skill</Label>
                    <div className="flex gap-2 mt-2">
                      <Input id="custom-skill" placeholder="e.g., Machine Learning, Pottery, etc." />
                      <Button variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="bio" className="text-base font-semibold">Tell us about yourself</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Write a compelling bio that highlights your expertise and teaching style.
                    </p>
                    <Textarea 
                      id="bio"
                      placeholder="I'm a passionate developer with 5+ years of experience in React and Node.js. I love helping others learn by breaking down complex concepts into simple, actionable steps..."
                      className="min-h-32"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="experience" className="text-base font-semibold">Your experience level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (1-2 years)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                        <SelectItem value="advanced">Advanced (5-10 years)</SelectItem>
                        <SelectItem value="expert">Expert (10+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-base font-semibold">Teaching credentials (optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add any relevant certifications, degrees, or professional experience.
                    </p>
                    <Input placeholder="e.g., Computer Science Degree, AWS Certified, 5 years at Google" />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">When are you available to teach?</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select your preferred time slots. You can always adjust these later.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="font-medium">Days of the week</Label>
                        <div className="space-y-2 mt-2">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox id={day} />
                              <Label htmlFor={day}>{day}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="font-medium">Preferred times</Label>
                        <div className="space-y-2 mt-2">
                          {["Morning (6AM - 12PM)", "Afternoon (12PM - 6PM)", "Evening (6PM - 10PM)", "Late Night (10PM - 6AM)"].map((time) => (
                            <div key={time} className="flex items-center space-x-2">
                              <Checkbox id={time} />
                              <Label htmlFor={time}>{time}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone">Your timezone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                        <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                        <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                        <SelectItem value="cet">Central European Time (CET)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">Session types you offer</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      What kind of learning sessions will you provide?
                    </p>
                    <div className="space-y-3">
                      {[
                        { id: "video", icon: Video, title: "Video Calls", desc: "1-on-1 or group video sessions" },
                        { id: "chat", icon: MessageCircle, title: "Text Chat", desc: "Answer questions via messaging" },
                        { id: "workshop", icon: Users, title: "Workshops", desc: "Teach multiple students at once" },
                        { id: "review", icon: CheckCircle, title: "Code/Work Review", desc: "Review and provide feedback" }
                      ].map((type) => (
                        <div key={type.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox id={type.id} />
                          <type.icon className="h-5 w-5 text-primary" />
                          <div>
                            <Label htmlFor={type.id} className="font-medium">{type.title}</Label>
                            <p className="text-sm text-muted-foreground">{type.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-semibold">Session duration</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Typical session length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-base font-semibold">What do you want in return?</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      SkillSwap is about mutual learning. What would you like to learn?
                    </p>
                    <Textarea 
                      placeholder="I'd love to learn Spanish, improve my photography skills, or get better at public speaking..."
                      className="min-h-24"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep === steps.length ? (
                  <Button variant="hero" className="px-8">
                    Complete Setup
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="hero" onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              What Our Mentors Say
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-card shadow-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                    <Badge variant="secondary">{testimonial.sessions} sessions</Badge>
                  </div>
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
            Ready to Share Your Knowledge?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our community of passionate teachers and start making a difference today.
          </p>
          
          <Button variant="hero" size="lg" className="px-8">
            Get Started Teaching
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default StartTeaching;