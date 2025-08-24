import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import apiService from "@/services/api";

const SwapRequestTester = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>({});

  const runDiagnostics = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Test 1: Check authentication
      results.authentication = {
        isAuthenticated,
        hasUser: !!user,
        userSkills: user?.skillsOffered?.length || 0,
        token: !!localStorage.getItem('token')
      };

      // Test 2: Test API connectivity
      try {
        const testData = {
          recipientId: '507f1f77bcf86cd799439011', // Mock ID
          skillOffered: ['React', 'JavaScript'],
          skillWanted: 'Node.js',
          message: 'Test message from diagnostics'
        };

        const response = await apiService.testSwapRequest(testData);
        results.apiConnectivity = {
          success: true,
          response: response
        };
      } catch (apiError) {
        results.apiConnectivity = {
          success: false,
          error: apiError instanceof Error ? apiError.message : String(apiError)
        };
      }

      // Test 3: Test actual swap request with mock data
      if (isAuthenticated) {
        try {
          const swapData = {
            recipientId: '507f1f77bcf86cd799439011', // Mock ID for testing
            skillOffered: user?.skillsOffered?.map(s => s.name) || ['JavaScript', 'React'],
            skillWanted: 'Node.js',
            message: 'Test swap request from diagnostics'
          };

          const swapResponse = await apiService.createSwapRequest(swapData);
          results.swapRequest = {
            success: true,
            response: swapResponse
          };
        } catch (swapError) {
          results.swapRequest = {
            success: false,
            error: swapError instanceof Error ? swapError.message : String(swapError)
          };
        }
      } else {
        results.swapRequest = {
          success: false,
          error: 'Not authenticated'
        };
      }

    } catch (error) {
      results.error = error instanceof Error ? error.message : String(error);
    }

    setTestResults(results);
    setIsLoading(false);

    // Show summary toast
    if (results.authentication?.isAuthenticated && results.apiConnectivity?.success) {
      toast({
        title: "Diagnostics Complete",
        description: "Authentication and API connectivity tests passed!"
      });
    } else {
      toast({
        variant: "destructive",
        title: "Issues Found",
        description: "Check the diagnostic results below for details."
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Swap Request Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Running Diagnostics..." : "Run Swap Request Diagnostics"}
        </Button>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            
            {/* Authentication Test */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm text-gray-600">Authentication Status</h4>
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(testResults.authentication, null, 2)}
              </pre>
            </div>

            {/* API Connectivity Test */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm text-gray-600">API Connectivity</h4>
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(testResults.apiConnectivity, null, 2)}
              </pre>
            </div>

            {/* Swap Request Test */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm text-gray-600">Swap Request Test</h4>
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(testResults.swapRequest, null, 2)}
              </pre>
            </div>

            {/* User Data */}
            {user && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm text-gray-600">Current User Data</h4>
                <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    skillsOffered: user.skillsOffered?.map(s => ({ name: s.name, level: s.level })),
                    skillsWanted: user.skillsWanted?.map(s => ({ name: s.name, level: s.level }))
                  }, null, 2)}
                </pre>
              </div>
            )}

            {testResults.error && (
              <div className="p-4 border border-red-300 rounded-lg bg-red-50">
                <h4 className="font-medium text-sm text-red-600">Error</h4>
                <pre className="text-xs mt-2 text-red-700">
                  {testResults.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SwapRequestTester;
