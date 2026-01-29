import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Heart, Mail, Lock, User, Phone, MapPin, Activity, FileText, Ruler, Weight, Calendar, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLocation as useGeoLocation } from "@/hooks/useLocation";
import { TrustedHospitalsForm, HospitalFormData } from "@/components/auth/TrustedHospitalsForm";
import { supabase } from "@/integrations/supabase/client";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(1, "Full name is required"),
  age: z.number().min(1).max(150).nullable(),
  height_cm: z.number().min(30).max(300).nullable(),
  weight_kg: z.number().min(1).max(500).nullable(),
  health_conditions: z.string(),
  checkup_data: z.string(),
  location: z.string(),
  contact_number: z.string(),
  emergency_contact_number: z.string().min(10, "Emergency contact is required"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp, signIn } = useAuth();
  const { createProfile } = useProfile(user?.id);
  const { getCurrentLocation, getGoogleMapsUrl, loading: geoLoading } = useGeoLocation();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [healthConditions, setHealthConditions] = useState("");
  const [checkupData, setCheckupData] = useState("");
  const [location, setLocation] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [contactNumber, setContactNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [trustedHospitals, setTrustedHospitals] = useState<HospitalFormData[]>([]);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await getCurrentLocation();
      setGpsCoords({ lat: loc.latitude, lng: loc.longitude });
      setLocation(`GPS: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
      toast({
        title: "Location Detected",
        description: "Your GPS location has been captured successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Location Error",
        description: error.message || "Could not detect location. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validation = signInSchema.safeParse({ email, password });
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Welcome back!", description: "Successfully signed in." });
      navigate("/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = {
        email,
        password,
        full_name: fullName,
        age: age ? parseInt(age) : null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        health_conditions: healthConditions,
        checkup_data: checkupData,
        location,
        contact_number: contactNumber,
        emergency_contact_number: emergencyContact,
      };

      const validation = signUpSchema.safeParse(formData);
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast({
            title: "Account Exists",
            description: "This email is already registered. Please sign in.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: signUpError.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Wait a moment for auth to complete, then create profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the new user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const profileData = {
          full_name: fullName,
          age: age ? parseInt(age) : null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          health_conditions: healthConditions,
          checkup_data: checkupData,
          location,
          contact_number: contactNumber,
          emergency_contact_number: emergencyContact,
        };

        // Create profile
        await supabase.from("profiles").insert({
          user_id: session.user.id,
          ...profileData,
        });

        // Create trusted hospitals if any
        if (trustedHospitals.length > 0) {
          const validHospitals = trustedHospitals.filter(
            h => h.hospital_name.trim() && h.hospital_phone.trim()
          );
          
          if (validHospitals.length > 0) {
            await supabase.from("trusted_hospitals").insert(
              validHospitals.map((h, index) => ({
                user_id: session.user.id,
                hospital_name: h.hospital_name.trim(),
                hospital_address: h.hospital_address?.trim() || null,
                hospital_phone: h.hospital_phone.trim(),
                priority: index + 1,
              }))
            );
          }
        }
      }

      toast({ title: "Account Created!", description: "Welcome to MediGuide." });
      navigate("/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">MediGuide</CardTitle>
          <CardDescription>Your personal health companion</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {/* Account Info */}
                <div className="space-y-3 pb-3 border-b">
                  <h3 className="font-medium text-sm text-muted-foreground">Account Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-3 pb-3 border-b">
                  <h3 className="font-medium text-sm text-muted-foreground">Personal Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full-name"
                        placeholder="John Doe"
                        className="pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="age"
                          type="number"
                          placeholder="25"
                          className="pl-10"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="height"
                          type="number"
                          step="0.1"
                          placeholder="170"
                          className="pl-10"
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          placeholder="70"
                          className="pl-10"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Info */}
                <div className="space-y-3 pb-3 border-b">
                  <h3 className="font-medium text-sm text-muted-foreground">Health Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="health-conditions">Existing Health Conditions</Label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="health-conditions"
                        placeholder="Diabetes, Hypertension, Allergies..."
                        className="pl-10 min-h-[80px]"
                        value={healthConditions}
                        onChange={(e) => setHealthConditions(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="checkup-data">Recent Checkup Data</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="checkup-data"
                        placeholder="Blood pressure: 120/80, Blood sugar: 100mg/dL..."
                        className="pl-10 min-h-[80px]"
                        value={checkupData}
                        onChange={(e) => setCheckupData(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">Contact & Emergency</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          placeholder="Click detect to get GPS location"
                          className="pl-10"
                          value={location}
                          readOnly
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="shrink-0"
                      >
                        {isDetectingLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                        <span className="ml-1 hidden sm:inline">Detect</span>
                      </Button>
                    </div>
                    {gpsCoords && (
                      <p className="text-xs text-muted-foreground">
                        📍 GPS coordinates captured for emergency sharing
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contact"
                        type="tel"
                        placeholder="+91 XXXXXXXXXX"
                        className="pl-10"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergency-contact">Emergency Contact Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="emergency-contact"
                        type="tel"
                        placeholder="+91 XXXXXXXXXX"
                        className="pl-10"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Trusted Hospitals */}
                <div className="space-y-3 pb-3 border-b">
                  <TrustedHospitalsForm
                    hospitals={trustedHospitals}
                    onChange={setTrustedHospitals}
                    maxHospitals={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
