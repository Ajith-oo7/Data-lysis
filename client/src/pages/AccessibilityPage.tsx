import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Menu, Accessibility, Eye, Volume2, Keyboard, Palette } from 'lucide-react';

export default function AccessibilityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReader: false,
    keyboardNav: true,
    fontSize: [16],
    colorBlindMode: 'none',
    audioFeedback: false
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <main className="flex-1 min-w-0">
        <header className="h-16 glassmorphism backdrop-blur-md flex items-center sticky top-0 z-10 border-b border-gray-200/30">
          <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-4 md:hidden hover-lift"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Accessibility className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Accessibility Settings</h1>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>
        
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Tabs defaultValue="visual" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="motor">Motor</TabsTrigger>
              <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
            </TabsList>

            <TabsContent value="visual">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span>Visual Settings</span>
                    </CardTitle>
                    <CardDescription>Adjust visual elements for better readability</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="high-contrast">High Contrast Mode</Label>
                      <Switch
                        id="high-contrast"
                        checked={settings.highContrast}
                        onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="large-text">Large Text</Label>
                      <Switch
                        id="large-text"
                        checked={settings.largeText}
                        onCheckedChange={(checked) => updateSetting('largeText', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reduce-motion">Reduce Motion</Label>
                      <Switch
                        id="reduce-motion"
                        checked={settings.reduceMotion}
                        onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Font Size: {settings.fontSize[0]}px</Label>
                      <Slider
                        value={settings.fontSize}
                        onValueChange={(value) => updateSetting('fontSize', value)}
                        max={24}
                        min={12}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      <span>Color Settings</span>
                    </CardTitle>
                    <CardDescription>Color accessibility options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Color Blind Support</Label>
                      <select 
                        className="w-full mt-2 p-2 border border-gray-200 rounded-md"
                        value={settings.colorBlindMode}
                        onChange={(e) => updateSetting('colorBlindMode', e.target.value)}
                      >
                        <option value="none">None</option>
                        <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                        <option value="protanopia">Protanopia (Red-blind)</option>
                        <option value="tritanopia">Tritanopia (Blue-blind)</option>
                        <option value="monochrome">Monochrome</option>
                      </select>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Preview</h4>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-red-500 rounded"></div>
                        <div className="w-8 h-8 bg-green-500 rounded"></div>
                        <div className="w-8 h-8 bg-blue-500 rounded"></div>
                        <div className="w-8 h-8 bg-yellow-500 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audio">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Volume2 className="h-5 w-5 text-green-600" />
                    <span>Audio Settings</span>
                  </CardTitle>
                  <CardDescription>Audio accessibility and feedback options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="screen-reader">Screen Reader Support</Label>
                    <Switch
                      id="screen-reader"
                      checked={settings.screenReader}
                      onCheckedChange={(checked) => updateSetting('screenReader', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="audio-feedback">Audio Feedback</Label>
                    <Switch
                      id="audio-feedback"
                      checked={settings.audioFeedback}
                      onCheckedChange={(checked) => updateSetting('audioFeedback', checked)}
                    />
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Audio Descriptions</h4>
                    <p className="text-sm text-blue-700">
                      Charts and graphs will include audio descriptions for screen readers
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="motor">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Keyboard className="h-5 w-5 text-orange-600" />
                    <span>Motor Settings</span>
                  </CardTitle>
                  <CardDescription>Keyboard and motor accessibility options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="keyboard-nav">Keyboard Navigation</Label>
                    <Switch
                      id="keyboard-nav"
                      checked={settings.keyboardNav}
                      onCheckedChange={(checked) => updateSetting('keyboardNav', checked)}
                    />
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Navigate tabs</span>
                        <kbd className="px-2 py-1 bg-white border rounded">Tab</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Activate button</span>
                        <kbd className="px-2 py-1 bg-white border rounded">Enter</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Open sidebar</span>
                        <kbd className="px-2 py-1 bg-white border rounded">Ctrl + B</kbd>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cognitive">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Cognitive Settings</CardTitle>
                  <CardDescription>Options to reduce cognitive load</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="simple-nav">Simplified Navigation</Label>
                    <Switch id="simple-nav" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tooltips">Extended Tooltips</Label>
                    <Switch id="tooltips" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="focus-mode">Focus Mode</Label>
                    <Switch id="focus-mode" />
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Reading Assistant</h4>
                    <p className="text-sm text-green-700">
                      Highlight important information and provide step-by-step guidance
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex justify-between">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Settings</Button>
          </div>
        </div>
      </main>
    </div>
  );
} 