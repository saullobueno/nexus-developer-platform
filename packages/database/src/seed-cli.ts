import { createDatabaseClient } from "./client";
import { seedBaseline, seedUserWithRole } from "./seed";

const DEMO_ADMIN_EMAIL = "admin@acme.test";
const DEMO_ADMIN_PASSWORD = "demo1234";

async function main() {
  const db = createDatabaseClient();
  const { organization } = await seedBaseline(db);
  await seedUserWithRole(db, {
    organizationId: organization.id,
    email: DEMO_ADMIN_EMAIL,
    name: "Admin Demo",
    password: DEMO_ADMIN_PASSWORD,
    roleSlug: "admin",
  });

  console.log(
    `Seed concluído para a organização "${organization.name}". Usuário demo: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
