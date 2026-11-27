import { NextResponse } from "next/server";
import { endAdminSession, startAdminSession, verifyTelegramInitData } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { initData?: string } | null;
  const initData = body?.initData?.trim() || "";
  const verified = verifyTelegramInitData(initData);
  if (!verified) {
    return NextResponse.json({ error: "ورود ادمین نامعتبر است." }, { status: 401 });
  }

  const started = await startAdminSession(verified.user);
  if (!started.ok) {
    return NextResponse.json({ error: started.error }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    admin: {
      tgId: started.session.tgId,
      name: started.session.name,
      username: started.session.username,
    },
  });
}

export async function DELETE() {
  await endAdminSession();
  return NextResponse.json({ ok: true });
}
