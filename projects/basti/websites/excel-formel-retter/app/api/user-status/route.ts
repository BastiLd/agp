import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { isPro: false, error: "Email fehlt" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { isPro: true },
    });

    return NextResponse.json({
      isPro: user?.isPro || false,
    });
  } catch (error: any) {
    console.error("User Status API Error:", error);
    // Bei DB-Fehler: false zurückgeben (sicherer Fallback)
    return NextResponse.json({ isPro: false });
  }
}

