import { createDeterministicRandom, generateOcrTestDataWithIllegibleNumbers } from '../test-data/testDataGenerator';
import { calculateChecksums, parseBankAccountsFromTestData } from './util';

export {
	// Test data generator functions
	createDeterministicRandom,
	generateOcrTestDataWithIllegibleNumbers,
	// Checksum calculation functions + parser
	calculateChecksums,
	parseBankAccountsFromTestData,
};
