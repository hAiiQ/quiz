import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadMarkdownRelative(relativePath: string) {
  const filePath = path.join(process.cwd(), relativePath);
  try {
    const content = await readFile(filePath, "utf8");
    return content;
  } catch (error) {
    console.error(`Markdown-Datei konnte nicht geladen werden: ${filePath}`, error);
    throw new Error("Markdown-Datei fehlt oder ist nicht lesbar");
  }
}
