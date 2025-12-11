import { NextRequest, NextResponse } from "next/server";

const ROCKET_CHAT_WEBHOOK_URL =
  "https://vchat.syncbim.com/hooks/693a845e4326ada38f1880b2/cxZwnn77C2cFFRZWZxAs3YXzHkS47DoFjzDbBK4PATHNp7ap";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(ROCKET_CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to send message to Rocket Chat" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rocket Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
