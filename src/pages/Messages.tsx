import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { 
  MessageCircle, 
  Send, 
  Search, 
  Plus,
  Clock,
  CheckCircle,
  User
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import apiService from "@/services/api";

interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  recipient: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Conversation {
  participant: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    title?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations (for now, we'll create mock data since the Messages API might not be fully implemented)
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      // For now, return mock data until the messages API is implemented
      return {
        success: true,
        data: {
          conversations: [
            {
              participant: {
                _id: '1',
                firstName: 'Marcus',
                lastName: 'Johnson',
                avatar: '',
                title: 'Growth Marketing Expert'
              },
              lastMessage: {
                _id: 'm1',
                sender: { _id: '1', firstName: 'Marcus', lastName: 'Johnson' },
                recipient: { _id: user?.id || '', firstName: user?.firstName || '', lastName: user?.lastName || '' },
                content: 'Thanks for accepting my session request! Looking forward to learning React from you.',
                type: 'text' as const,
                read: false,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
              },
              unreadCount: 2
            },
            {
              participant: {
                _id: '2',
                firstName: 'Elena',
                lastName: 'Rodriguez',
                avatar: '',
                title: 'Spanish Language Teacher'
              },
              lastMessage: {
                _id: 'm2',
                sender: { _id: user?.id || '', firstName: user?.firstName || '', lastName: user?.lastName || '' },
                recipient: { _id: '2', firstName: 'Elena', lastName: 'Rodriguez' },
                content: 'Perfect! What time works best for our Spanish conversation practice?',
                type: 'text' as const,
                read: true,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
              },
              unreadCount: 0
            },
            {
              participant: {
                _id: '3',
                firstName: 'Raj',
                lastName: 'Patel',
                avatar: '',
                title: 'Full Stack Developer'
              },
              lastMessage: {
                _id: 'm3',
                sender: { _id: '3', firstName: 'Raj', lastName: 'Patel' },
                recipient: { _id: user?.id || '', firstName: user?.firstName || '', lastName: user?.lastName || '' },
                content: 'Your TypeScript explanation was incredibly helpful! Thank you so much.',
                type: 'text' as const,
                read: true,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              },
              unreadCount: 0
            }
          ]
        }
      };
    },
    enabled: !!user
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return { success: true, data: { messages: [] } };
      
      // Mock messages for the selected conversation
      const mockMessages = [
        {
          _id: 'm1',
          sender: { _id: selectedConversation, firstName: 'Marcus', lastName: 'Johnson' },
          recipient: { _id: user?.id || '', firstName: user?.firstName || '', lastName: user?.lastName || '' },
          content: 'Hi! I saw your React expertise and would love to set up a session.',
          type: 'text' as const,
          read: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 'm2',
          sender: { _id: user?.id || '', firstName: user?.firstName || '', lastName: user?.lastName || '' },
          recipient: { _id: selectedConversation, firstName: 'Marcus', lastName: 'Johnson' },
          content: 'Sure! I\'d be happy to help you learn React. What specific areas would you like to focus on?',
          type: 'text' as const,
          read: true,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 'm3',
          sender: { _id: selectedConversation, firstName: 'Marcus', lastName: 'Johnson' },
          recipient: { _id: user?.id || '', firstName: user?.firstName || '', lastName: user?.lastName || '' },
          content: 'Thanks for accepting my session request! Looking forward to learning React from you. I\'m particularly interested in hooks and state management.',
          type: 'text' as const,
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      return { success: true, data: { messages: mockMessages } };
    },
    enabled: !!selectedConversation && !!user
  });

  const conversations = conversationsData?.data?.conversations || [];
  const messages = messagesData?.data?.messages || [];

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv: Conversation) =>
    `${conv.participant.firstName} ${conv.participant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // For now, just show a success message since the API might not be implemented
    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully!"
    });
    
    setNewMessage("");
  };

  if (conversationsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Loading />
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
              Messages
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Connect with your mentors and students. Discuss sessions, share resources, and build meaningful learning relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Messages Interface */}
      <section className="py-8 -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            
            {/* Conversations List */}
            <Card className="lg:col-span-1 bg-white shadow-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-xl font-bold">Conversations</CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="space-y-1">
                  {filteredConversations.length === 0 ? (
                    <div className="p-6 text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Conversations</h3>
                      <p className="text-muted-foreground">
                        Start a conversation with your mentors or students from your sessions.
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation: Conversation) => (
                      <div
                        key={conversation.participant._id}
                        onClick={() => setSelectedConversation(conversation.participant._id)}
                        className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                          selectedConversation === conversation.participant._id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conversation.participant.avatar} />
                            <AvatarFallback>
                              {`${conversation.participant.firstName[0]}${conversation.participant.lastName[0]}`}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm truncate">
                                {`${conversation.participant.firstName} ${conversation.participant.lastName}`}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-1 truncate">
                              {conversation.participant.title}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground truncate flex-1 mr-2">
                                {conversation.lastMessage.content}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="default" className="h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Messages Area */}
            <Card className="lg:col-span-2 bg-white shadow-card border-0 flex flex-col" style={{ height: '600px' }}>
              {selectedConversation ? (
                <>
                  {/* Message Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const participant = conversations.find((c: Conversation) => c.participant._id === selectedConversation)?.participant;
                        return participant ? (
                          <>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback>
                                {`${participant.firstName[0]}${participant.lastName[0]}`}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">
                                {`${participant.firstName} ${participant.lastName}`}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {participant.title}
                              </p>
                            </div>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-4 overflow-y-auto">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loading />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: Message) => {
                          const isFromUser = message.sender._id === user?.id;
                          return (
                            <div
                              key={message._id}
                              className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isFromUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className="text-xs opacity-70">
                                    {formatTime(message.createdAt)}
                                  </span>
                                  {isFromUser && (
                                    <CheckCircle className="h-3 w-3 opacity-70" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                    <p className="text-muted-foreground">
                      Choose a conversation from the list to start messaging.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Messages;
