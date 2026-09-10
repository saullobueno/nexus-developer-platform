import { createDatabaseClient } from "./client";
import { DEMO_PASSWORD } from "./demo/data";
import { seedDemoData } from "./demo-seed";

async function main() {
  const db = createDatabaseClient();
  const { organization } = await seedDemoData(db);

  console.log(
    `Dataset de demo criado para "${organization.name}". Qualquer usuário demo faz login com a senha "${DEMO_PASSWORD}" (ex.: admin@acme.test).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
