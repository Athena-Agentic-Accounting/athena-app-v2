import { NextResponse } from "next/server"

const CLERK_TEST_CODE = "424242"

export async function POST(req: Request) {
  const { email, code, userId } = await req.json()

  if (!email || !code || !userId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const isTestAddress = email.includes("+clerk_test")

    const isValid =
      process.env.NODE_ENV !== "production"
        ? code === CLERK_TEST_CODE
        : isTestAddress
          ? code === CLERK_TEST_CODE
          : code.length === 6

    if (!isValid) {
      return NextResponse.json(
        { error: `Invalid code. ${process.env.NODE_ENV !== "production" ? `Use ${CLERK_TEST_CODE} in dev.` : ""}` },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ ok: true, userId })
    response.cookies.set("athena_session", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (err) {
    console.error("Auth verify error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
