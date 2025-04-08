"use client"

import { useState } from "react"
import { Settings, Target, Users, Clock, AlertTriangle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { CameraView } from "@/components/camera-view";
import type { Deadzone } from "@/types";

export default function ConfigurationPage() {
  // Scoring Settings
  const [participationScore, setParticipationScore] = useState(5)
  const [engagementScore, setEngagementScore] = useState(5)
  const [attendanceScore, setAttendanceScore] = useState(5)
  const [answerScore, setAnswerScore] = useState(15)
  const [talkingBadScore, setTalkingBadScore] = useState(-10)
  const [attendanceBadScore, setAttendanceBadScore] = useState(-10)
  const [repeatedBadScore, setRepeatedBadScore] = useState(-20)

  
  // Threshold Settings
  const [attendanceThreshold, setAttendanceThreshold] = useState(70)
  const [engagementThreshold, setEngagementThreshold] = useState(60)
  const [atRiskThreshold, setAtRiskThreshold] = useState(60)
  const [maxScoreThreshold, setMaxScoreThreshold] = useState(100)
  const [minScoreThreshold, setMinScoreThreshold] = useState(0)
  
  // Decay Settings
  const [decayRate, setDecayRate] = useState(0.5)
  const [decayInterval, setDecayInterval] = useState(1)
  const [decayThreshold, setDecayThreshold] = useState(0.5)

  // Bonuses Settings
  const [enableThreeStreak, setEnableThreeStreak] = useState(true)
  const [threeStreakBonus, setThreeStreakBonus] = useState(10)
  const [enableFiveStreak, setEnableFiveStreak] = useState(true)
  const [fiveStreakBonus, setFiveStreakBonus] = useState(20)
  const [constantEngagementBonus, setConstantEngagementBonus] = useState(20)


  // Deadzone Settings
  const [isEditing, setIsEditing] = useState(false);
  const [deadzone, setDeadzone] = useState<Deadzone | undefined>();

<<<<<<< Updated upstream
  const handleSaveDeadzone = (newDeadzone: Omit<Deadzone, "id" | "professorId" | "createdAt" | "updatedAt">) => {
    setDeadzone({
      id: "1",
      professorId: "prof-1",
      ...newDeadzone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsEditing(false);
  };
=======
  // Fetch configurations on component mount
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setIsLoading(true)
        const [scoring, threshold, decay, bonus, advanced, deadzones] = await Promise.all([
          fetch('/api/config/scoring').then(res => res.json()),
          fetch('/api/config/threshold').then(res => res.json()),
          fetch('/api/config/decay').then(res => res.json()),
          fetch('/api/config/bonus').then(res => res.json()),
          fetch('/api/config/advanced').then(res => res.json()),
          fetch('/api/config/deadzones').then(res => res.json()),
        ])

        if (scoring) setScoringConfig(scoring)
        if (threshold) setThresholdConfig(threshold)
        if (decay) setDecayConfig(decay)
        if (bonus) setBonusConfig(bonus)
        if (advanced) setAdvancedConfig(advanced)
        if (deadzones?.length > 0) setDeadzone(deadzones[0])
        
        toast.success("Configuration loaded successfully")
      } catch (error) {
        toast.error("Failed to load configurations")
        console.error("[CONFIG_LOAD]", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfigs()
  }, [])

  const handleSaveDeadzone = async (newDeadzone: { coordinates: { x: number; y: number; width: number; height: number }[] }) => {
    try {
      setIsSaving(true);
  
      const payload = {
        name: "default", // must be unique per user
        coordinates: newDeadzone.coordinates || [],
      };
  
      console.log("Saving payload:", payload);
  
      const response = await fetch('/api/config/deadzones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) throw new Error('Failed to save deadzone');
  
      const savedDeadzone = await response.json();
      setDeadzone(savedDeadzone);
      setIsEditing(false);
      toast.success("Deadzone saved successfully");
    } catch (error) {
      toast.error("Failed to save deadzone");
      console.error("[DEADZONE_SAVE]", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  

  const handleSaveConfigs = async () => {
    try {
      setIsSaving(true)
      const results = await Promise.all([
        fetch('/api/config/scoring', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scoringConfig),
        }),
        fetch('/api/config/threshold', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(thresholdConfig),
        }),
        fetch('/api/config/decay', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(decayConfig),
        }),
        fetch('/api/config/bonus', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bonusConfig),
        }),
        fetch('/api/config/advanced', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(advancedConfig),
        }),
      ])

      const hasError = results.some(res => !res.ok)
      if (hasError) throw new Error('Failed to save some configurations')

      toast.success("All configurations saved successfully")
    } catch (error) {
      toast.error("Failed to save configurations")
      console.error("[CONFIG_SAVE]", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetDefaults = () => {
    try {
      setIsResetting(true)
      setScoringConfig({
        participationScore: 5,
        engagementScore: 5,
        attendanceScore: 5,
        answerScore: 15,
        talkingBadScore: -10,
        attendanceBadScore: -10,
        repeatedBadScore: -20,
      })
      setThresholdConfig({
        attendanceThreshold: 70,
        engagementThreshold: 60,
        atRiskThreshold: 60,
        maxScoreThreshold: 100,
        minScoreThreshold: 0,
      })
      setDecayConfig({
        decayRate: 0.5,
        decayInterval: 1,
        decayThreshold: 0.5,
      })
      setBonusConfig({
        enableThreeStreak: true,
        threeStreakBonus: 10,
        enableFiveStreak: true,
        fiveStreakBonus: 20,
        constantEngagementBonus: 20,
      })
      setAdvancedConfig({
        automaticRiskDetection: true,
        realTimeAnalytics: true,
        engagementNotifications: true,
      })
      toast.success("Settings reset to defaults")
    } catch (error) {
      toast.error("Failed to reset settings")
      console.error("[CONFIG_RESET]", error)
    } finally {
      setIsResetting(false)
    }
  }

  const handleDeleteDeadzone = async (id: string) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/config/deadzones?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete deadzone')
      
      setDeadzone(undefined)
      setIsEditing(false)
      toast.success("Deadzone deleted successfully")
    } catch (error) {
      toast.error("Failed to delete deadzone")
      console.error("[DEADZONE_DELETE]", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div>
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[400px] mt-2" />
        </div>

        <div className="space-y-6">
          <div className="flex gap-2">
            {["Scoring", "Decay", "Thresholds", "Deadzones", "Bonuses", "Advanced"].map((tab) => (
              <Skeleton key={tab} className="h-9 w-[100px]" />
            ))}
          </div>

          <LoadingCard />
        </div>
      </div>
    )
  }
>>>>>>> Stashed changes

  

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Class Configuration</h2>
        <p className="text-muted-foreground">
          Manage scoring rules, thresholds, and other class settings
        </p>
      </div>

      <Tabs defaultValue="scoring" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scoring" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Scoring
          </TabsTrigger>
          <TabsTrigger value="decay" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Decay
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="deadzones" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Deadzones
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Bonuses
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Rules</CardTitle>
              <CardDescription>
                Configure how points are awarded for different activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Score for Participation (Hand Raising)</Label>
                    <span className="text-muted-foreground">{participationScore} points</span>
                  </div>
                  <Slider
                    value={[participationScore]}
                    onValueChange={([value]: number[]) => setParticipationScore(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Points awarded each time a student raises their hand
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Score for Engagement (per minute)</Label>
                    <span className="text-muted-foreground">{engagementScore} points</span>
                  </div>
                  <Slider
                    value={[engagementScore]}
                    onValueChange={([value]: number[]) => setEngagementScore(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Points awarded per minute of active engagement
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Score for Attendance</Label>
                    <span className="text-muted-foreground">{attendanceScore} points</span>
                  </div>
                  <Slider
                    value={[attendanceScore]}
                    onValueChange={([value]: number[]) => setAttendanceScore(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Points awarded for each attendance 
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Score for Answering a question (You will be prompted to give points)</Label>
                    <span className="text-muted-foreground">{answerScore} points</span>
                  </div>
                  <Slider
                    value={[answerScore]}
                    onValueChange={([value]: number[]) => setAnswerScore(value)}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Points awarded for each attendance 
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Score Penalty for Talking in class</Label>
                    <span className="text-muted-foreground">{talkingBadScore} points</span>
                  </div>
                  <Slider
                    value={[talkingBadScore]}
                    onValueChange={([value]: number[]) => setTalkingBadScore(value)}
                    min={-20}
                    max={0}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Points awarded for each attendance 
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Score Penalty for Absence</Label>
                    <span className="text-muted-foreground">{attendanceBadScore} points</span>
                  </div>
                  <Slider
                    value={[attendanceBadScore]}
                    onValueChange={([value]: number[]) => setAttendanceBadScore(value)}
                    min={-20}
                    max={0}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Points awarded for each attendance 
                  </p>
                </div>

                
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decay" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Decay Configuration</CardTitle>
              <CardDescription>
                Configure how scores decay over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Decay Rate</Label>
                    <span className="text-muted-foreground">{decayRate}</span>
                  </div>
                  <Slider
                    value={[decayRate]}
                    onValueChange={([value]: number[]) => setDecayRate(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Rate at which scores decay over time
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Decay Interval (days)</Label>
                    <span className="text-muted-foreground">{decayInterval} days</span>
                  </div>
                  <Slider
                    value={[decayInterval]}
                    onValueChange={([value]: number[]) => setDecayInterval(value)}
                    min={1}
                    max={7}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How often scores decay
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Decay Threshold</Label>
                    <span className="text-muted-foreground">{decayThreshold}</span>
                  </div>
                  <Slider
                    value={[decayThreshold]}
                    onValueChange={([value]: number[]) => setDecayThreshold(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum threshold for decay to take effect
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Thresholds</CardTitle>
              <CardDescription>
                Set minimum requirements for attendance and engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Attendance Threshold</Label>
                    <span className="text-muted-foreground">{attendanceThreshold}%</span>
                  </div>
                  <Slider
                    value={[attendanceThreshold]}
                    onValueChange={([value]: number[]) => setAttendanceThreshold(value)}
                    min={30}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum required attendance percentage
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Engagement Threshold</Label>
                    <span className="text-muted-foreground">{engagementThreshold}%</span>
                  </div>
                  <Slider
                    value={[engagementThreshold]}
                    onValueChange={([value]: number[]) => setEngagementThreshold(value)}
                    min={30}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum required engagement percentage
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Students at Risk Threshold</Label>
                    <span className="text-muted-foreground">{atRiskThreshold}%</span>
                  </div>
                  <Slider
                    value={[atRiskThreshold]}
                    onValueChange={([value]: number[]) => setAtRiskThreshold(value)}
                    min={40}
                    max={80}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Threshold below which students are considered at risk
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deadzones Tab */}
        <TabsContent value="deadzones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deadzone Configuration</CardTitle>
              <CardDescription>
                Configure where tracking should be paused
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Deadzone Editor</h3>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "destructive" : "default"}
                >
                  {isEditing ? "Cancel Editing" : "Edit Deadzone"}
                </Button>
              </div>

              <CameraView
                isEditing={isEditing}
                onSave={handleSaveDeadzone}
                currentDeadzone={deadzone}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bonus Configuration</CardTitle>
              <CardDescription>
                Configure bonuses for consistent performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Three-Day Streak Bonus</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable bonus for three consecutive days of participation
                    </p>
                  </div>
                  <Switch checked={enableThreeStreak} onCheckedChange={setEnableThreeStreak} />
                </div>

                {enableThreeStreak && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Three-Day Streak Bonus Amount</Label>
                      <span className="text-muted-foreground">{threeStreakBonus} points</span>
                    </div>
                    <Slider
                      value={[threeStreakBonus]}
                      onValueChange={([value]: number[]) => setThreeStreakBonus(value)}
                      min={5}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>
<<<<<<< Updated upstream
=======

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Score Penalty for Talking in class</Label>
                      <span className="text-muted-foreground">{scoringConfig.talkingBadScore} points</span>
                    </div>
                    <Slider
                      value={[scoringConfig.talkingBadScore]}
                      onValueChange={([value]) => setScoringConfig(prev => ({ ...prev, talkingBadScore: value }))}
                      min={-20}
                      max={0}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Score Penalty for Absence</Label>
                      <span className="text-muted-foreground">{scoringConfig.attendanceBadScore} points</span>
                    </div>
                    <Slider
                      value={[scoringConfig.attendanceBadScore]}
                      onValueChange={([value]) => setScoringConfig(prev => ({ ...prev, attendanceBadScore: value }))}
                      min={-20}
                      max={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="decay" className="space-y-6">
          {isSaving ? <LoadingCard /> : (
            <Card>
              <CardHeader>
                <CardTitle>Decay Configuration</CardTitle>
                <CardDescription>
                  Configure how scores decay over time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Decay Rate</Label>
                      <span className="text-muted-foreground">{decayConfig.decayRate}</span>
                    </div>
                    <Slider
                      value={[decayConfig.decayRate]}
                      onValueChange={([value]) => setDecayConfig(prev => ({ ...prev, decayRate: value }))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Decay Interval (days)</Label>
                      <span className="text-muted-foreground">{decayConfig.decayInterval} days</span>
                    </div>
                    <Slider
                      value={[decayConfig.decayInterval]}
                      onValueChange={([value]) => setDecayConfig(prev => ({ ...prev, decayInterval: value }))}
                      min={1}
                      max={7}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Decay Threshold</Label>
                      <span className="text-muted-foreground">{decayConfig.decayThreshold}</span>
                    </div>
                    <Slider
                      value={[decayConfig.decayThreshold]}
                      onValueChange={([value]) => setDecayConfig(prev => ({ ...prev, decayThreshold: value }))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-6">
          {isSaving ? <LoadingCard /> : (
            <Card>
              <CardHeader>
                <CardTitle>Performance Thresholds</CardTitle>
                <CardDescription>
                  Set minimum requirements for attendance and engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Attendance Threshold</Label>
                      <span className="text-muted-foreground">{thresholdConfig.attendanceThreshold}%</span>
                    </div>
                    <Slider
                      value={[thresholdConfig.attendanceThreshold]}
                      onValueChange={([value]) => setThresholdConfig(prev => ({ ...prev, attendanceThreshold: value }))}
                      min={30}
                      max={90}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Engagement Threshold</Label>
                      <span className="text-muted-foreground">{thresholdConfig.engagementThreshold}%</span>
                    </div>
                    <Slider
                      value={[thresholdConfig.engagementThreshold]}
                      onValueChange={([value]) => setThresholdConfig(prev => ({ ...prev, engagementThreshold: value }))}
                      min={30}
                      max={90}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Students at Risk Threshold</Label>
                      <span className="text-muted-foreground">{thresholdConfig.atRiskThreshold}%</span>
                    </div>
                    <Slider
                      value={[thresholdConfig.atRiskThreshold]}
                      onValueChange={([value]) => setThresholdConfig(prev => ({ ...prev, atRiskThreshold: value }))}
                      min={40}
                      max={80}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="deadzones" className="space-y-6">
          {isSaving ? <LoadingCard /> : (
            <Card>
              <CardHeader>
                <CardTitle>Deadzone Configuration</CardTitle>
                <CardDescription>
                  Configure where tracking should be paused
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Deadzone Editor</h3>
                  <div className="flex gap-2">
                    {deadzone && (
                      <Button
                        onClick={() => handleDeleteDeadzone(deadzone.id)}
                        variant="destructive"
                        disabled={isSaving || isEditing}
                      >
                        {isSaving ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            Deleting...
                          </>
                        ) : (
                          "Delete Deadzone"
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant={isEditing ? "destructive" : "default"}
                      disabled={isSaving}
                    >
                      {isEditing ? "Cancel Editing" : "Edit Deadzone"}
                    </Button>
                  </div>
                </div>

                {isSaving ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex items-center space-x-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary"></div>
                      <p>Saving changes...</p>
                    </div>
                  </div>
                ) : (
                  <CameraView
                  isEditing={isEditing}
                  onSave={handleSaveDeadzone}
                  currentDeadzone={deadzone} // Pass the saved deadzone
                />
>>>>>>> Stashed changes
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Five-Day Streak Bonus</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable bonus for five consecutive days of participation
                    </p>
                  </div>
                  <Switch checked={enableFiveStreak} onCheckedChange={setEnableFiveStreak} />
                </div>

                {enableFiveStreak && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Five-Day Streak Bonus Amount</Label>
                      <span className="text-muted-foreground">{fiveStreakBonus} points</span>
                    </div>
                    <Slider
                      value={[fiveStreakBonus]}
                      onValueChange={([value]: number[]) => setFiveStreakBonus(value)}
                      min={10}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Constant Engagement Bonus</Label>
                    <span className="text-muted-foreground">{constantEngagementBonus} points</span>
                  </div>
                  <Slider
                    value={[constantEngagementBonus]}
                    onValueChange={([value]: number[]) => setConstantEngagementBonus(value)}
                    min={5}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Bonus points for maintaining high engagement throughout the class
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Additional configuration options for advanced users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Automatic Risk Detection</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect and flag students at risk
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Real-time Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable real-time performance analytics
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Engagement Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications for low engagement
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}