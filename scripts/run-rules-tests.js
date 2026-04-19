const { spawnSync } = require("node:child_process");

const hasEmulatorHost = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const isCi = process.env.CI === "true";

if (!hasEmulatorHost) {
  if (isCi) {
    console.error(
      "FIRESTORE_EMULATOR_HOST is required in CI to run Firestore rules tests.",
    );
    process.exit(1);
  }

  console.log(
    "Skipping Firestore rules tests locally (set FIRESTORE_EMULATOR_HOST to run them).",
  );
  process.exit(0);
}

const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const rulesTestPattern = "lib/.*\\.rules\\.test\\.ts$";
const result = spawnSync(
  npxCmd,
  ["jest", "--runInBand", "--testPathPattern", rulesTestPattern],
  {
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(result.status ?? 1);
