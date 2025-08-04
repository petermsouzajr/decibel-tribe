import { NextResponse } from "next/server";
import { exportUserData } from "@/app/(auth)/deleteAccount";

export async function GET() {
  try {
    const result = await exportUserData();

    if (result.success && result.data) {
      return NextResponse.json(
        { 
          message: result.message,
          data: result.data 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in export data API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 