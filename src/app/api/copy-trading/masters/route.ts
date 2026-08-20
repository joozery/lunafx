import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const DEFAULT_MASTERS = [
  {
    name: "Alex_Gold_Algo",
    accountType: "Real MT5",
    server: "LunaForex-Live01",
    badge: "Verified",
    roi30d: 14.8,
    roiTotal: 184.2,
    copiers: 1420,
    aum: "$485,200",
    maxDrawdown: 4.2,
    winRate: 81.5,
    daysActive: 512,
    profitShare: 15,
    minDeposit: 200,
    riskScore: 2,
    avatarColor: "from-[#c6a87c] to-[#997a49]",
    status: "active",
    featured: true,
  },
  {
    name: "Quantum_Fund_v4",
    accountType: "Real ECN",
    server: "LunaForex-Live02",
    badge: "Top Master",
    roi30d: 22.4,
    roiTotal: 340.5,
    copiers: 2890,
    aum: "$1,240,000",
    maxDrawdown: 7.8,
    winRate: 76.4,
    daysActive: 740,
    profitShare: 20,
    minDeposit: 500,
    riskScore: 4,
    avatarColor: "from-amber-600 to-amber-800",
    status: "active",
    featured: true,
  },
  {
    name: "Sovereign_FX",
    accountType: "Real MT4",
    server: "LunaForex-Live01",
    badge: "Low Risk",
    roi30d: 8.2,
    roiTotal: 92.4,
    copiers: 3150,
    aum: "$2,100,000",
    maxDrawdown: 2.1,
    winRate: 89.2,
    daysActive: 910,
    profitShare: 10,
    minDeposit: 100,
    riskScore: 1,
    avatarColor: "from-emerald-600 to-teal-800",
    status: "active",
    featured: false,
  },
];

export async function GET() {
  try {
    const db = await getDb();
    let masters = await db.collection("master_traders").find({}).toArray();

    if (masters.length === 0) {
      await db.collection("master_traders").insertMany(
        DEFAULT_MASTERS.map((m) => ({ ...m, createdAt: new Date() }))
      );
      masters = await db.collection("master_traders").find({}).toArray();
    }

    const sanitized = masters.map((m) => ({
      ...m,
      id: m._id.toString(),
      _id: m._id.toString(),
    }));

    return NextResponse.json({ success: true, masters: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch master traders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      accountType,
      server,
      badge,
      roi30d,
      roiTotal,
      copiers,
      aum,
      maxDrawdown,
      winRate,
      daysActive,
      profitShare,
      minDeposit,
      riskScore,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "กรุณาระบุชื่อ Master Trader" }, { status: 400 });
    }

    const db = await getDb();
    const newMaster = {
      name,
      accountType: accountType || "Real MT5",
      server: server || "LunaForex-Live01",
      badge: badge || "Verified",
      roi30d: Number(roi30d) || 0,
      roiTotal: Number(roiTotal) || 0,
      copiers: Number(copiers) || 0,
      aum: aum || "$0",
      maxDrawdown: Number(maxDrawdown) || 0,
      winRate: Number(winRate) || 0,
      daysActive: Number(daysActive) || 30,
      profitShare: Number(profitShare) || 15,
      minDeposit: Number(minDeposit) || 100,
      riskScore: Number(riskScore) || 3,
      avatarColor: "from-[#c6a87c] to-[#997a49]",
      status: "active",
      createdAt: new Date(),
      createdBy: admin.email,
    };

    const res = await db.collection("master_traders").insertOne(newMaster);
    return NextResponse.json({ success: true, id: res.insertedId.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create master" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Master ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("master_traders").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update master" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Master ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("master_traders").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete master" }, { status: 500 });
  }
}
