import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// PDF generation on Vercel serverless is limited.
// We return the ebook data as structured HTML that the client can print to PDF.
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
      book_description = "",
      about_author = "",
    } = body;

    const font = design_settings.font || "Hind Siliguri";

    // Build full HTML for print-to-PDF
    const chapterList = chapters as { title: string; content: string }[];

    let chaptersHtml = "";
    chapterList.forEach((ch, i) => {
      // Convert markdown to HTML
      let html = (ch.content || "")
        .replace(/^### (.*$)/gm, "<h3>$1</h3>")
        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/^- (.*$)/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br/>");

      chaptersHtml += `
        <div style="page-break-before: always;">
          <h1 style="color: #1a56db; border-bottom: 3px solid #1a56db; padding-bottom: 10px;">
            অধ্যায় ${i + 1}: ${ch.title}
          </h1>
          <div class="chapter-content"><p>${html}</p></div>
        </div>`;
    });

    // TOC
    let tocHtml = '<div style="page-break-before: always;"><h1 style="text-align:center; color:#1a56db;">সূচিপত্র</h1><div style="margin-top:20px;">';
    chapterList.forEach((ch, i) => {
      tocHtml += `<p style="font-size:16px; margin:8px 0; padding:5px 0; border-bottom:1px dotted #ddd;">${i + 1}. ${ch.title}</p>`;
    });
    tocHtml += "</div></div>";

    const fullHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { margin: 0.75in; size: A4; }
  body { font-family: '${font}', sans-serif; font-size: 14px; line-height: 1.8; color: #333; }
  h1 { font-size: 24px; margin-top: 30px; }
  h2 { font-size: 20px; color: #1a56db; margin-top: 25px; }
  h3 { font-size: 17px; color: #444; margin-top: 20px; }
  blockquote { border-left: 4px solid #1a56db; margin: 15px 0; padding: 10px 20px; background: #f8f9ff; font-style: italic; color: #555; }
  ul { padding-left: 25px; }
  li { margin: 5px 0; }
  .title-page { text-align: center; padding-top: 200px; page-break-after: always; }
  .title-page h1 { font-size: 42px; color: #1a56db; border: none; }
  .title-page .subtitle { font-size: 22px; color: #666; margin-top: 10px; }
  .title-page .author { font-size: 20px; margin-top: 60px; }
  .title-page .press { font-size: 16px; color: #888; margin-top: 10px; }
  .title-page .website { font-size: 14px; color: #1a56db; margin-top: 5px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="title-page">
  <h1>${title}</h1>
  ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}
  <p class="author">${author}</p>
  <p class="press">${press}</p>
  <p class="website">${website}</p>
</div>
${tocHtml}
${chaptersHtml}
${about_author ? `<div style="page-break-before:always;text-align:center;padding-top:100px;"><h1 style="color:#1a56db;">লেখক পরিচিতি</h1><p style="font-size:16px;margin-top:20px;">${about_author}</p></div>` : ""}
</body>
</html>`;

    return new NextResponse(JSON.stringify({
      success: true,
      html: fullHtml,
      filename: `${title.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, "_")}.pdf`,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
