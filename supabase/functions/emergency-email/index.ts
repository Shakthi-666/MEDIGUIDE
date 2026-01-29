import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyEmailRequest {
  profile: {
    full_name?: string;
    age?: number;
    height_cm?: number;
    weight_kg?: number;
    health_conditions?: string;
    checkup_data?: string;
    location?: string;
    contact_number?: string;
    emergency_contact_number?: string;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  isAutoTriggered?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, location, isAutoTriggered = false }: EmergencyEmailRequest = await req.json();
    
    const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    const triggerType = isAutoTriggered ? "AUTO-TRIGGERED (User unresponsive for 30 seconds)" : "USER-TRIGGERED";
    
    let profileHtml = "";
    if (profile) {
      profileHtml = `
        <h2 style="color: #dc2626;">👤 User Profile</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.full_name || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Age</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.age ? profile.age + ' years' : 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Height</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.height_cm ? profile.height_cm + ' cm' : 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Weight</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.weight_kg ? profile.weight_kg + ' kg' : 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Health Conditions</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.health_conditions || 'None specified'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Checkup Data</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.checkup_data || 'None specified'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Registered Location</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.location || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Contact Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.contact_number || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Emergency Contact</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${profile.emergency_contact_number || 'N/A'}</td></tr>
        </table>
      `;
    } else {
      profileHtml = `<p style="color: #f59e0b;"><strong>⚠️ User profile not available</strong></p>`;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Emergency Alert - MediGuide</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0;">🚨 EMERGENCY ALERT</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">${triggerType}</p>
        </div>
        
        <div style="padding: 20px; background: #fef2f2; border-radius: 10px; margin-top: 20px;">
          ${profileHtml}
        </div>
        
        <div style="padding: 20px; background: #f0fdf4; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #16a34a;">📍 Live GPS Location</h2>
          <p><strong>Latitude:</strong> ${location.latitude.toFixed(6)}</p>
          <p><strong>Longitude:</strong> ${location.longitude.toFixed(6)}</p>
          <p><strong>Accuracy:</strong> ${location.accuracy.toFixed(0)} meters</p>
          <a href="${googleMapsUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 10px; font-weight: bold;">
            📍 Open in Google Maps
          </a>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 10px; text-align: center;">
          <p style="margin: 0; color: #92400e;"><strong>⏰ Alert Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
          This emergency alert was sent from MediGuide Health App
        </p>
      </body>
      </html>
    `;

    console.log("Sending emergency email to msfrancis777@gmail.com");
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MediGuide Emergency <onboarding@resend.dev>",
        to: ["msfrancis777@gmail.com"],
        subject: `🚨 EMERGENCY ALERT - MediGuide ${isAutoTriggered ? "(Auto-Triggered)" : ""}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Emergency email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in emergency-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
