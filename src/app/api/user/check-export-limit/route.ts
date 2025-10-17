// src/app/api/user/check-export-limit/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Get logged-in user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please login" }, 
        { status: 401 }
      );
    }

    // Get user details with plan_id
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, plan_id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" }, 
        { status: 404 }
      );
    }

    // If plan_id is 0, user has no plan
    if (user.plan_id === 0) {
      return NextResponse.json({
        success: false,
        message: "No active plan. Please purchase a plan.",
        hasAccess: false,
        videosUsed: 0,
        videosLimit: 0,
        videosRemaining: 0,
        watermark: true,
      });
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: user.plan_id },
      select: { 
        id: true,
        planName: true,
        videos: true, 
        watermark: true, 
        noWatermark: true 
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" }, 
        { status: 404 }
      );
    }

    // Get current month's start and end date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Count exports this month
    const exportsThisMonth = await prisma.videoExports.count({
      where: {
        userId: user.id,
        exportedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const videosRemaining = plan.videos - exportsThisMonth;
    const hasAccess = exportsThisMonth < plan.videos;

    return NextResponse.json({
      success: true,
      hasAccess,
      videosUsed: exportsThisMonth,
      videosLimit: plan.videos,
      videosRemaining: Math.max(0, videosRemaining),
      watermark: plan.watermark === 1,
      noWatermark: plan.noWatermark === 1,
      planName: plan.planName,
    });

  } catch (err) {
    console.error("Check export limit error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" }, 
      { status: 500 }
    );
  }
}