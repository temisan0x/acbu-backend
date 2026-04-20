import "dotenv/config";

import { BASKET_CURRENCIES } from "../src/config/basket";
import { getContractAddresses } from "../src/config/contracts";
import { OracleService } from "../src/services/contracts/acbuOracle.service";

async function main(): Promise<void> {
  const addresses = getContractAddresses();
  if (!addresses.oracle) throw new Error("Missing CONTRACT_ORACLE in env");

  const svc = new OracleService(addresses.oracle);
  const missing: string[] = [];
  for (const c of BASKET_CURRENCIES) {
    try {
      const r = await svc.getRate(c);
      if (!r || BigInt(r) <= 0n) missing.push(c);
    } catch {
      missing.push(c);
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: missing.length === 0, missing }, null, 2));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

