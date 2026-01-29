import { Building2, Phone, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustedHospital } from "@/hooks/useTrustedHospitals";

interface EmergencyHospitalSelectorProps {
  hospitals: TrustedHospital[];
  onSelectHospital: (hospital: TrustedHospital) => void;
  onCallHospital: (hospital: TrustedHospital) => void;
}

export function EmergencyHospitalSelector({
  hospitals,
  onSelectHospital,
  onCallHospital,
}: EmergencyHospitalSelectorProps) {
  if (hospitals.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No trusted hospitals saved</p>
        <p className="text-xs">Add hospitals in your profile settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-center mb-3">
        Select a hospital to contact:
      </p>
      {hospitals.map((hospital) => (
        <Card key={hospital.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    #{hospital.priority}
                  </span>
                  <h4 className="font-medium text-sm truncate">{hospital.hospital_name}</h4>
                </div>
                {hospital.hospital_address && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{hospital.hospital_address}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  {hospital.hospital_phone}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={() => onSelectHospital(hospital)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onCallHospital(hospital)}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
