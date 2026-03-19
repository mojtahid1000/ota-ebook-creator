import { NextRequest, NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageNumber, Header, Footer,
  BorderStyle,
} from "docx";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseBoldText(text: string, fontSize: number): TextRun[] {
  const parts: TextRun[] = [];
  const segments = text.split(/\*\*(.*?)\*\*/g);
  for (let i = 0; i < segments.length; i++) {
    if (!segments[i]) continue;
    if (i % 2 === 1) {
      parts.push(new TextRun({ text: segments[i], bold: true, size: fontSize, font: "Arial" }));
    } else {
      parts.push(new TextRun({ text: segments[i], size: fontSize, font: "Arial" }));
    }
  }
  return parts.length > 0 ? parts : [new TextRun({ text, size: fontSize, font: "Arial" })];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title = "Untitled Ebook",
      subtitle = "",
      author = "Author",
      press = "OTA Press",
      website = "www.onlinetechacademy.com",
      chapters = [],
      design_settings = {},
      about_author = "",
    } = body;

    const fontSize = 24;
    const headingSize = 36;
    const children: Paragraph[] = [];

    // Title page
    children.push(
      new Paragraph({ spacing: { before: 4000 }, alignment: AlignmentType.CENTER, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: title, bold: true, size: 56, font: "Arial" })],
      }),
    );
    if (subtitle) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: subtitle, italics: true, size: 32, font: "Arial", color: "666666" })],
        }),
      );
    }
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 200 },
        children: [new TextRun({ text: author, size: 28, font: "Arial" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: press, size: 22, font: "Arial", color: "888888" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: website, size: 20, font: "Arial", color: "1a56db" })],
      }),
    );

    // TOC
    children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "সূচিপত্র", bold: true, size: 40, font: "Arial" })],
      }),
    );

    const chapterList = chapters as { title: string; content: string }[];
    chapterList.forEach((ch, i) => {
      children.push(
        new Paragraph({
          spacing: { after: 150 },
          children: [new TextRun({ text: `${i + 1}. ${ch.title}`, size: fontSize, font: "Arial" })],
        }),
      );
    });

    // Chapters
    chapterList.forEach((ch, i) => {
      children.push(
        new Paragraph({
          pageBreakBefore: true,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
          children: [new TextRun({ text: `অধ্যায় ${i + 1}: ${ch.title}`, bold: true, size: headingSize, font: "Arial" })],
        }),
      );

      const lines = (ch.content || "").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
          continue;
        }

        if (trimmed.startsWith("## ")) {
          children.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 200 },
              children: [new TextRun({ text: trimmed.replace(/^##\s+/, ""), bold: true, size: 30, font: "Arial" })],
            }),
          );
        } else if (trimmed.startsWith("### ")) {
          children.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 150 },
              children: [new TextRun({ text: trimmed.replace(/^###\s+/, ""), bold: true, size: 26, font: "Arial" })],
            }),
          );
        } else if (trimmed.startsWith("> ")) {
          children.push(
            new Paragraph({
              indent: { left: 720 },
              spacing: { after: 150 },
              border: { left: { style: BorderStyle.SINGLE, size: 6, color: "1a56db" } },
              children: [new TextRun({ text: trimmed.replace(/^>\s+/, ""), italics: true, size: fontSize, font: "Arial", color: "444444" })],
            }),
          );
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              spacing: { after: 80 },
              children: parseBoldText(`• ${trimmed.replace(/^[-*]\s+/, "")}`, fontSize),
            }),
          );
        } else if (/^\d+\.\s/.test(trimmed)) {
          children.push(
            new Paragraph({
              indent: { left: 360 },
              spacing: { after: 80 },
              children: parseBoldText(trimmed, fontSize),
            }),
          );
        } else {
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              children: parseBoldText(trimmed, fontSize),
            }),
          );
        }
      }
    });

    // About author
    if (about_author) {
      children.push(
        new Paragraph({ pageBreakBefore: true, children: [] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: "লেখক পরিচিতি", bold: true, size: headingSize, font: "Arial" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: about_author, size: fontSize, font: "Arial" })],
        }),
      );
    }

    const footerText = design_settings.footer_style === "minimal"
      ? ""
      : `${author} | ${title} | ${website}`;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1080, right: 1080 },
            pageNumbers: { start: 1 },
          },
        },
        headers: design_settings.header_style !== "none" ? {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: title, size: 16, font: "Arial", color: "999999", italics: true })],
            })],
          }),
        } : undefined,
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                ...(footerText ? [new TextRun({ text: `${footerText}  —  `, size: 16, font: "Arial", color: "999999" })] : []),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "999999" }),
              ],
            })],
          }),
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);
    const filename = `${title.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, "_")}.docx`;

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("DOCX export error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
