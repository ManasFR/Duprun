import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
    const { planName, licenseId, retailPrice, salePrice, features } = body;

    console.log('Received data:', { planName, licenseId, retailPrice, salePrice, features });

    if (!planName || licenseId === undefined || retailPrice === undefined || salePrice === undefined) {
      return NextResponse.json(
        { error: 'All fields are required', details: { planName, licenseId, retailPrice, salePrice } },
        { status: 400 }
      );
    }

    const parsedLicenseId = parseInt(licenseId);
    const parsedRetailPrice = parseFloat(retailPrice);
    const parsedSalePrice = parseFloat(salePrice);

    if (isNaN(parsedLicenseId) || !Number.isInteger(parsedLicenseId)) {
      return NextResponse.json({ error: 'License ID must be an integer' }, { status: 400 });
    }
    if (isNaN(parsedRetailPrice) || isNaN(parsedSalePrice)) {
      return NextResponse.json({ error: 'Prices must be numbers' }, { status: 400 });
    }

    const existingLicense = await prisma.license.findUnique({ where: { id: parsedLicenseId } });
    if (!existingLicense) return NextResponse.json({ error: 'Invalid license ID' }, { status: 400 });

    // Ensure features is a valid array for JSON
    let parsedFeatures: string[] = [];
    if (features) {
      if (!Array.isArray(features)) {
        return NextResponse.json({ error: 'Features must be an array' }, { status: 400 });
      }
      parsedFeatures = features.map(f => String(f).trim()).filter(f => f.length > 0);
    }

    const newPlan = await prisma.plan.create({
      data: {
        planName,
        licenseId: parsedLicenseId,
        retailPrice: parsedRetailPrice,
        salePrice: parsedSalePrice,
        features: parsedFeatures.length ? parsedFeatures : [], // JSON array
      } as Prisma.PlanUncheckedCreateInput,
    });

    return NextResponse.json({ message: 'Plan created', data: newPlan }, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error, 'body:', body);
    return NextResponse.json({ error: 'Failed to create plan', details: error.message }, { status: 500 });
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
        features:true
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