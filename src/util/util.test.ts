import { describe, expect, it } from 'vitest';
import { ACCOUNTS, testData } from '../test-data/testDataGenerator';
import {
	calculateChecksums,
	calculateLetterChecksumsAF,
	createDeterministicRandom,
	generateOcrLetterTestDataAF,
	generateOcrTestDataWithIllegibleNumbers,
	parseBankAccountsFromTestData,
	parseOcrLetterEntriesAF,
	repairOcrAccounts,
	repairOcrLetterEntriesAF,
} from './util';

describe('parseBankAccountsFromTestData', () => {
	it('decodes OCR entries into bank account numbers', () => {
		const parsed = parseBankAccountsFromTestData(testData);
		expect(parsed).toBe(ACCOUNTS.join('\n'));
	});

	it('throws for non-blank separator lines', () => {
		const lines = testData.split('\n');
		lines[3] = '_'.repeat(27);

		expect(() => parseBankAccountsFromTestData(lines.join('\n'))).toThrow(
			'The 4th line in each OCR entry must be blank.',
		);
	});
});

describe('calculateChecksums', () => {
	it('transforms parsed data into account number and validity output', () => {
		const parsed = ['123456789', '111111111', '000000000'];

		expect(calculateChecksums(parsed)).toEqual([
			{ accountNumber: '123456789', isValid: true },
			{ accountNumber: '111111111', isValid: false },
			{ accountNumber: '000000000', isValid: true },
		]);
	});

	it('accepts newline-delimited parsed data', () => {
		const result = calculateChecksums('123456789\n111111111\n');

		expect(result).toEqual([
			{ accountNumber: '123456789', isValid: true },
			{ accountNumber: '111111111', isValid: false },
		]);
	});

	it('throws for invalid account number formats', () => {
		expect(() => calculateChecksums(['12345A789'])).toThrow('Invalid account number format: 12345A789');
	});
});

describe('generateOcrTestDataWithIllegibleNumbers', () => {
	it('can generate the same clean OCR output when illegible chance is 0', () => {
		const generated = generateOcrTestDataWithIllegibleNumbers(ACCOUNTS, {
			illegibleChance: 0,
			random: () => 0,
		});

		expect(generated).toBe(testData);
	});

	it('represents illegible OCR digits as ? in parsed output', () => {
		const generated = generateOcrTestDataWithIllegibleNumbers(['000000000'], {
			illegibleChance: 1,
			random: () => 0,
		});
		const parsed = parseBankAccountsFromTestData(generated);

		expect(parsed).toBe('?00000000');
	});

	it('keeps OCR entry dimensions valid even when digits become illegible', () => {
		const generated = generateOcrTestDataWithIllegibleNumbers(['123456789', '987654321'], {
			illegibleChance: 1,
			random: () => 0,
		});
		const lines = generated.split('\n');

		expect(lines).toHaveLength(8);
		for (const line of lines) {
			expect(line).toHaveLength(27);
		}
	});

	it('can force at least one unrepairable OCR entry', () => {
		const generated = generateOcrTestDataWithIllegibleNumbers(['123456789'], {
			illegibleChance: 0,
			forceIllAtLeast: 1,
			random: () => 0,
		});
		const repaired = repairOcrAccounts(generated);

		expect(repaired[0].status).toBe('ILL');
	});
});

describe('repairOcrAccounts', () => {
	it('returns one repaired result per clean OCR account and keeps them legible', () => {
		const repaired = repairOcrAccounts(testData);

		expect(repaired).toHaveLength(ACCOUNTS.length);
		expect(repaired.every((entry) => /^\d{9}$/.test(entry.accountNumber))).toBe(true);
		expect(repaired.every((entry) => ['OK', 'AMB', 'ILL'].includes(entry.status))).toBe(true);
	});

	it('returns only supported statuses for noisy OCR data', () => {
		const noisyData = generateOcrTestDataWithIllegibleNumbers(ACCOUNTS, {
			illegibleChance: 0.5,
			forceIllAtLeast: 1,
			random: createDeterministicRandom(0x5a17d3e4),
		});
		const repaired = repairOcrAccounts(noisyData);

		expect(repaired).toHaveLength(ACCOUNTS.length);
		expect(repaired.every((entry) => ['OK', 'AMB', 'ILL'].includes(entry.status))).toBe(true);
		expect(repaired.some((entry) => entry.status === 'ILL')).toBe(true);
	});
});

describe('generateOcrLetterTestDataAF', () => {
	it('creates OCR entries with expected line dimensions', () => {
		const generated = generateOcrLetterTestDataAF(['ABCDEFABC', 'FEDCBAFED']);
		const lines = generated.split('\n');

		expect(lines).toHaveLength(8);
		for (const line of lines) {
			expect(line).toHaveLength(27);
		}
	});

	it('throws for invalid letter entries', () => {
		expect(() => generateOcrLetterTestDataAF(['ABCDXFAAA'])).toThrow('Invalid entry format: ABCDXFAAA');
	});

	it('parses generated A-F OCR entries back to original values', () => {
		const source = ['ABCDEFABC', 'FEDCBAFED'];
		const generated = generateOcrLetterTestDataAF(source);

		expect(parseOcrLetterEntriesAF(generated)).toBe(source.join('\n'));
	});

	it('repairs noisy A-F OCR entries with supported statuses', () => {
		const source = ['ABCDEFABC', 'FEDCBAFED'];
		const generated = generateOcrLetterTestDataAF(source, {
			illegibleChance: 0.4,
			forceIllAtLeast: 1,
			random: createDeterministicRandom(0x12345678),
		});
		const repaired = repairOcrLetterEntriesAF(generated);

		expect(repaired).toHaveLength(source.length);
		expect(repaired.every((entry) => ['OK', 'AMB', 'ILL'].includes(entry.status))).toBe(true);
	});
});

describe('calculateLetterChecksumsAF', () => {
	it('validates A-F entries against checksum rule', () => {
		const results = calculateLetterChecksumsAF(['AAAAAAADE', 'ABCDEFABC']);

		expect(results).toEqual([
			{ accountNumber: 'AAAAAAADE', isValid: true },
			{ accountNumber: 'ABCDEFABC', isValid: false },
		]);
	});

	it('throws for invalid A-F entries', () => {
		expect(() => calculateLetterChecksumsAF(['ABC?EFABC'])).toThrow('Invalid letter entry format: ABC?EFABC');
	});
});
