import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { requireAdmin } from "@/lib/adminAuth";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const admin = await requireAdmin();
    const session = await getSession();

    if (!admin && !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    let filter = {};

    if (!admin && session) {
      filter = { userId: session.userId };
    }

    const tickets = await db
      .collection("support_tickets")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = tickets.map((t) => ({
      id: t._id.toString(),
      ticketNo: t.ticketNo || `TCK-${t._id.toString().slice(-6).toUpperCase()}`,
      userName: t.userName || "สมาชิก",
      userEmail: t.userEmail || "user@lunaforex.com",
      subject: t.subject,
      category: t.category || "ทั่วไป",
      message: t.message,
      status: t.status || "pending",
      reply: t.reply || "",
      createdAt: t.createdAt,
    }));

    return NextResponse.json({ success: true, tickets: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { subject, category, message, name, email } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "กรุณากรอกหัวข้อและรายละเอียดข้อความ" }, { status: 400 });
    }

    const db = await getDb();
    const ticketNo = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    const displayName = session
      ? `${session.firstName || ""} ${session.lastName || ""}`.trim() || "สมาชิก Lunaforex"
      : name || "สมาชิก Lunaforex";

    const displayEmail = session?.email || email || "member@lunaforex.com";

    const newTicket = {
      ticketNo,
      userId: session?.userId || null,
      userName: displayName,
      userEmail: displayEmail,
      subject,
      category: category || "ทั่วไป",
      message,
      status: "pending",
      reply: "",
      createdAt: new Date(),
    };

    const result = await db.collection("support_tickets").insertOne(newTicket);

    return NextResponse.json({
      success: true,
      ticket: { id: result.insertedId.toString(), ...newTicket },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit ticket" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, reply } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing Ticket ID" }, { status: 400 });
    }

    const db = await getDb();
    const updateData: any = { updatedAt: new Date() };

    if (status) updateData.status = status;
    if (reply !== undefined) updateData.reply = reply;

    await db.collection("support_tickets").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update ticket" }, { status: 500 });
  }
}
