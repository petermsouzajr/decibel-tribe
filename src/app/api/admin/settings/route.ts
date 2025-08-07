import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

// For now, we'll use a simple object to store settings
// In a real app, you'd want to store these in a database table
const defaultSettings = {
  contentModeration: {
    autoFlagSuspicious: true,
    requireAdminApproval: false,
    maxReportsBeforeSuspension: 5
  },
  notifications: {
    emailNotifications: true,
    dailySummary: false,
    reportThreshold: 10
  },
  platform: {
    maintenanceMode: false,
    allowRegistrations: true,
    defaultUserRole: "USER"
  },
  security: {
    twoFactorForAdmins: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  }
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    // In a real app, you'd fetch from database
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const settings = await request.json();
    
    // In a real app, you'd save to database
    console.log("Saving settings:", settings);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
