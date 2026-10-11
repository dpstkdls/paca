import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanBlocks, cn, copyToClipboard, getInitials } from "./utils";

describe("cn", () => {
	it("joins class names and ignores falsy values", () => {
		const value = cn("px-4", undefined, null, false, "py-2");
		expect(value).toBe("px-4 py-2");
	});

	it("merges conflicting Tailwind classes", () => {
		const value = cn("px-2", "px-4", "text-sm", "text-lg");
		expect(value).toBe("px-4 text-lg");
	});
});

describe("cleanBlocks", () => {
	it("returns null when blocks is null", () => {
		expect(cleanBlocks(null)).toBeNull();
	});

	it("returns null when blocks is not an array (e.g. a plain string)", () => {
		expect(
			cleanBlocks("just a plain string" as unknown as unknown[]),
		).toBeNull();
	});

	it("strips id field recursively and preserves other properties", () => {
		const input = [
			{
				id: "block-1",
				type: "paragraph",
				content: [{ text: "Hello" }],
				children: [
					{
						id: "block-1-sub1",
						type: "bullet",
						content: [],
					},
				],
			},
			{
				id: "block-2",
				type: "heading",
				content: [{ text: "Title" }],
			},
		];

		const expected = [
			{
				type: "paragraph",
				content: [{ text: "Hello" }],
				children: [
					{
						type: "bullet",
						content: [],
					},
				],
			},
			{
				type: "heading",
				content: [{ text: "Title" }],
			},
		];

		expect(cleanBlocks(input)).toEqual(expected);
	});
});

describe("getInitials", () => {
	it("takes the first letter of the first two words", () => {
		expect(getInitials("Ada Lovelace")).toBe("AL");
	});

	it("uses a single letter for a one-word name", () => {
		expect(getInitials("Madonna")).toBe("M");
	});

	it("caps at two letters for names with more than two words", () => {
		expect(getInitials("Ada Marie Lovelace")).toBe("AM");
	});

	it("ignores repeated spaces", () => {
		expect(getInitials("Ada  Lovelace")).toBe("AL");
	});

	it("uppercases lowercase input", () => {
		expect(getInitials("ada lovelace")).toBe("AL");
	});
});

describe("copyToClipboard", () => {
	// jsdom doesn't implement document.execCommand, so assign it directly and
	// restore afterwards rather than spying on a non-existent method.
	const originalExecCommand = (document as unknown as { execCommand?: unknown })
		.execCommand;

	const stubExecCommand = (result: boolean) => {
		const fn = vi.fn().mockReturnValue(result);
		(document as unknown as { execCommand: unknown }).execCommand = fn;
		return fn;
	};

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		(document as unknown as { execCommand: unknown }).execCommand =
			originalExecCommand;
	});

	it("uses navigator.clipboard when available", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal("navigator", { clipboard: { writeText } });

		await expect(copyToClipboard("hello")).resolves.toBe(true);
		expect(writeText).toHaveBeenCalledWith("hello");
	});

	it("falls back to execCommand when clipboard write rejects (insecure context)", async () => {
		const writeText = vi.fn().mockRejectedValue(new Error("insecure"));
		vi.stubGlobal("navigator", { clipboard: { writeText } });
		const execCommand = stubExecCommand(true);

		await expect(copyToClipboard("hello")).resolves.toBe(true);
		expect(execCommand).toHaveBeenCalledWith("copy");
	});

	it("falls back to execCommand when navigator.clipboard is absent", async () => {
		vi.stubGlobal("navigator", {});
		const execCommand = stubExecCommand(true);

		await expect(copyToClipboard("hello")).resolves.toBe(true);
		expect(execCommand).toHaveBeenCalledWith("copy");
	});

	it("returns false when every method fails", async () => {
		vi.stubGlobal("navigator", {});
		stubExecCommand(false);

		await expect(copyToClipboard("hello")).resolves.toBe(false);
	});
});
