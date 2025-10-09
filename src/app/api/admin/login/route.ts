import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    const [rows]: any = await connection.execute(
      "SELECT * FROM admins WHERE email = ? AND password = ?",
      [email, password]
    );

    await connection.end();

    if (rows.length === 0) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // login success → redirect
    return NextResponse.json({ message: "Admin login successful!", redirect: "/admin/dashboard" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
