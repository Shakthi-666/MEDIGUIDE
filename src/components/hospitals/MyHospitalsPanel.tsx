import { useState } from "react";
import { Building2, Phone, MapPin, MessageCircle, Calendar, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTrustedHospitals } from "@/hooks/useTrustedHospitals";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface MyHospitalsPanelProps {
  onAddHospital?: () => void;
}

export function MyHospitalsPanel({ onAddHospital }: MyHospitalsPanelProps) {
  const { user } = useAuth();
  const { hospitals, loading } = useTrustedHospitals(user?.id);
  const [isOpen, setIsOpen] = useState(true);

  const formatPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  };

  const handleBookAppointment = (hospitalName: string, hospitalPhone: string) => {
    const phone = formatPhoneForWhatsApp(hospitalPhone);
    const message = encodeURIComponent(
      `Hello ${hospitalName},\n\nI would like to book a medical appointment. Please let me know the available slots.\n\nThank you.`
    );
    
    // Try deep link first, fallback to web
    const deepLink = `whatsapp://send?phone=${phone}&text=${message}`;
    const webLink = `https://wa.me/${phone}?text=${message}`;
    
    // Attempt deep link
    window.location.href = deepLink;
    
    // Fallback after delay
    setTimeout(() => {
      window.open(webLink, "_blank");
    }, 500);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign in to manage your trusted hospitals
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                My Hospitals
                <Badge variant="secondary" className="ml-1">
                  {hospitals.length}
                </Badge>
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {hospitals.length === 0 ? (
              <div className="text-center py-4">
                <Building2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">
                  No hospitals added yet
                </p>
                {onAddHospital && (
                  <Button size="sm" variant="outline" onClick={onAddHospital}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Hospital
                  </Button>
                )}
              </div>
            ) : (
              <>
                {hospitals
                  .sort((a, b) => a.priority - b.priority)
                  .map((hospital) => (
                    <div
                      key={hospital.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">
                              {hospital.hospital_name}
                            </h4>
                            <Badge 
                              variant={hospital.priority === 1 ? "default" : "outline"} 
                              className="shrink-0 text-xs"
                            >
                              #{hospital.priority}
                            </Badge>
                          </div>
                          {hospital.hospital_address && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{hospital.hospital_address}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            {hospital.hospital_phone}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90"
                          onClick={() => handleBookAppointment(hospital.hospital_name, hospital.hospital_phone)}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Book via WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleCall(hospital.hospital_phone)}
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {onAddHospital && hospitals.length < 3 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={onAddHospital}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Another Hospital
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
