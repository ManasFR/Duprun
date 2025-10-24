import { NextRequest, NextResponse } from "next/server";
import mysql, { RowDataPacket } from "mysql2/promise";

// Define Admin interface based on admins table schema
interface Admin extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  // Add other fields if your table has them, like created_at, etc.
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    // Use RowDataPacket for rows, typed as Admin
    const [rows]: [Admin[], unknown] = await connection.execute(
      "SELECT * FROM admins WHERE email = ? AND password = ?",
      [email, password]
    );

    await connection.end();

    if (rows.length === 0) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Login success, return redirect
    return NextResponse.json({ message: "Admin login successful!", redirect: "/admin/dashboard" });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}