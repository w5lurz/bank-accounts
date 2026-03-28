import { describe, expect, it } from 'vitest';
import { ACCOUNT_COUNT, testData } from './testDataGenerator';

describe('testData OCR bank account format', () => {
	it('contains 125 entries of 4 lines each', () => {
		const lines = testData.split('\n');
		expect(lines).toHaveLength(ACCOUNT_COUNT * 4);
	});

	it('uses exactly 27 characters per line', () => {
		const lines = testData.split('\n');

		for (const line of lines) {
			expect(line).toHaveLength(27);
		}
	});

	it('uses only OCR characters in data rows and blank separator rows', () => {
		const lines = testData.split('\n');

		for (let i = 0; i < lines.length; i += 4) {
			const row1 = lines[i];
			const row2 = lines[i + 1];
			const row3 = lines[i + 2];
			const row4 = lines[i + 3];

			expect(row1).toMatch(/^[ _|]{27}$/);
			expect(row2).toMatch(/^[ _|]{27}$/);
			expect(row3).toMatch(/^[ _|]{27}$/);
			expect(row4).toMatch(/^\s{27}$/);
		}
	});

	it('represents 9 OCR digits per entry', () => {
		const lines = testData.split('\n');

		for (let i = 0; i < lines.length; i += 4) {
			const row1 = lines[i];
			const row2 = lines[i + 1];
			const row3 = lines[i + 2];

			for (let digitIndex = 0; digitIndex < 9; digitIndex++) {
				const offset = digitIndex * 3;
				const glyphTop = row1.slice(offset, offset + 3);
				const glyphMid = row2.slice(offset, offset + 3);
				const glyphBot = row3.slice(offset, offset + 3);

				expect(glyphTop).toHaveLength(3);
				expect(glyphMid).toHaveLength(3);
				expect(glyphBot).toHaveLength(3);
				expect(`${glyphTop}${glyphMid}${glyphBot}`).toMatch(/^[ _|]{9}$/);
			}
		}
	});
});
