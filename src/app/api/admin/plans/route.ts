import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
    const { planName, licenseId, retailPrice, salePrice } = body;

    console.log('Received data:', { planName, licenseId, retailPrice, salePrice });

    // Detailed validation
    if (!planName || licenseId === undefined || retailPrice === undefined || salePrice === undefined) {
      return NextResponse.json(
        { error: 'All fields are required', details: { planName, licenseId, retailPrice, salePrice } },
        { status: 400 }
      );
    }

    // Ensure licenseId is a valid integer
    const parsedLicenseId = parseInt(licenseId);
    if (isNaN(parsedLicenseId) || !Number.isInteger(parsedLicenseId)) {
      return NextResponse.json(
        { error: 'License ID must be a valid integer', details: { licenseId } },
        { status: 400 }
      );
    }

    // Ensure retailPrice and salePrice are valid numbers
    const parsedRetailPrice = parseFloat(retailPrice);
    const parsedSalePrice = parseFloat(salePrice);
    if (isNaN(parsedRetailPrice) || isNaN(parsedSalePrice)) {
      return NextResponse.json(
        { error: 'Retail price and sale price must be valid numbers', details: { retailPrice, salePrice } },
        { status: 400 }
      );
    }

    // Verify licenseId exists in the database
    const existingLicense = await prisma.license.findUnique({
      where: { id: parsedLicenseId },
    });
    
    if (!existingLicense) {
      return NextResponse.json(
        { error: 'Invalid license ID', details: { licenseId: parsedLicenseId } },
        { status: 400 }
      );
    }

    console.log('Creating plan with license:', existingLicense.name);

    // Save to database
    const newPlan = await prisma.plan.create({
      data: {
        planName,
        licenseId: parsedLicenseId,
        retailPrice: parsedRetailPrice,
        salePrice: parsedSalePrice,
      },
    });

    console.log('Plan created successfully:', newPlan);

    return NextResponse.json(
      { message: 'Plan created successfully', data: newPlan },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating plan:', {
      message: error.message,
      stack: error.stack,
      receivedBody: body,
    });
    return NextResponse.json(
      { error: 'Failed to create plan', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        planName: true,
        licenseId: true,
        retailPrice: true,
        salePrice: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json(
      { message: 'List of plans', data: plans },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching plans:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to fetch plans', details: error.message },
      { status: 500 }
    );
  }
}