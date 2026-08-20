import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  try {
    const db = await getDb();
    if (slug) {
      const doc = await db.collection("legal_documents").findOne({ slug });
      return NextResponse.json({ success: true, document: doc });
    }

    const docs = await db.collection("legal_documents").find({}).toArray();
    return NextResponse.json({ success: true, documents: docs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch legal document" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slug, title, lastUpdated, email, sections } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("legal_documents").updateOne(
      { slug },
      {
        $set: {
          slug,
          title,
          lastUpdated: lastUpdated || new Date().toISOString().split("T")[0],
          email: email || "",
          sections: sections || [],
          updatedAt: new Date(),
          updatedBy: admin.email,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "บันทึกเอกสารทางกฎหมายเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update legal document" }, { status: 500 });
  }
}
