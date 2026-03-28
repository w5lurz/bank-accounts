import { useMemo, useState } from 'react';
import { ACCOUNTS } from '../test-data/testDataGenerator';
import {
	createDeterministicRandom,
	generateOcrLetterTestDataAF,
	repairOcrLetterEntriesAF,
} from '../util/util-user-story-5';

type SortDirection = 'none' | 'asc' | 'desc';
type RepairStatus = 'OK' | 'AMB' | 'ILL';

const STATUS_ORDER: Record<RepairStatus, number> = {
	ILL: 0,
	AMB: 1,
	OK: 2,
};

const LETTERS_AF = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

const toLetterEntry = (accountNumber: string): string =>
	accountNumber
		.split('')
		.map((digit) => LETTERS_AF[Number(digit) % LETTERS_AF.length])
		.join('');

export default function UserStory5() {
	const [sortDirection, setSortDirection] = useState<SortDirection>('none');

	const rows = useMemo(() => {
		const letterEntries = ACCOUNTS.map(toLetterEntry);
		const random = createDeterministicRandom(0x72a9c5d1);
		const ocrWithIllegible = generateOcrLetterTestDataAF(letterEntries, {
			illegibleChance: 0.5,
			forceIllAtLeast: 3,
			random,
		});

		return repairOcrLetterEntriesAF(ocrWithIllegible);
	}, []);

	const sortedRows = useMemo(() => {
		if (sortDirection === 'none') {
			return rows;
		}

		const directionFactor = sortDirection === 'asc' ? 1 : -1;

		return [...rows].sort((left, right) => {
			const statusDiff = STATUS_ORDER[left.status as RepairStatus] - STATUS_ORDER[right.status as RepairStatus];

			if (statusDiff !== 0) {
				return statusDiff * directionFactor;
			}

			return left.accountNumber.localeCompare(right.accountNumber);
		});
	}, [rows, sortDirection]);

	const toggleSortDirection = () => {
		setSortDirection((current) => {
			if (current === 'none') {
				return 'asc';
			}

			if (current === 'asc') {
				return 'desc';
			}

			return 'none';
		});
	};

	return (
		<section className="accounts-card" aria-labelledby="accounts-title-us5">
			<h1 id="accounts-title-us5">Letter Repair Table</h1>
			<p className="accounts-subtitle">A-F OCR repair attempts using segment changes and checksum validation</p>
			<div className="accounts-table-wrapper">
				<table className="accounts-table" aria-label="Letter account repair status table">
					<thead>
						<tr>
							<th scope="col">Account</th>
							<th
								scope="col"
								aria-sort={
									sortDirection === 'none'
										? 'none'
										: sortDirection === 'asc'
											? 'ascending'
											: 'descending'
								}
							>
								<button type="button" className="table-sort-button" onClick={toggleSortDirection}>
									Status{' '}
									<span aria-hidden="true">
										{sortDirection === 'none' ? '↕' : sortDirection === 'asc' ? '↑' : '↓'}
									</span>
								</button>
							</th>
						</tr>
					</thead>
					<tbody>
						{sortedRows.map(({ accountNumber, status }, index) => (
							<tr key={`${accountNumber}-${index}`}>
								<td className="account-number">{accountNumber}</td>
								<td>
									<span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
