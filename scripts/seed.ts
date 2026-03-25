import { section } from './helpers/format.js';

async function main(): Promise<void> {
  section('seed');
  console.log(
    'TODO: mint local MockUSDC to at least two dev accounts after deployment. Keep output deterministic and demo-friendly.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
