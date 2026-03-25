import { section } from './helpers/format.js';

async function main(): Promise<void> {
  section('deploy');
  console.log(
    'TODO: implement deploy flow once EP-0001 contract core is complete. Expected outputs: MockUSDC address and PolicyVault address.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
