export const DIGIT_GLYPHS: Record<string, [string, string, string]> = {
	'0': [' _ ',
		  '| |',
		  '|_|'],
	'1': ['   ',
		  '  |',
		  '  |'],
	'2': [' _ ',
		  ' _|',
		  '|_ '],
	'3': [' _ ',
		  ' _|',
		  ' _|'],
	'4': ['   ',
		  '|_|',
		  '  |'],
	'5': [' _ ',
		  '|_ ',
		  ' _|'],
	'6': [' _ ',
		  '|_ ',
		  '|_|'],
	'7': [' _ ',
		  '  |',
		  '  |'],
	'8': [' _ ',
		  '|_|',
		  '|_|'],
	'9': [' _ ',
		  '|_|',
		  ' _|'],
};

export const LETTER_GLYPHS_AF: Record<string, [string, string, string]> = {
	A: [' _ ',
		'|_|',
		'| |'],
	B: [' _ ',
		'|_\\',
		'|_/'],
	C: [' _ ',
		'|  ',
		'|_ '],
	D: [' _ ',
		'| \\',
		'|_/'],
	E: [' _ ',
		'|_ ',
		'|_ '],
	F: [' _ ',
		'|_ ',
		'|  '],
};

export type OcrGlyphs = Record<string, [string, string, string]>;

export type GenerateOcrOptions = {
	illegibleChance?: number;
	random?: () => number;
	forceIllAtLeast?: number;
};

export const ACCOUNT_COUNT = 125;

const RANDOM_SEED = 0x1f2e3d4c;
const MAX_9_DIGIT = 1_000_000_000;
const ENTRY_WIDTH = 27;
const DIGIT_WIDTH = 3;
const DIGITS_PER_ENTRY = 9;
const BLANK_SEPARATOR_LINE = ' '.repeat(ENTRY_WIDTH);

export const createDeterministicRandom = (seed: number): (() => number) => {
	let state = seed >>> 0;

	return () => {
		state = (1664525 * state + 1013904223) >>> 0;
		return state / 0x100000000;
	};
};

const createRandomizedAccounts = (count: number, seed: number): string[] => {
	const nextRandom = createDeterministicRandom(seed);
	const uniqueAccounts = new Set<string>();

	while (uniqueAccounts.size < count) {
		const value = Math.floor(nextRandom() * MAX_9_DIGIT);
		uniqueAccounts.add(String(value).padStart(9, '0'));
	}

	return Array.from(uniqueAccounts);
};

export const ACCOUNTS = createRandomizedAccounts(ACCOUNT_COUNT, RANDOM_SEED);

const renderAccountEntry = (accountNumber: string): string => {
	const rows = ['', '', ''];

	for (const digit of accountNumber) {
		const glyph = DIGIT_GLYPHS[digit];
		rows[0] += glyph[0];
		rows[1] += glyph[1];
		rows[2] += glyph[2];
	}

	return `${rows[0]}\n${rows[1]}\n${rows[2]}\n${BLANK_SEPARATOR_LINE}`;
};

export const testData = ACCOUNTS.map(renderAccountEntry).join('\n');

const replaceCharAt = (value: string, index: number, nextChar: string): string =>
	`${value.slice(0, index)}${nextChar}${value.slice(index + 1)}`;

const makeGlyphIllegible = (glyph: [string, string, string], random: () => number): [string, string, string] => {
	const mutablePositions: Array<{ row: number; column: number }> = [];

	for (let row = 0; row < glyph.length; row += 1) {
		for (let column = 0; column < glyph[row].length; column += 1) {
			if (glyph[row][column] !== ' ') {
				mutablePositions.push({ row, column });
			}
		}
	}

	if (mutablePositions.length === 0) {
		return glyph;
	}

	const selected = mutablePositions[Math.floor(random() * mutablePositions.length)];
	const mutatedRows = [...glyph] as [string, string, string];
	mutatedRows[selected.row] = replaceCharAt(mutatedRows[selected.row], selected.column, ' ');

	return mutatedRows;
};

const renderOcrEntry = (value: string, glyphs: OcrGlyphs, illegibleChance: number, random: () => number): string => {
	const rows: [string, string, string] = ['', '', ''];
	const illegibleDigitIndex = random() < illegibleChance ? Math.floor(random() * DIGITS_PER_ENTRY) : -1;

	for (let index = 0; index < value.length; index += 1) {
		const char = value[index];
		const baseGlyph = glyphs[char];
		const glyph = index === illegibleDigitIndex ? makeGlyphIllegible(baseGlyph, random) : baseGlyph;

		rows[0] += glyph[0];
		rows[1] += glyph[1];
		rows[2] += glyph[2];
	}

	return `${rows[0]}\n${rows[1]}\n${rows[2]}\n${BLANK_SEPARATOR_LINE}`;
};

const validateEntriesForGlyphSet = (entries: string[], glyphs: OcrGlyphs): void => {
	const validChars = new Set(Object.keys(glyphs));

	for (const entry of entries) {
		if (entry.length !== DIGITS_PER_ENTRY) {
			throw new Error(`Invalid entry format: ${entry}`);
		}

		for (const char of entry) {
			if (!validChars.has(char)) {
				throw new Error(`Invalid entry format: ${entry}`);
			}
		}
	}
};

const forceEntryToContainUnrepairableGlyph = (entry: string, random: () => number): string => {
	const lines = entry.split('\n');
	const targetDigitIndex = Math.floor(random() * DIGITS_PER_ENTRY);
	const start = targetDigitIndex * DIGIT_WIDTH;

	const makeBlankDigitSlice = (row: string): string => `${row.slice(0, start)}   ${row.slice(start + DIGIT_WIDTH)}`;

	lines[0] = makeBlankDigitSlice(lines[0]);
	lines[1] = makeBlankDigitSlice(lines[1]);
	lines[2] = makeBlankDigitSlice(lines[2]);

	return lines.join('\n');
};

export const generateOcrTestDataWithIllegibleEntries = (
	entries: string[],
	glyphs: OcrGlyphs,
	options: GenerateOcrOptions = {},
): string => {
	const illegibleChance = options.illegibleChance ?? 0.2;
	const random = options.random ?? Math.random;
	const forceIllAtLeast = options.forceIllAtLeast ?? 0;

	if (!Number.isFinite(illegibleChance) || illegibleChance < 0 || illegibleChance > 1) {
		throw new Error('illegibleChance must be between 0 and 1.');
	}

	if (!Number.isInteger(forceIllAtLeast) || forceIllAtLeast < 0) {
		throw new Error('forceIllAtLeast must be a non-negative integer.');
	}

	validateEntriesForGlyphSet(entries, glyphs);

	const ocrEntries = entries.map((entry) => renderOcrEntry(entry, glyphs, illegibleChance, random));

	for (let i = 0; i < Math.min(forceIllAtLeast, ocrEntries.length); i += 1) {
		ocrEntries[i] = forceEntryToContainUnrepairableGlyph(ocrEntries[i], random);
	}

	return ocrEntries.join('\n');
};

export const generateOcrTestDataWithIllegibleNumbers = (
	accountNumbers: string[],
	options: GenerateOcrOptions = {},
): string => generateOcrTestDataWithIllegibleEntries(accountNumbers, DIGIT_GLYPHS, options);

export const generateOcrLetterTestDataAF = (entries: string[], options: GenerateOcrOptions = {}): string =>
	generateOcrTestDataWithIllegibleEntries(entries, LETTER_GLYPHS_AF, {
		illegibleChance: options.illegibleChance ?? 0,
		random: options.random,
		forceIllAtLeast: options.forceIllAtLeast ?? 0,
	});
