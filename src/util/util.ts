import { DIGIT_GLYPHS, LETTER_GLYPHS_AF, type OcrGlyphs } from '../test-data/testDataGenerator';
export {
	createDeterministicRandom,
	generateOcrLetterTestDataAF,
	generateOcrTestDataWithIllegibleEntries,
	generateOcrTestDataWithIllegibleNumbers,
} from '../test-data/testDataGenerator';

const ENTRY_LINE_COUNT = 4;
const ENTRY_WIDTH = 27;
const DIGIT_WIDTH = 3;
const DIGITS_PER_ENTRY = 9;

// Used by user stories: US1, US2, US3, US4, US5 (via parse/repair flows).
const buildGlyphLookup = (glyphs: OcrGlyphs): Map<string, string> => {
	const lookup = new Map<string, string>();

	for (const [digit, [row1, row2, row3]] of Object.entries(glyphs)) {
		lookup.set(`${row1}${row2}${row3}`, digit);
	}

	return lookup;
};

// Used by user stories: US1, US2, US3, US4, US5 (via parse/repair flows).
const parseEntry = (rows: [string, string, string], glyphLookup: Map<string, string>): string => {
	let account = '';

	for (let i = 0; i < DIGITS_PER_ENTRY; i += 1) {
		const start = i * DIGIT_WIDTH;
		const key = `${rows[0].slice(start, start + DIGIT_WIDTH)}${rows[1].slice(start, start + DIGIT_WIDTH)}${rows[2].slice(start, start + DIGIT_WIDTH)}`;
		const digit = glyphLookup.get(key);
		account += digit ?? '?';
	}

	return account;
};

export type AccountValidationResult = {
	accountNumber: string;
	isValid: boolean;
};

export type AccountRepairStatus = 'OK' | 'AMB' | 'ILL';

export type AccountRepairResult = {
	accountNumber: string;
	status: AccountRepairStatus;
};

const LETTER_VALUE_AF: Record<string, number> = {
	A: 1,
	B: 2,
	C: 3,
	D: 4,
	E: 5,
	F: 6,
};

// Used by user stories: US2, US3, US4 (checksum validation for numeric accounts).
const isChecksumValid = (accountNumber: string): boolean => {
	const digits = accountNumber.split('').map(Number);

	const checksum = digits.reduce((sum, digit, index) => {
		const weight = DIGITS_PER_ENTRY - index;
		return sum + digit * weight;
	}, 0);

	return checksum % 11 === 0;
};

// Used by user stories: US5 (checksum validation for A-F repair flow).
const isLetterChecksumValidAF = (value: string): boolean => {
	const checksum = value.split('').reduce((sum, letter, index) => {
		const weight = DIGITS_PER_ENTRY - index;
		return sum + LETTER_VALUE_AF[letter] * weight;
	}, 0);

	return checksum % 11 === 0;
};

// Used by user stories: US2, US3 (normalizes checksum input for numeric validation).
const normalizeParsedAccountsInput = (input: string | string[]): string[] => {
	if (Array.isArray(input)) {
		return input;
	}

	return input
		.split('\n')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
};

// Used by user stories: US4, US5 (repair candidate comparison).
const glyphDifferenceCount = (left: [string, string, string], right: [string, string, string]): number => {
	let differenceCount = 0;

	for (let row = 0; row < 3; row += 1) {
		for (let column = 0; column < 3; column += 1) {
			if (left[row][column] !== right[row][column]) {
				differenceCount += 1;
			}
		}
	}

	return differenceCount;
};

// Used by user stories: US4, US5 (splits OCR rows into per-character glyph blocks).
const extractDigitGlyphs = (rows: [string, string, string]): Array<[string, string, string]> => {
	const glyphs: Array<[string, string, string]> = [];

	for (let i = 0; i < DIGITS_PER_ENTRY; i += 1) {
		const start = i * DIGIT_WIDTH;
		glyphs.push([
			rows[0].slice(start, start + DIGIT_WIDTH),
			rows[1].slice(start, start + DIGIT_WIDTH),
			rows[2].slice(start, start + DIGIT_WIDTH),
		]);
	}

	return glyphs;
};

// Used by user stories: US4, US5 (collects candidate replacements for repair).
const collectRepairCandidates = (
	glyph: [string, string, string],
	glyphs: OcrGlyphs,
	maxDifferences: number,
): string[] => {
	const candidates: string[] = [];

	for (const [digit, candidateGlyph] of Object.entries(glyphs)) {
		if (glyphDifferenceCount(glyph, candidateGlyph) <= maxDifferences) {
			candidates.push(digit);
		}
	}

	return candidates;
};

// Used by user stories: US4, US5 (searches valid repaired values from candidates).
const findValidRepairs = (
	candidateDigitsByPosition: string[][],
	isValidCandidate: (value: string) => boolean,
): string[] => {
	const results: string[] = [];

	const walk = (index: number, current: string): void => {
		if (results.length > 1) {
			return;
		}

		if (index === DIGITS_PER_ENTRY) {
			if (isValidCandidate(current)) {
				results.push(current);
			}

			return;
		}

		for (const digit of candidateDigitsByPosition[index]) {
			walk(index + 1, `${current}${digit}`);
		}
	};

	walk(0, '');

	return results;
};

// Used by user stories: US1, US2, US3 (directly via parseBankAccountsFromTestData);
// also supports parseOcrLetterEntriesAF (currently not used directly by a UI story).
export const parseOcrEntries = (input: string, glyphs: OcrGlyphs): string => {
	const lines = input.split('\n');

	if (lines.length % ENTRY_LINE_COUNT !== 0) {
		throw new Error('Input must contain complete 4-line OCR entries.');
	}

	const glyphLookup = buildGlyphLookup(glyphs);
	const parsedEntries: string[] = [];

	for (let i = 0; i < lines.length; i += ENTRY_LINE_COUNT) {
		const row1 = lines[i];
		const row2 = lines[i + 1];
		const row3 = lines[i + 2];
		const row4 = lines[i + 3];

		if (
			row1.length !== ENTRY_WIDTH ||
			row2.length !== ENTRY_WIDTH ||
			row3.length !== ENTRY_WIDTH ||
			row4.length !== ENTRY_WIDTH
		) {
			throw new Error('Each OCR row must be exactly 27 characters long.');
		}

		if (row4.trim().length !== 0) {
			throw new Error('The 4th line in each OCR entry must be blank.');
		}

		parsedEntries.push(parseEntry([row1, row2, row3], glyphLookup));
	}

	return parsedEntries.join('\n');
};

// Used by user stories: US1, US2, US3.
export const parseBankAccountsFromTestData = (input: string): string => {
	return parseOcrEntries(input, DIGIT_GLYPHS);
};

// Used by user stories: none directly (test/helper API).
export const parseOcrLetterEntriesAF = (input: string): string => parseOcrEntries(input, LETTER_GLYPHS_AF);

// Used by user stories: US2, US3.
export const calculateChecksums = (input: string | string[]): AccountValidationResult[] => {
	const accounts = normalizeParsedAccountsInput(input);

	return accounts.map((accountNumber) => {
		if (!/^\d{9}$/.test(accountNumber)) {
			throw new Error(`Invalid account number format: ${accountNumber}`);
		}

		return {
			accountNumber,
			isValid: isChecksumValid(accountNumber),
		};
	});
};

// Used by user stories: none directly (test/helper API).
export const calculateLetterChecksumsAF = (input: string | string[]): AccountValidationResult[] => {
	const entries = normalizeParsedAccountsInput(input);

	return entries.map((entry) => {
		if (!/^[A-F]{9}$/.test(entry)) {
			throw new Error(`Invalid letter entry format: ${entry}`);
		}

		return {
			accountNumber: entry,
			isValid: isLetterChecksumValidAF(entry),
		};
	});
};

// Used by user stories: US4.
export const repairOcrAccounts = (input: string): AccountRepairResult[] => {
	return repairOcrEntries(input, DIGIT_GLYPHS, isChecksumValid);
};

// Used by user stories: US4, US5 (shared repair engine).
export const repairOcrEntries = (
	input: string,
	glyphs: OcrGlyphs,
	isValidCandidate: (value: string) => boolean = () => true,
): AccountRepairResult[] => {
	const lines = input.split('\n');

	if (lines.length % ENTRY_LINE_COUNT !== 0) {
		throw new Error('Input must contain complete 4-line OCR entries.');
	}

	const glyphLookup = buildGlyphLookup(glyphs);
	const repairedResults: AccountRepairResult[] = [];

	for (let i = 0; i < lines.length; i += ENTRY_LINE_COUNT) {
		const row1 = lines[i];
		const row2 = lines[i + 1];
		const row3 = lines[i + 2];
		const row4 = lines[i + 3];

		if (
			row1.length !== ENTRY_WIDTH ||
			row2.length !== ENTRY_WIDTH ||
			row3.length !== ENTRY_WIDTH ||
			row4.length !== ENTRY_WIDTH
		) {
			throw new Error('Each OCR row must be exactly 27 characters long.');
		}

		if (row4.trim().length !== 0) {
			throw new Error('The 4th line in each OCR entry must be blank.');
		}

		const entryRows: [string, string, string] = [row1, row2, row3];
		const parsedAccount = parseEntry(entryRows, glyphLookup);

		if (!parsedAccount.includes('?') && isValidCandidate(parsedAccount)) {
			repairedResults.push({ accountNumber: parsedAccount, status: 'OK' });
			continue;
		}

		const digitGlyphs = extractDigitGlyphs(entryRows);
		const candidateDigitsByPosition = digitGlyphs.map((glyph) => collectRepairCandidates(glyph, glyphs, 1));

		if (candidateDigitsByPosition.some((candidates) => candidates.length === 0)) {
			repairedResults.push({ accountNumber: parsedAccount, status: 'ILL' });
			continue;
		}

		const repairOptions = findValidRepairs(candidateDigitsByPosition, isValidCandidate);

		if (repairOptions.length === 1) {
			repairedResults.push({ accountNumber: repairOptions[0], status: 'OK' });
			continue;
		}

		if (repairOptions.length > 1) {
			repairedResults.push({ accountNumber: parsedAccount, status: 'AMB' });
			continue;
		}

		repairedResults.push({ accountNumber: parsedAccount, status: 'ILL' });
	}

	return repairedResults;
};

// Used by user stories: US5.
export const repairOcrLetterEntriesAF = (input: string): AccountRepairResult[] =>
	repairOcrEntries(input, LETTER_GLYPHS_AF, isLetterChecksumValidAF);
