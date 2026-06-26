import { NextResponse } from "next/server"
import { createClerkClient } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

    const { data: userList } = await clerk.users.getUserList({
      emailAddress: [email],
    })
    const existingUser = userList[0]

    const userId = existingUser
      ? existingUser.id
      : `local_${Buffer.from(email.toLowerCase()).toString("base64url")}`

    return NextResponse.json({ ok: true, userId })
  } catch (err) {
    console.error("Auth start error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
