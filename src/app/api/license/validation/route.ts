import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";


export async function POST(req: Request) {
  try {
    const { planId, licenseCode } = await req.json();

    if (!planId || !licenseCode) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    // Step 1: Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: Number(planId) },
      select: { license_id: true },
    });

    if (!plan) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    // Step 2: Get license record
    const license = await prisma.license.findUnique({
      where: { id: plan.license_id },
      select: { licenseCodes: true, status: true },
    });

    if (!license) {
      return NextResponse.json({ success: false, message: "License not found" }, { status: 404 });
    }

    // Step 3: Parse license codes
    const codes = JSON.parse(license.licenseCodes || "[]");

    // Step 4: Check if provided code exists
    const isValid = codes.includes(licenseCode);

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid license code" }, { status: 400 });
    }

    // Step 5: Success
    return NextResponse.json({ success: true, message: "License validated successfully!" });

  } catch (err) {
    console.error("License validation error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
