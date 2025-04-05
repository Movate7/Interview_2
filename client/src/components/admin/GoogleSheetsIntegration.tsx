import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Globe, FileSpreadsheet, Link2, Save, RotateCw } from "lucide-react";

import { initializeGoogleSheetsConnection, syncAllCandidatesWithSheet } from "@/lib/googleSheets";
import { getAppConfig, updateAppConfig, subscribeToConfigChanges } from "@/lib/firebase";

interface SheetConfig {
  id: string;
  name: string;
  url: string;
  description: string;
  lastUpdated?: number;
}

export default function GoogleSheetsIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isSheetUrlDialogOpen, setIsSheetUrlDialogOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string>("candidate-form");
  const [isSavingSheetUrl, setIsSavingSheetUrl] = useState(false);
  const [currentSheetUrl, setCurrentSheetUrl] = useState("");
  const [sheets, setSheets] = useState<SheetConfig[]>([
    {
      id: "candidate-form",
      name: "Candidate Form Responses",
      url: "",
      description: "Contains responses from the candidate registration form"
    },
    {
      id: "interview-feedback",
      name: "Interview Feedback",
      url: "",
      description: "Stores interview feedback and application configuration settings"
    }
  ]);
  
  // Get the Google Script URL if it's defined in environment variables
  const googleScriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
  const isConfigured = googleScriptUrl !== '';
  
  // Initialize configuration in Firestore from localStorage if needed
  const initializeFirestoreFromLocalStorage = async () => {
    // Only do this if we have localStorage data
    const candidateSheetUrl = localStorage.getItem('sheet_candidate-form');
    const feedbackSheetUrl = localStorage.getItem('sheet_interview-feedback');
    
    if (candidateSheetUrl || feedbackSheetUrl) {
      try {
        // Create a configuration object with data from localStorage
        const sheetsConfig = [
          {
            id: "candidate-form",
            name: "Candidate Form Responses",
            url: candidateSheetUrl || "",
            description: "Contains responses from the candidate registration form",
            lastUpdated: Date.now()
          },
          {
            id: "interview-feedback",
            name: "Interview Feedback",
            url: feedbackSheetUrl || "",
            description: "Stores interview feedback and application configuration settings",
            lastUpdated: Date.now()
          }
        ];
        
        // Update Firestore with this data
        await updateAppConfig({
          sheetsConfig,
          autoSyncEnabled: false,
          webhookUrl: `${window.location.origin}/api/google-sheets/webhook`
        });
        
        toast({
          title: "Configuration Migrated",
          description: "Your settings have been migrated from local storage to Firestore for better persistence.",
        });
      } catch (error) {
        console.error("Error migrating localStorage configuration to Firestore:", error);
      }
    }
  };

  // Load configuration from Firestore
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAppConfig();
        
        // Check if configuration is empty (new setup)
        const hasEmptyConfig = !config.sheetsConfig?.some(sheet => sheet.url);
        
        if (hasEmptyConfig) {
          // Try to initialize from localStorage if we have data there
          await initializeFirestoreFromLocalStorage();
          // Reload the config after migration
          const updatedConfig = await getAppConfig();
          setSheets(updatedConfig.sheetsConfig);
          setWebhookUrl(updatedConfig.webhookUrl || `${window.location.origin}/api/google-sheets/webhook`);
          setAutoSyncEnabled(updatedConfig.autoSyncEnabled || false);
        } else {
          // Use the config from Firestore
          setSheets(config.sheetsConfig);
          setWebhookUrl(config.webhookUrl || `${window.location.origin}/api/google-sheets/webhook`);
          setAutoSyncEnabled(config.autoSyncEnabled || false);
        }
      } catch (error) {
        console.error("Error loading configuration:", error);
        toast({
          title: "Configuration Error",
          description: "Failed to load configuration from Firestore. Using default settings.",
          variant: "destructive",
        });
      }
    };
    
    loadConfig();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToConfigChanges((config) => {
      setSheets(config.sheetsConfig);
      setWebhookUrl(config.webhookUrl || `${window.location.origin}/api/google-sheets/webhook`);
      setAutoSyncEnabled(config.autoSyncEnabled || false);
    });
    
    return () => unsubscribe();
  }, [toast]);
  
  // Get the currently selected sheet
  const getSelectedSheetConfig = () => {
    return sheets.find(sheet => sheet.id === selectedSheet) || sheets[0];
  };
  
  const { data: candidates = [] } = useQuery({
    queryKey: ['/api/candidates'],
    queryFn: async () => {
      const response = await fetch('/api/candidates', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }
      
      return response.json();
    },
  });
  
  // Initialize the Google Sheets connection
  const handleInitialize = async () => {
    setIsInitializing(true);
    
    try {
      const success = await initializeGoogleSheetsConnection();
      
      if (success) {
        toast({
          title: "Connection Successful",
          description: "The Google Sheets integration has been initialized.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to initialize Google Sheets integration. Please check your configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error initializing Google Sheets connection:", error);
      toast({
        title: "Connection Error",
        description: "An error occurred while initializing the Google Sheets connection.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };
  
  // Sync all candidates with the Google Sheet
  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const success = await syncAllCandidatesWithSheet();
      
      if (success) {
        toast({
          title: "Sync Successful",
          description: `${candidates.length} candidates have been synced with Google Sheets.`,
        });
        
        // Refresh the candidates list
        queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      } else {
        toast({
          title: "Sync Failed",
          description: "Failed to sync candidates with Google Sheets. Please check your configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error syncing candidates with Google Sheets:", error);
      toast({
        title: "Sync Error",
        description: "An error occurred while syncing candidates with Google Sheets.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Handle auto-sync toggle and save to Firestore
  const handleAutoSyncToggle = async (checked: boolean) => {
    setAutoSyncEnabled(checked);
    
    try {
      // Update Firestore configuration
      const success = await updateAppConfig({
        autoSyncEnabled: checked,
      });
      
      if (!success) {
        throw new Error("Failed to update auto-sync setting in Firestore");
      }
      
      if (checked) {
        toast({
          title: "Auto-Sync Enabled",
          description: "Candidates will be automatically synced with Google Sheets.",
        });
        
        // Set up an interval to sync every 5 minutes
        const syncInterval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            syncAllCandidatesWithSheet().catch(console.error);
          }
        }, 5 * 60 * 1000);
        
        // Store the interval ID in component state
        window.sessionStorage.setItem('syncIntervalId', syncInterval.toString());
      } else {
        toast({
          title: "Auto-Sync Disabled",
          description: "Automatic syncing with Google Sheets has been turned off.",
        });
        
        // Clear the sync interval
        const intervalId = window.sessionStorage.getItem('syncIntervalId');
        if (intervalId) {
          clearInterval(parseInt(intervalId));
          window.sessionStorage.removeItem('syncIntervalId');
        }
      }
    } catch (error) {
      console.error("Error updating auto-sync setting:", error);
      toast({
        title: "Setting Error",
        description: "Failed to save auto-sync setting to Firestore.",
        variant: "destructive",
      });
      
      // Revert the local state change
      setAutoSyncEnabled(!checked);
    }
  };
  
  // Handle sheet URL update
  const openSheetUrlDialog = (sheetId: string) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (sheet) {
      setCurrentSheetUrl(sheet.url);
      setSelectedSheet(sheetId);
      setIsSheetUrlDialogOpen(true);
    }
  };
  
  // Save sheet URL to Firestore
  const saveSheetUrl = async () => {
    setIsSavingSheetUrl(true);
    
    try {
      // Create updated sheets configuration with lastUpdated timestamp
      const updatedSheets = sheets.map(sheet => 
        sheet.id === selectedSheet 
          ? { ...sheet, url: currentSheetUrl, lastUpdated: Date.now() } 
          : sheet
      );
      
      // Save to Firestore
      const success = await updateAppConfig({
        sheetsConfig: updatedSheets
      });
      
      if (success) {
        // Update the local state (this will be redundant as the Firestore listener
        // will also update the state, but it provides immediate feedback)
        setSheets(updatedSheets);
        
        toast({
          title: "Sheet URL Saved",
          description: "The Google Sheet URL has been updated successfully in Firestore.",
        });
        
        setIsSheetUrlDialogOpen(false);
      } else {
        throw new Error("Failed to update configuration in Firestore");
      }
    } catch (error) {
      console.error("Error saving sheet URL:", error);
      toast({
        title: "Save Error",
        description: "An error occurred while saving the sheet URL to Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSheetUrl(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Google Sheets Integration
        </CardTitle>
        <CardDescription>
          Connect with Google Sheets to automate candidate registration and tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">Connection Status</span>
                  <span className="text-sm text-neutral-500">
                    {isConfigured ? 'Connected to Google Sheets' : 'Not connected'}
                  </span>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isConfigured ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 font-medium">Sheet Configuration Status</div>
                <div className="divide-y">
                  {sheets.map((sheet) => (
                    <div key={sheet.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{sheet.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-sm">
                            {sheet.url || "Not configured"}
                          </div>
                        </div>
                      </div>
                      <div 
                        className={`px-2 py-1 rounded-full text-xs ${sheet.url ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                      >
                        {sheet.url ? 'Configured' : 'Not Set'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">Candidates</span>
                  <span className="text-sm text-neutral-500">
                    Total registered candidates
                  </span>
                </div>
                <div className="font-semibold">
                  {candidates.length}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">Auto-Sync</span>
                  <span className="text-sm text-neutral-500">
                    Automatically sync with Google Sheets
                  </span>
                </div>
                <Switch 
                  checked={autoSyncEnabled}
                  onCheckedChange={handleAutoSyncToggle}
                  disabled={!isConfigured}
                />
              </div>
            </div>
            
            <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between">
              <Select
                value={selectedSheet}
                onValueChange={setSelectedSheet}
                disabled={isSyncing}
              >
                <SelectTrigger className="w-full sm:w-auto">
                  <SelectValue placeholder="Select a sheet to sync" />
                </SelectTrigger>
                <SelectContent>
                  {sheets.map((sheet) => (
                    <SelectItem key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                  onClick={handleInitialize}
                  disabled={isInitializing || !isConfigured}
                >
                  {isInitializing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {isInitializing ? "Connecting..." : "Test Connection"}
                </Button>
                
                <Button
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                  onClick={handleSync}
                  disabled={isSyncing || !isConfigured || !getSelectedSheetConfig()?.url}
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="script-url">Google Apps Script URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="script-url"
                    type="text"
                    value={googleScriptUrl}
                    placeholder="https://script.google.com/macros/s/..."
                    disabled
                    className="flex-1"
                  />
                  <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Globe className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Configure Google Sheets Integration</DialogTitle>
                        <DialogDescription>
                          Enter the webhook URL to connect with your Google Sheets
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Label htmlFor="webhook-url">Webhook URL</Label>
                        <Input
                          id="webhook-url"
                          type="text"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder={`${window.location.origin}/api/google-sheets/webhook`}
                        />
                        <p className="text-sm text-neutral-500">
                          Paste this URL in your Google Apps Script to receive form submissions
                        </p>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          navigator.clipboard.writeText(webhookUrl || `${window.location.origin}/api/google-sheets/webhook`);
                          toast({
                            title: "URL Copied",
                            description: "Webhook URL copied to clipboard",
                          });
                        }}>
                          Copy URL
                        </Button>
                        <Button onClick={async () => {
                          // Save webhook URL to Firestore
                          try {
                            const success = await updateAppConfig({
                              webhookUrl: webhookUrl || `${window.location.origin}/api/google-sheets/webhook`
                            });
                            
                            if (success) {
                              toast({
                                title: "Webhook URL Saved",
                                description: "The webhook URL has been updated successfully in Firestore.",
                              });
                            }
                          } catch (error) {
                            console.error("Error saving webhook URL:", error);
                            toast({
                              title: "Save Error",
                              description: "Failed to save webhook URL to Firestore.",
                              variant: "destructive",
                            });
                          }
                          
                          setIsConfigDialogOpen(false);
                        }}>
                          Save & Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-neutral-500">
                  This URL is set through environment variables and cannot be changed here.
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Google Sheets Configuration</h3>
                <div className="border rounded-md divide-y">
                  {sheets.map((sheet) => (
                    <div key={sheet.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{sheet.name}</h4>
                          <p className="text-sm text-muted-foreground">{sheet.description}</p>
                          <div className="mt-1 text-xs truncate text-gray-500 max-w-md">
                            {sheet.url ? sheet.url : "Not configured"}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openSheetUrlDialog(sheet.id)}
                        >
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Sheet URL Configuration Dialog */}
              <Dialog open={isSheetUrlDialogOpen} onOpenChange={setIsSheetUrlDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configure Google Sheet URL</DialogTitle>
                    <DialogDescription>
                      Enter the URL of the Google Sheet for {getSelectedSheetConfig()?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="sheet-url">Sheet URL</Label>
                    <Input
                      id="sheet-url"
                      type="text"
                      value={currentSheetUrl}
                      onChange={(e) => setCurrentSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                    />
                    <p className="text-sm text-muted-foreground">
                      {getSelectedSheetConfig()?.description}
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSheetUrlDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={saveSheetUrl}
                      disabled={isSavingSheetUrl}
                      className="flex items-center gap-2"
                    >
                      {isSavingSheetUrl ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSavingSheetUrl ? "Saving..." : "Save URL"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <div className="flex flex-col gap-2 mt-4">
                <Label htmlFor="apps-script-code">Google Apps Script Example Code</Label>
                <div className="p-4 bg-gray-100 rounded-md overflow-auto text-xs font-mono">
                  <pre>{`// Google Apps Script code example
function doPost(e) {
  try {
    // Parse the incoming JSON
    const data = JSON.parse(e.postData.contents);
    
    // Get the action
    const action = data.action;
    
    if (action === 'setupWebhook') {
      // Store the webhook URL in Script Properties
      const webhookUrl = data.webhookUrl;
      PropertiesService.getScriptProperties().setProperty('WEBHOOK_URL', webhookUrl);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Webhook URL set successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'updateCandidate') {
      // Update a candidate in the Google Sheet
      const candidate = data.candidate;
      const sheetType = data.sheetType || 'candidate-form'; // Default to candidate form sheet
      updateCandidateInSheet(candidate, sheetType);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Candidate updated successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'syncCandidates') {
      // Sync all candidates with the Google Sheet
      const candidates = data.candidates;
      const sheetType = data.sheetType || 'candidate-form'; // Default to candidate form sheet
      syncCandidatesWithSheet(candidates, sheetType);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'All candidates synced successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Unknown action'
    }))
    .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-neutral-500">
          Last updated: {new Date(Math.max(
            ...(sheets.map(s => s.lastUpdated || 0)),
            0
          )).toLocaleString()}
        </p>
      </CardFooter>
    </Card>
  );
}