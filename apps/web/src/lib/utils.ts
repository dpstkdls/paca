import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Copy text to the clipboard, resolving to true on success and false if every
 *  method failed. Falls back to a hidden-textarea `execCommand("copy")` when
 *  `navigator.clipboard` is unavailable — it only exists in secure contexts, so
 *  without the fallback the copy button silently does nothing when the app is
 *  served over plain HTTP (e.g. a LAN IP). */
export async function copyToClipboard(text: string): Promise<boolean> {
	if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fall through to the execCommand fallback below.
		}
	}
	if (typeof document === "undefined") return false;
	try {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.setAttribute("readonly", "");
		textarea.style.position = "fixed";
		textarea.style.top = "-9999px";
		textarea.style.opacity = "0";
		textarea.style.pointerEvents = "none";
		document.body.appendChild(textarea);
		textarea.select();
		const ok = document.execCommand("copy");
		document.body.removeChild(textarea);
		return ok;
	} catch {
		return false;
	}
}

/** Up to two uppercase initials from a display name, for avatar fallbacks
 *  (e.g. "Ada Lovelace" -> "AL", "Madonna" -> "M"). */
export function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function cleanBlocks(
	blocks: unknown[] | null | undefined,
): unknown[] | null {
	if (!blocks || !Array.isArray(blocks)) return null;
	const strip = (arr: unknown[]): unknown[] => {
		return arr.map((item) => {
			if (!item || typeof item !== "object") return item;
			const { id, children, ...rest } = item as Record<string, unknown>;
			const res: Record<string, unknown> = { ...rest };
			if (Array.isArray(children)) {
				res.children = strip(children as unknown[]);
			}
			return res;
		});
	};
	return strip(blocks);
}
