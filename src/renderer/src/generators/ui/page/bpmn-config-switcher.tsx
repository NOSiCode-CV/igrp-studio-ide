import { useState, useEffect } from 'react';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { Switch } from '@renderer/components/ui/switch';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import { Settings, Database, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { bpmnMockService } from '@renderer/services/bpmn-mock-service';
import { bpmnService } from '@renderer/services/bpmn-service';

interface BPMNConfigSwitcherProps {
  onConfigChange?: () => void;
}

export const BPMNConfigSwitcher = ({ onConfigChange }: BPMNConfigSwitcherProps) => {
  const [useMockData, setUseMockData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mockConfig, setMockConfig] = useState<any>(null);

  useEffect(() => {
    // Set initial mock configuration
    const config = {
      id: 'mock-config',
      name: 'Mock BPMN Server',
      apiUrl: 'https://mock-bpmn-server.com',
      token: 'mock-token-12345',
      description: 'Mock BPMN server for testing and development',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastConnected: new Date().toISOString(),
      status: 'connected' as const,
    };
    setMockConfig(config);
    
    // Set mock service to use mock data
    bpmnMockService.setUseMockData(true);
    bpmnMockService.setConfig(config);
  }, []);

  const handleToggleMockData = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      setUseMockData(enabled);
      bpmnMockService.setUseMockData(enabled);
      
      if (enabled) {
        // Switch to mock service
        await bpmnMockService.setConfig(mockConfig);
        toast.success('Switched to Mock BPMN Service');
      } else {
        // Switch to real service (if configured)
        const realConfig = await bpmnService.getConfig();
        if (realConfig) {
          toast.success('Switched to Real BPMN Service');
        } else {
          toast.info('No real BPMN configuration found. Please configure a real BPMN server.');
        }
      }
      
      onConfigChange?.();
    } catch (error) {
      toast.error('Failed to switch BPMN service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMockData = async () => {
    setIsLoading(true);
    try {
      // Generate mock page definitions
      const mockPages = bpmnMockService.generateMockPageDefinitions();
      
      // Save mock page definitions
      for (const page of mockPages) {
        await bpmnMockService.savePageDefinition(page);
      }
      
      toast.success(`Generated ${mockPages.length} mock BPMN page definitions`);
      onConfigChange?.();
    } catch (error) {
      toast.error('Failed to generate mock data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMockConnection = async () => {
    setIsLoading(true);
    try {
      const result = await bpmnMockService.testConnection({
        name: mockConfig.name,
        apiUrl: mockConfig.apiUrl,
        token: mockConfig.token,
        description: mockConfig.description,
        isActive: mockConfig.isActive,
      });
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to test mock connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          BPMN Service Configuration
        </CardTitle>
        <CardDescription>
          Configure BPMN service for testing and development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Service Mode</Label>
            <p className="text-sm text-muted-foreground">
              {useMockData ? 'Using mock data for testing' : 'Using real BPMN server'}
            </p>
          </div>
          <Switch
            checked={useMockData}
            onCheckedChange={handleToggleMockData}
            disabled={isLoading}
          />
        </div>

        <Separator />

        {useMockData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Mock BPMN Server</h4>
                <p className="text-sm text-muted-foreground">
                  Simulated BPMN server with sample data
                </p>
              </div>
              <Badge variant="secondary">Mock</Badge>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Server URL:</span>
                <span className="font-mono">https://mock-bpmn-server.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="default" className="text-xs">Connected</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Process Definitions:</span>
                <span>6 available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Process Instances:</span>
                <span>3 active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasks:</span>
                <span>3 pending</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestMockConnection}
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateMockData}
                disabled={isLoading}
              >
                <Database className="h-4 w-4 mr-2" />
                Generate Mock Data
              </Button>
            </div>
          </div>
        )}

        {!useMockData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Real BPMN Server</h4>
                <p className="text-sm text-muted-foreground">
                  Connect to actual BPMN server (Camunda, Flowable, etc.)
                </p>
              </div>
              <Badge variant="default">Real</Badge>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Configure your BPMN server connection in the main configuration panel
              </p>
            </div>
          </div>
        )}

        <Separator />

        <div className="text-xs text-muted-foreground">
          <p><strong>Mock Data Includes:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>6 sample process definitions (Invoice, Onboarding, Purchase, etc.)</li>
            <li>3 active process instances</li>
            <li>3 pending user tasks</li>
            <li>Sample BPMN XML definitions</li>
            <li>Realistic delays to simulate API calls</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 