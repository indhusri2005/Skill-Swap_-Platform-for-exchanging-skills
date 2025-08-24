import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const SwapRequestDebug = () => {
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [results, setResults] = useState<any>({});
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const testAuthentication = async () => {
    setIsTestingAuth(true);
    try {
      const token = localStorage.getItem('token');
      setResults(prev => ({
        ...prev,
        auth: {
          isAuthenticated,
          hasUser: !!user,
          hasToken: !!token,
          token: token ? token.substring(0, 20) + '...' : null,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          } : null
        }
      }));
      
      toast({
        title: "Auth Test Complete",
        description: "Check the results below"
      });
    } catch (error) {
      console.error('Auth test error:', error);
      toast({
        variant: "destructive",
        title: "Auth Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  const testAPIConnection = async () => {
    setIsTestingAPI(true);
    try {
      // Test basic API connection
      const testData = {
        recipientId: '507f1f77bcf86cd799439011',
        skillOffered: ['React', 'JavaScript'],
        skillWanted: 'Python',
        message: 'Test message'
      };
      
      const response = await apiService.testSwapRequest(testData);
      
      setResults(prev => ({
        ...prev,
        api: {
          success: true,
          response,
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: "API Test Successful",
        description: "Connection to backend is working"
      });
    } catch (error) {
      console.error('API test error:', error);
      setResults(prev => ({
        ...prev,
        api: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        variant: "destructive",
        title: "API Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const testSwapRequest = async () => {
    try {
      const swapData = {
        recipientId: '507f1f77bcf86cd799439011',
        skillOffered: ['React', 'JavaScript', 'TypeScript'],
        skillWanted: 'Python',
        message: 'This is a test swap request from the debug component'
      };
      
      const response = await apiService.createSwapRequest(swapData);
      
      setResults(prev => ({
        ...prev,
        swapRequest: {
          success: true,
          response,
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: "Swap Request Test Successful",
        description: "Swap request was sent successfully"
      });
    } catch (error) {
      console.error('Swap request test error:', error);
      setResults(prev => ({
        ...prev,
        swapRequest: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        variant: "destructive",
        title: "Swap Request Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Swap Request Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={testAuthentication}
            disabled={isTestingAuth}
            variant="outline"
          >
            {isTestingAuth ? 'Testing...' : 'Test Authentication'}
          </Button>
          
          <Button 
            onClick={testAPIConnection}
            disabled={isTestingAPI}
            variant="outline"
          >
            {isTestingAPI ? 'Testing...' : 'Test API Connection'}
          </Button>
          
          <Button 
            onClick={testSwapRequest}
            disabled={!isAuthenticated}
            variant="default"
          >
            Test Swap Request
          </Button>
        </div>
        
        {Object.keys(results).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h4 className="font-semibold">Environment Info:</h4>
          <p>Frontend URL: {window.location.origin}</p>
          <p>API Base URL: http://localhost:5000/api</p>
          <p>User Agent: {navigator.userAgent}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SwapRequestDebug;
