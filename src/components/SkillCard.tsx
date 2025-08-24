import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Users, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import apiService from "@/services/api";

interface SkillCardProps {
  name: string;
  skill: string;
  rating: number;
  sessions: number;
  duration: string;
  avatar?: string;
  description: string;
  tags: string[];
  userId?: string;
  mentorId?: string;
  availableSkills?: string[]; // Skills the mentor can teach
}

const SkillCard = ({ 
  name, 
  skill, 
  rating, 
  sessions, 
  duration, 
  avatar, 
  description, 
  tags,
  userId,
  mentorId,
  availableSkills = []
}: SkillCardProps) => {
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swapData, setSwapData] = useState({
    skillWanted: '',
    message: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSwapRequest = async () => {
    console.log('HandleSwapRequest called');
    console.log('Current user:', user);
    console.log('User ID:', userId);
    console.log('Mentor ID:', mentorId);
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to request a swap."
      });
      return;
    }

    // Get all skills the user can teach
    const userSkills = user?.skillsOffered?.map(skill => skill.name) || [
      'Web Development', 'React', 'JavaScript', 'UI Design', 'Python', 'Data Science'
    ];

    if (userSkills.length === 0) {
      toast({
        variant: "destructive",
        title: "No Skills Available",
        description: "Please add some skills to your profile first."
      });
      return;
    }

    if (!swapData.skillWanted) {
      toast({
        variant: "destructive",
        title: "Skill Required",
        description: "Please select what skill you want to learn from them."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if this is mock data (for demo purposes)
      const isMockData = (userId || mentorId || '').startsWith('507f1f77bcf86cd7994390');
      
      if (isMockData) {
        // Simulate API call delay for mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock successful response
        const response = {
          success: true,
          message: 'Swap request sent successfully (demo mode)',
          data: {
            sessionId: 'mock-session-id',
            notificationId: 'mock-notification-id'
          }
        };
        
        if (response.success) {
          toast({
            title: "Swap Request Sent! (Demo Mode)",
            description: `Your swap request has been sent to ${name}. In real mode, they would receive a notification.`
          });
          setIsSwapDialogOpen(false);
          setSwapData({ skillWanted: '', message: '' });
          return;
        }
      }

      // First test the connection with a simple test endpoint
      console.log('Testing connection first...');
      const testData = {
        recipientId: userId || mentorId || '',
        skillOffered: userSkills,
        skillWanted: swapData.skillWanted,
        message: 'Test message'
      };
      
      try {
        const testResponse = await apiService.testSwapRequest(testData);
        console.log('Connection test successful:', testResponse);
      } catch (testError) {
        console.error('Connection test failed:', testError);
        throw new Error('Unable to connect to server. Please ensure the backend is running.');
      }
      
      // If test passes, proceed with real swap request
      const response = await apiService.createSwapRequest({
        recipientId: userId || mentorId || '',
        skillOffered: userSkills, // Send all skills as an array
        skillWanted: swapData.skillWanted, // What I want to learn from them
        message: swapData.message || `Hi ${name}! I'd like to request a skill swap. I want to learn ${swapData.skillWanted} from you. I can teach the following skills: ${userSkills.join(', ')}. Please choose which skill you'd like to learn from me!`
      });

      if (response.success) {
        toast({
          title: "Swap Request Sent!",
          description: `Your swap request has been sent to ${name}. They will receive a notification.`
        });
        setIsSwapDialogOpen(false);
        setSwapData({ skillWanted: '', message: '' });
      } else {
        throw new Error(response.error || 'Failed to send swap request');
      }
    } catch (error) {
      console.error('Error sending swap request:', error);
      
      let errorMessage = 'Please try again.';
      let errorTitle = 'Error';
      
      if (error instanceof Error) {
        console.log('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Network/Connection errors
        if (error.message.includes('fetch') || error.message.includes('NetworkError') || 
            error.message.includes('Failed to fetch') || error.message.includes('Unable to connect')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to server. Please ensure the backend is running on port 5000.';
        }
        // Authentication errors
        else if (error.message.includes('401') || error.message.includes('Unauthorized') || 
                 error.message.includes('Authentication') || error.message.includes('token')) {
          errorTitle = 'Authentication Error';
          errorMessage = 'Please log in again to send swap requests.';
        }
        // Validation errors
        else if (error.message.includes('Validation failed') || error.message.includes('400')) {
          errorTitle = 'Validation Error';
          errorMessage = 'Invalid data provided. Please check that you have selected a skill to learn.';
        }
        // Recipient/mentor errors
        else if (error.message.includes('recipient') || error.message.includes('mentor') || error.message.includes('404')) {
          errorTitle = 'Recipient Error';
          errorMessage = 'Unable to find the selected mentor. Please try with a different mentor.';
        }
        // Server errors
        else if (error.message.includes('500') || error.message.includes('Server error')) {
          errorTitle = 'Server Error';
          errorMessage = 'The server encountered an error. Please try again later.';
        }
        // Generic error with message
        else if (error.message && error.message !== 'Unknown error') {
          errorMessage = error.message;
        }
        // Add debugging info for development
        if (process.env.NODE_ENV === 'development') {
          errorMessage += ` (Debug: ${error.message})`;
        }
      }
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hero transition-all duration-300 border-0">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">{name}</h3>
              <p className="text-primary font-medium">{skill}</p>
            </div>
            
            <p className="text-muted-foreground text-sm line-clamp-2">{description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{sessions} sessions</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{duration}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Dialog open={isSwapDialogOpen} onOpenChange={setIsSwapDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm" className="flex-1">
                    Request Swap
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request Skill Swap</DialogTitle>
                    <DialogDescription>
                      Choose what you want to learn from {name} and send all your teaching skills
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="skillWanted">What skill do you want to learn from {name}?</Label>
                      <div className="text-sm text-muted-foreground mb-2">
                        Available skills {name} can teach:
                      </div>
                      <Select 
                        value={swapData.skillWanted} 
                        onValueChange={(value) => setSwapData(prev => ({ ...prev, skillWanted: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose what you want to learn" />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableSkills.length > 0 ? availableSkills : tags).map((skillName, index) => (
                            <SelectItem key={index} value={skillName}>
                              {skillName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Skills you will offer to {name}:</Label>
                      <div className="p-4 bg-muted/50 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-2">
                          All your teaching skills will be sent:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user?.skillsOffered?.length ? (
                            user.skillsOffered.map((userSkill, index) => (
                              <Badge key={index} variant="secondary" className="text-sm">
                                {userSkill.name} ({userSkill.level})
                              </Badge>
                            ))
                          ) : (
                            <>
                              <Badge variant="secondary">Web Development (Expert)</Badge>
                              <Badge variant="secondary">React (Advanced)</Badge>
                              <Badge variant="secondary">JavaScript (Expert)</Badge>
                              <Badge variant="secondary">UI Design (Intermediate)</Badge>
                              <Badge variant="secondary">Python (Advanced)</Badge>
                              <Badge variant="secondary">Data Science (Intermediate)</Badge>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          {name} will choose which skill they want to learn from you.
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Personal message (optional)</Label>
                      <Textarea
                        id="message"
                        placeholder={`Hi ${name}! I want to learn ${swapData.skillWanted || '[skill]'} from you. I can teach multiple skills - please choose which one interests you...`}
                        value={swapData.message}
                        onChange={(e) => setSwapData(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSwapDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSwapRequest}
                      disabled={isSubmitting || !swapData.skillWanted}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Request'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillCard;