import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
    const { planName, license_id, retailPrice, salePrice, features, videos, watermark, noWatermark } = body;

    console.log('Received data:', { planName, license_id, retailPrice, salePrice, features, videos, watermark, noWatermark });

    if (!planName || license_id === undefined || retailPrice === undefined || salePrice === undefined) {
      return NextResponse.json(
        { error: 'Required fields missing', details: { planName, license_id, retailPrice, salePrice } },
        { status: 400 }
      );
    }

    const parsedlicense_id = parseInt(license_id);
    const parsedRetailPrice = parseFloat(retailPrice);
    const parsedSalePrice = parseFloat(salePrice);
    const parsedVideos = videos !== undefined ? parseInt(videos) : 0;
    const parsedWatermark = watermark !== undefined ? parseInt(watermark) : 0;
    const parsedNoWatermark = noWatermark !== undefined ? parseInt(noWatermark) : 0;

    if (isNaN(parsedlicense_id) || !Number.isInteger(parsedlicense_id)) {
      return NextResponse.json({ error: 'License ID must be an integer' }, { status: 400 });
    }
    if (isNaN(parsedRetailPrice) || isNaN(parsedSalePrice)) {
      return NextResponse.json({ error: 'Prices must be numbers' }, { status: 400 });
    }
    if (isNaN(parsedVideos) || parsedVideos < 0) {
      return NextResponse.json({ error: 'Videos must be a positive number' }, { status: 400 });
    }
    if (![0, 1].includes(parsedWatermark) || ![0, 1].includes(parsedNoWatermark)) {
      return NextResponse.json({ error: 'Watermark fields must be 0 or 1' }, { status: 400 });
    }

    const existingLicense = await prisma.license.findUnique({ where: { id: parsedlicense_id } });
    if (!existingLicense) return NextResponse.json({ error: 'Invalid license ID' }, { status: 400 });

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
        license_id: parsedlicense_id,
        retailPrice: parsedRetailPrice,
        salePrice: parsedSalePrice,
        videos: parsedVideos,
        watermark: parsedWatermark,
        noWatermark: parsedNoWatermark,
        features: parsedFeatures.length ? parsedFeatures : [],
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
        license_id: true,
        retailPrice: true,
        salePrice: true,
        videos: true,
        watermark: true,
        noWatermark: true,
        features: true,
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