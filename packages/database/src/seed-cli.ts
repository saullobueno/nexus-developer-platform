import { createDatabaseClient } from "./client";
import { seedBaseline } from "./seed";

async function main() {
  const db = createDatabaseClient();
  const { organization } = await seedBaseline(db);
  console.log(`Seed concluído para a organização "${organization.name}".`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
