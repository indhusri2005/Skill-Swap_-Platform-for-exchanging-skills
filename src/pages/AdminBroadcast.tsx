import React, { useState } from 'react';
import { Send, MessageSquare, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import apiService from '../services/api';

const AdminBroadcast: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await apiService.post('/admin/broadcast', {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type
      });

      if (response.success) {
        setSuccess(`Broadcast sent successfully to ${response.data?.recipientCount || 0} users`);
        setFormData({
          title: '',
          message: '',
          type: 'info'
        });
      } else {
        setError('Failed to send broadcast');
      }
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      setError(error.response?.data?.message || 'Error sending broadcast');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': 
      case 'error': return AlertCircle;
      default: return MessageSquare;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Broadcast Notifications</h1>
        <p className="text-muted-foreground">Send notifications to all platform users</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broadcast Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Notification Title
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter notification title..."
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter your message..."
                  rows={4}
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/500 characters
                </p>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Type</label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Send to All Users
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This is how your notification will appear to users:
              </p>
              
              {formData.title || formData.message ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-3">
                    {(() => {
                      const IconComponent = getTypeIcon(formData.type);
                      return <IconComponent className={`w-5 h-5 mt-0.5 ${getTypeColor(formData.type)}`} />;
                    })()}
                    <div className="flex-1">
                      {formData.title && (
                        <h4 className="font-medium text-gray-900">
                          {formData.title}
                        </h4>
                      )}
                      {formData.message && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formData.message}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className={getTypeColor(formData.type)}>
                          {formData.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p>Fill in the form to see preview</p>
                </div>
              )}

              {/* Recipient Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Recipients</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  This notification will be sent to all active users on the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcasting Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• Keep notifications concise and actionable</p>
            <p>• Use appropriate notification types (info, success, warning, error)</p>
            <p>• Avoid sending too many notifications to prevent user fatigue</p>
            <p>• Test important announcements with a small group first if possible</p>
            <p>• Include clear next steps when applicable</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBroadcast;
