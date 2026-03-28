import { useMemo, useState } from 'react';
import { ACCOUNTS } from '../test-data/testDataGenerator';
import {
	createDeterministicRandom,
	generateOcrTestDataWithIllegibleNumbers,
	repairOcrAccounts,
} from '../util/util-user-story-4';

type SortDirection = 'none' | 'asc' | 'desc';
type RepairStatus = 'OK' | 'AMB' | 'ILL';

const STATUS_ORDER: Record<RepairStatus, number> = {
	ILL: 0,
	AMB: 1,
	OK: 2,
};

export default function UserStory4() {
	const [sortDirection, setSortDirection] = useState<SortDirection>('none');

	const rows = useMemo(() => {
		const random = createDeterministicRandom(0x5a17d3e4);
		const ocrWithIllegible = generateOcrTestDataWithIllegibleNumbers(ACCOUNTS, {
			illegibleChance: 0.5,
			forceIllAtLeast: 3,
			random,
		});

		return repairOcrAccounts(ocrWithIllegible);
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
		<section className="accounts-card" aria-labelledby="accounts-title-us4">
			<h1 id="accounts-title-us4">Account Repair Table</h1>
			<p className="accounts-subtitle">Repair attempts using OCR segment changes and checksum validation</p>
			<div className="accounts-table-wrapper">
				<table className="accounts-table" aria-label="Account repair status table">
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
