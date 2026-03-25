import { section } from './helpers/format.js';

async function main(): Promise<void> {
  section('demo');
  console.log('TODO: scripted flow should eventually:');
  console.log('1. mint MockUSDC');
  console.log('2. approve + deposit');
  console.log('3. create policy');
  console.log('4. charge within cap');
  console.log('5. attempt over-cap or expired charge');
  console.log('6. revoke policy');
  console.log('7. withdraw unused funds');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
