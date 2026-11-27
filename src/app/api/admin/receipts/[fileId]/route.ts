import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { readReceiptFile } from "@/lib/payment";

type Params = { params: Promise<{ fileId: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;
  if (!/^[a-f0-9]{32}$/.test(fileId)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const receipt = await readReceiptFile(fileId);
  if (!receipt) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(receipt.bytes), {
    headers: {
      "Content-Type": receipt.payment.mime,
      "Content-Length": String(receipt.bytes.byteLength),
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${receipt.payment.originalName}"`,
    },
  });
}
