import "dotenv/config";

import { fetchAndStoreRates } from "../src/services/oracle/integrationService";

async function main(): Promise<void> {
  await fetchAndStoreRates();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

