export async function copyToClipboard(text) {
  if (!text) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;

    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    document.execCommand("copy");

    textarea.remove();

    return true;
  } catch (err) {
    console.error("Clipboard Error:", err);
    return false;
  }
}