import { useState, useCallback, useImperativeHandle, forwardRef, useEffect } from "react";
import { AlertTriangle, Loader2, Mail, MessageCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useLocation, LocationData } from "@/hooks/useLocation";
import { Profile } from "@/hooks/useProfile";
import { useTrustedHospitals, TrustedHospital } from "@/hooks/useTrustedHospitals";
import { EmergencyHospitalSelector } from "./EmergencyHospitalSelector";
import { useAuth } from "@/hooks/useAuth";

interface EmergencyButtonProps {
  profile: Profile | null;
}

export interface EmergencyButtonRef {
  triggerAutoEmergency: () => void;
}

const EMERGENCY_NUMBER = "8778741264";
const EMAIL_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emergency-email`;

export const EmergencyButton = forwardRef<EmergencyButtonRef, EmergencyButtonProps>(
  ({ profile }, ref) => {
    const [isSending, setIsSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showHospitalSelector, setShowHospitalSelector] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
    const { getCurrentLocation, getGoogleMapsUrl } = useLocation();
    const { user } = useAuth();
    const { hospitals, fetchHospitals } = useTrustedHospitals(user?.id);

    // Fetch hospitals when user changes
    useEffect(() => {
      if (user?.id) {
        fetchHospitals();
      }
    }, [user?.id, fetchHospitals]);

    const openWhatsApp = useCallback((phoneE164NoPlus: string, text: string) => {
      const encodedText = encodeURIComponent(text);
      const appUrl = `whatsapp://send?phone=${phoneE164NoPlus}&text=${encodedText}`;
      const webUrl = `https://wa.me/${phoneE164NoPlus}?text=${encodedText}`;

      try {
        window.location.href = appUrl;
      } catch {
        // ignore
      }

      window.setTimeout(() => {
        const w = window.open(webUrl, "_blank");
        if (!w || w.closed || typeof w.closed === "undefined") {
          window.location.href = webUrl;
        }
      }, 500);
    }, []);

    const formatEmergencyMessage = (profile: Profile | null, location: LocationData, hospital?: TrustedHospital) => {
      const parts = [
        "🚨 EMERGENCY ALERT - MediGuide",
        "",
      ];

      if (hospital) {
        parts.push(`🏥 Requesting emergency assistance from: ${hospital.hospital_name}`);
        parts.push("");
      }

      if (profile) {
        parts.push(`👤 Name: ${profile.full_name}`);
        if (profile.age) parts.push(`📅 Age: ${profile.age} years`);
        if (profile.height_cm) parts.push(`📏 Height: ${profile.height_cm} cm`);
        if (profile.weight_kg) parts.push(`⚖️ Weight: ${profile.weight_kg} kg`);
        parts.push("");
        if (profile.health_conditions) parts.push(`🏥 Health Conditions: ${profile.health_conditions}`);
        if (profile.checkup_data) parts.push(`📋 Checkup Data: ${profile.checkup_data}`);
        parts.push("");
        if (profile.location) parts.push(`📍 Registered Location: ${profile.location}`);
        if (profile.contact_number) parts.push(`📞 Contact: ${profile.contact_number}`);
        if (profile.emergency_contact_number) parts.push(`🆘 Emergency Contact: ${profile.emergency_contact_number}`);
      } else {
        parts.push("⚠️ User profile not available");
      }

      parts.push("");
      parts.push(`🗺️ LIVE LOCATION:`);
      parts.push(`Lat: ${location.latitude.toFixed(6)}`);
      parts.push(`Long: ${location.longitude.toFixed(6)}`);
      parts.push(`Accuracy: ${location.accuracy.toFixed(0)}m`);
      parts.push("");
      parts.push(`📍 Google Maps: ${getGoogleMapsUrl(location)}`);

      return parts.filter(Boolean).join("\n");
    };

    const sendEmergencyEmail = async (location: LocationData, isAutoTriggered: boolean = false) => {
      try {
        const response = await fetch(EMAIL_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            profile: profile ? {
              full_name: profile.full_name,
              age: profile.age,
              height_cm: profile.height_cm,
              weight_kg: profile.weight_kg,
              health_conditions: profile.health_conditions,
              checkup_data: profile.checkup_data,
              location: profile.location,
              contact_number: profile.contact_number,
              emergency_contact_number: profile.emergency_contact_number,
            } : null,
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
            },
            isAutoTriggered,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send email");
        }

        console.log("Emergency email sent successfully");
        return true;
      } catch (error) {
        console.error("Error sending emergency email:", error);
        return false;
      }
    };

    const handleHospitalSelect = useCallback((hospital: TrustedHospital) => {
      if (!currentLocation) return;

      const message = formatEmergencyMessage(profile, currentLocation, hospital);
      
      // Clean phone number - remove spaces and non-digits except +
      let phone = hospital.hospital_phone.replace(/[^\d+]/g, "");
      if (phone.startsWith("+")) {
        phone = phone.substring(1);
      } else if (!phone.startsWith("91")) {
        phone = "91" + phone;
      }

      openWhatsApp(phone, message);
      setIsOpen(false);
      setShowHospitalSelector(false);

      toast({
        title: "Emergency Request Sent",
        description: `Sending emergency details to ${hospital.hospital_name}`,
      });
    }, [currentLocation, profile, openWhatsApp]);

    const handleHospitalCall = useCallback((hospital: TrustedHospital) => {
      let phone = hospital.hospital_phone.replace(/[^\d+]/g, "");
      window.location.href = `tel:${phone}`;
    }, []);

    const triggerAutoEmergency = useCallback(async () => {
      console.log("Auto-triggering emergency due to inactivity");
      
      toast({
        title: "⚠️ Auto-Emergency Triggered",
        description: "You were unresponsive for 2 minutes. Sending emergency alert...",
        variant: "destructive",
      });

      try {
        const location = await getCurrentLocation();
        
        // Send email
        const emailSent = await sendEmergencyEmail(location, true);
        
        // If user has hospitals, use first priority hospital
        if (hospitals.length > 0) {
          const priorityHospital = hospitals[0];
          const message = formatEmergencyMessage(profile, location, priorityHospital);
          
          let phone = priorityHospital.hospital_phone.replace(/[^\d+]/g, "");
          if (phone.startsWith("+")) {
            phone = phone.substring(1);
          } else if (!phone.startsWith("91")) {
            phone = "91" + phone;
          }

          openWhatsApp(
            phone,
            message + "\n\n⚠️ AUTO-TRIGGERED: User unresponsive for 2 minutes"
          );

          toast({
            title: emailSent ? "Emergency Alert Sent" : "Emergency Alert Partial",
            description: `Contacting ${priorityHospital.hospital_name}. ${emailSent ? "Email sent." : "Email may have failed."}`,
          });
        } else {
          // Fallback to default emergency number
          const message = formatEmergencyMessage(profile, location);
          openWhatsApp(
            `91${EMERGENCY_NUMBER}`,
            message + "\n\n⚠️ AUTO-TRIGGERED: User unresponsive for 2 minutes"
          );

          toast({
            title: emailSent ? "Emergency Alert Sent" : "Emergency Alert Partial",
            description: emailSent 
              ? "Email and WhatsApp alerts have been sent to emergency contacts."
              : "WhatsApp opened. Email may have failed - please ensure someone is notified.",
          });
        }
      } catch (error: any) {
        console.error("Auto-emergency error:", error);
        toast({
          title: "Emergency Alert Failed",
          description: "Could not get location. Please call emergency services directly.",
          variant: "destructive",
        });
      }
    }, [profile, getCurrentLocation, hospitals, openWhatsApp]);

    // Expose the trigger function to parent
    useImperativeHandle(ref, () => ({
      triggerAutoEmergency,
    }), [triggerAutoEmergency]);

    const handleEmergency = async () => {
      setIsSending(true);

      try {
        let location: LocationData;
        try {
          location = await getCurrentLocation();
        } catch (error: any) {
          toast({
            title: "Location Required",
            description: "Please enable location services to send emergency alert.",
            variant: "destructive",
          });
          setIsSending(false);
          return;
        }

        setCurrentLocation(location);

        // Send emergency email
        const emailSent = await sendEmergencyEmail(location, false);

        // If user has hospitals, show selector
        if (hospitals.length > 0) {
          setShowHospitalSelector(true);
          setIsSending(false);
          toast({
            title: emailSent ? "Email Sent" : "Email Failed",
            description: emailSent 
              ? "Now select a hospital to contact via WhatsApp or call."
              : "Could not send email. Select a hospital to contact directly.",
          });
          return;
        }

        // No hospitals - use default emergency number
        const message = formatEmergencyMessage(profile, location);
        openWhatsApp(`91${EMERGENCY_NUMBER}`, message);

        toast({
          title: emailSent ? "Emergency Alert Sent" : "Emergency Alert Prepared",
          description: emailSent 
            ? `Email sent to emergency contact. Opening WhatsApp to ${EMERGENCY_NUMBER}...`
            : `Opening WhatsApp to send emergency details to ${EMERGENCY_NUMBER}`,
        });
        
        setIsOpen(false);
      } catch (error: any) {
        console.error("Emergency error:", error);
        toast({
          title: "Emergency Failed",
          description: "Could not send emergency alert. Please call emergency services directly.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    };

    const handleDialogOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setShowHospitalSelector(false);
        setCurrentLocation(null);
      }
    };

    return (
      <AlertDialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="font-semibold shadow-lg"
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-1" />
            )}
            Emergency
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {showHospitalSelector ? "Select Hospital to Contact" : "Send Emergency Alert?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {showHospitalSelector ? (
                <EmergencyHospitalSelector
                  hospitals={hospitals}
                  onSelectHospital={handleHospitalSelect}
                  onCallHospital={handleHospitalCall}
                />
              ) : (
                <>
                  <p>
                    This will share your <strong>live GPS location</strong> {profile && "and complete health profile"} via:
                  </p>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </div>
                    <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                      <Mail className="w-3 h-3" />
                      Email
                    </div>
                    {hospitals.length > 0 && (
                      <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-sm">
                        <Building2 className="w-3 h-3" />
                        {hospitals.length} Hospital{hospitals.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  {profile ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      Information shared: Name, age, height, weight, health conditions, checkup data, contact numbers, and live GPS coordinates.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground font-medium mt-2">
                      ⚠️ Sign in to share your complete health profile along with location.
                    </p>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!showHospitalSelector && (
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEmergency}
                disabled={isSending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  "Send Emergency Alert"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
          {showHospitalSelector && (
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowHospitalSelector(false)}>
                Back
              </AlertDialogCancel>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

EmergencyButton.displayName = "EmergencyButton";
