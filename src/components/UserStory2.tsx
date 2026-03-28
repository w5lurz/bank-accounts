import { testData } from '../test-data/testDataGenerator';
import { calculateChecksums, parseBankAccountsFromTestData } from '../util/util-user-story-2';

export default function UserStory2() {
	const parsedAccounts = parseBankAccountsFromTestData(testData);
	const validatedAccounts = calculateChecksums(parsedAccounts);

	return (
		<section className="accounts-card" aria-labelledby="accounts-title-us2">
			<h1 id="accounts-title-us2">Bank Account Validation</h1>
			<p className="accounts-subtitle">Decoded account numbers with checksum status</p>
			<div className="accounts-legend" aria-label="Checksum legend">
				<span className="legend-item">
					<span className="account-status is-valid legend-status" aria-hidden="true">
						✓
					</span>
					<span>valid checksum</span>
				</span>
				<span className="legend-item">
					<span className="account-status is-invalid legend-status" aria-hidden="true">
						X
					</span>
					<span>invalid checksum</span>
				</span>
			</div>
			<ul className="accounts-list" aria-label="Bank accounts with validity status" tabIndex={0}>
				{validatedAccounts.map(({ accountNumber, isValid }, index) => (
					<li key={`${accountNumber}-${index}`} className="account-row">
						<span className="account-index">#{index + 1}</span>
						<div className="account-info">
							<span className="account-number">{accountNumber}</span>
							<span
								className={`account-status ${isValid ? 'is-valid' : 'is-invalid'}`}
								aria-label={isValid ? 'Valid account' : 'Invalid account'}
								title={isValid ? 'Valid checksum' : 'Invalid checksum'}
							>
								{isValid ? '✓' : 'X'}
							</span>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
