import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF file required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const { text, totalPages } = await extractText(new Uint8Array(bytes), { mergePages: true });

    return NextResponse.json({
      studyId: crypto.randomUUID(),
      fileName: file.name,
      text: (text as string).slice(0, 15000),
      pages: totalPages,
    });
  } catch (e: any) {
    console.error("Upload/parse error:", e);
    return NextResponse.json({ error: e.message ?? "Upload failed" }, { status: 500 });
  }
}
