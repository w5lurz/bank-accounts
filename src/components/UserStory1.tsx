import { testData } from '../test-data/testDataGenerator';
import { parseBankAccountsFromTestData } from '../util/util-user-story-1';

export default function UserStory1() {
	const parsedAccounts = parseBankAccountsFromTestData(testData).split('\n');

	return (
		<section className="accounts-card" aria-labelledby="accounts-title">
			<h1 id="accounts-title">Bank Account Numbers</h1>
			<p className="accounts-subtitle">Decoded from OCR test data</p>
			<ul className="accounts-list" aria-label="Decoded bank accounts" tabIndex={0}>
				{parsedAccounts.map((accountNumber, index) => (
					<li key={`${accountNumber}-${index}`} className="account-row">
						<span className="account-index">#{index + 1}</span>
						<span className="account-number">{accountNumber}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
