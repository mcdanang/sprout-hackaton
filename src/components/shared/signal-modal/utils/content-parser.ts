// Extracts the encoded content string (with @[Name](id) syntax) from the editor DOM
export function extractContent(editor: HTMLDivElement): string {
  let result = "";
  for (const node of Array.from(editor.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? "";
    } else if (node instanceof HTMLElement) {
      if (node.dataset.mention === "true") {
        result += `@[${node.dataset.name}](${node.dataset.id})`;
      } else if (node.tagName === "BR") {
        result += "\n";
      } else {
        // Inline wrapper or unknown element — just grab text
        result += node.textContent ?? "";
      }
    }
  }
  return result;
}
