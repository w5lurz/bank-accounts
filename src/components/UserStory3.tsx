import { useMemo, useState } from 'react';
import { ACCOUNTS } from '../test-data/testDataGenerator';
import {
	calculateChecksums,
	createDeterministicRandom,
	generateOcrTestDataWithIllegibleNumbers,
	parseBankAccountsFromTestData,
} from '../util/util-user-story-3';

type AccountStatus = 'OK' | 'ERR' | 'ILL';
type SortDirection = 'none' | 'asc' | 'desc';

const STATUS_ORDER: Record<AccountStatus, number> = {
	ERR: 0,
	ILL: 1,
	OK: 2,
};

const getStatus = (accountNumber: string): AccountStatus => {
	if (accountNumber.includes('?')) {
		return 'ILL';
	}

	const [{ isValid }] = calculateChecksums([accountNumber]);
	return isValid ? 'OK' : 'ERR';
};

export default function UserStory3() {
	const [sortDirection, setSortDirection] = useState<SortDirection>('none');

	const rows = useMemo(() => {
		const random = createDeterministicRandom(0x5a17d3e4);
		const ocrWithIllegible = generateOcrTestDataWithIllegibleNumbers(ACCOUNTS, {
			illegibleChance: 0.5,
			random,
		});
		const parsedAccounts = parseBankAccountsFromTestData(ocrWithIllegible).split('\n');

		return parsedAccounts.map((accountNumber) => ({
			accountNumber,
			status: getStatus(accountNumber),
		}));
	}, []);

	const sortedRows = useMemo(() => {
		if (sortDirection === 'none') {
			return rows;
		}

		const directionFactor = sortDirection === 'asc' ? 1 : -1;

		return [...rows].sort((left, right) => {
			const statusDiff = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];

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
		<section className="accounts-card" aria-labelledby="accounts-title-us3">
			<h1 id="accounts-title-us3">Account Status Table</h1>
			<p className="accounts-subtitle">OCR parsing with checksum and illegible detection</p>
			<div className="accounts-table-wrapper">
				<table className="accounts-table" aria-label="Account status table">
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
