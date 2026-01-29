import { useState } from "react";
import { Plus, Trash2, Building2, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export interface HospitalFormData {
  hospital_name: string;
  hospital_address: string;
  hospital_phone: string;
}

interface TrustedHospitalsFormProps {
  hospitals: HospitalFormData[];
  onChange: (hospitals: HospitalFormData[]) => void;
  maxHospitals?: number;
}

export function TrustedHospitalsForm({
  hospitals,
  onChange,
  maxHospitals = 3,
}: TrustedHospitalsFormProps) {
  const addHospital = () => {
    if (hospitals.length >= maxHospitals) return;
    onChange([
      ...hospitals,
      { hospital_name: "", hospital_address: "", hospital_phone: "" },
    ]);
  };

  const removeHospital = (index: number) => {
    onChange(hospitals.filter((_, i) => i !== index));
  };

  const updateHospital = (index: number, field: keyof HospitalFormData, value: string) => {
    const updated = [...hospitals];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">
          Trusted Nearby Hospitals (for emergencies)
        </h3>
        {hospitals.length < maxHospitals && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addHospital}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Hospital
          </Button>
        )}
      </div>

      {hospitals.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-4 text-center">
            <Building2 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Add up to {maxHospitals} trusted hospitals for emergency contact
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHospital}
              className="mt-2"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add First Hospital
            </Button>
          </CardContent>
        </Card>
      )}

      {hospitals.map((hospital, index) => (
        <Card key={index} className="relative">
          <CardContent className="pt-4 pb-3 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-primary">
                Priority #{index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeHospital(index)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`hospital-name-${index}`} className="text-xs">
                Hospital Name *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`hospital-name-${index}`}
                  placeholder="Apollo Hospital"
                  className="pl-10 h-9 text-sm"
                  value={hospital.hospital_name}
                  onChange={(e) => updateHospital(index, "hospital_name", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`hospital-phone-${index}`} className="text-xs">
                Hospital Phone *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`hospital-phone-${index}`}
                  type="tel"
                  placeholder="+91 XXXXXXXXXX"
                  className="pl-10 h-9 text-sm"
                  value={hospital.hospital_phone}
                  onChange={(e) => updateHospital(index, "hospital_phone", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`hospital-address-${index}`} className="text-xs">
                Address (optional)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`hospital-address-${index}`}
                  placeholder="123 Medical Street, City"
                  className="pl-10 h-9 text-sm"
                  value={hospital.hospital_address}
                  onChange={(e) => updateHospital(index, "hospital_address", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hospitals.length > 0 && hospitals.length < maxHospitals && (
        <p className="text-xs text-muted-foreground text-center">
          You can add {maxHospitals - hospitals.length} more hospital(s)
        </p>
      )}
    </div>
  );
}
