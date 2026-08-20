import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const admins = await db
      .collection("users")
      .find({ role: "admin" })
      .sort({ createdAt: -1 })
      .toArray();

    const sanitized = admins.map((u) => ({
      _id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone || "",
      status: u.status || "active",
      role: u.role || "admin",
      hasPin: Boolean(u.adminPin),
      adminPin: u.adminPin || "123456",
      createdAt: u.createdAt || new Date(),
    }));

    return NextResponse.json({ success: true, admins: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName, email, phone, password, adminPin } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน" }, { status: 400 });
    }

    if (adminPin && (!/^\d{6}$/.test(adminPin))) {
      return NextResponse.json({ error: "รหัส PIN ต้องเป็นตัวเลข 6 หลักเท่านั้น" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานในระบบแล้ว" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = {
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone: phone || "",
      passwordHash,
      role: "admin",
      status: "active",
      adminPin: adminPin || "123456",
      accountType: "pro",
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newAdmin);

    return NextResponse.json({
      success: true,
      message: "เพิ่มผู้ดูแลระบบใหม่สำเร็จแล้ว",
      adminId: result.insertedId.toString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create admin" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentAdmin = await requireAdmin();
    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, firstName, lastName, phone, status, role, adminPin, newPassword } = await req.json();

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Admin ID" }, { status: 400 });
    }

    const updateFields: Record<string, any> = { updatedAt: new Date() };

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (phone !== undefined) updateFields.phone = phone;
    if (status) updateFields.status = status;
    if (role) updateFields.role = role;
    if (adminPin) {
      if (!/^\d{6}$/.test(adminPin)) {
        return NextResponse.json({ error: "รหัส PIN ต้องเป็นตัวเลข 6 หลัก" }, { status: 400 });
      }
      updateFields.adminPin = adminPin;
    }
    if (newPassword) {
      updateFields.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true, message: "อัปเดตข้อมูลแอดมินสำเร็จแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update admin" }, { status: 500 });
  }
}
