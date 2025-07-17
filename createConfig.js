import {
  PublicKey,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import {
  BaseFeeMode,
  DynamicBondingCurveClient,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { BN } from "bn.js";
import dotenv from "dotenv";
dotenv.config();

// Initialize connection and client
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const client = new DynamicBondingCurveClient(connection, "confirmed");

// Function to create a new mint and set up the pool
async function setupConfig() {
  try {
    const keypairData = JSON.parse(process.env.ADMIN_KEY);
    const secretKey = Uint8Array.from(keypairData);
    const wallet = Keypair.fromSecretKey(secretKey);
    console.log("Public key : ", wallet.publicKey.toBase58());

    // Config Keypair Generate

    let config = Keypair.generate();
    console.log("Created config:", config.publicKey.toBase58());

    // 1. Build the curve configuration (off-chain math)
    const configSetup = await client.partner.createConfig({
      payer: wallet.publicKey,
      config: config.publicKey,
      feeClaimer: wallet.publicKey,
      leftoverReceiver: wallet.publicKey,
      quoteMint: new PublicKey("So11111111111111111111111111111111111111112"),
      poolFees: {
        baseFee: {
          cliffFeeNumerator: new BN("2500000"),
          firstFactor: 0,
          secondFactor: new BN("0"),
          thirdFactor: new BN("0"),
          baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        },
        dynamicFee: {
          binStep: 1,
          binStepU128: new BN("1844674407370955"),
          filterPeriod: 10,
          decayPeriod: 120,
          reductionFactor: 1000,
          variableFeeControl: 100000,
          maxVolatilityAccumulator: 100000,
        },
      },
      activationType: 0, // 0: No activation, 1: Activation
      collectFeeMode: 1, // 0: No fee, 1: Fee on swap, 2: Fee on swap and withdraw
      migrationOption: 1, // DAMM V2 migration
      tokenType: 1, 
      tokenDecimal: 9,
      migrationQuoteThreshold: new BN("80000000"),
      partnerLpPercentage: 0,
      creatorLpPercentage: 0,
      partnerLockedLpPercentage: 100,
      creatorLockedLpPercentage: 0,
      sqrtStartPrice: new BN("58333726687135158"),
      lockedVesting: {
        amountPerPeriod: new BN("0"),
        cliffDurationFromMigrationTime: new BN("0"),
        frequency: new BN("0"),
        numberOfPeriod: new BN("0"),
        cliffUnlockAmount: new BN("0"),
      },
      migrationFeeOption: 5,
      tokenSupply: {
        preMigrationTokenSupply: new BN("10000000000000000000"),
        postMigrationTokenSupply: new BN("10000000000000000000"),
      },
      creatorTradingFeePercentage: 0,
      tokenUpdateAuthority: 1,
      migrationFee: {
        feePercentage: 25,
        creatorFeePercentage: 50,
      },
      padding0: [],
      padding1: [],
      curve: [
        {
          sqrtPrice: new BN("233334906748540631"),
          liquidity: new BN("622226417996106429201027821619672729"),
        },
        {
          sqrtPrice: new BN("79226673521066979257578248091"),
          liquidity: new BN("1"),
        },
      ],
    });

    console.log("transaction created successfully");

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    configSetup.recentBlockhash = blockhash;
    configSetup.feePayer = wallet.publicKey;

    console.log("signing the transaction");
    // Sign the transaction with both the wallet and config keypair
    configSetup.partialSign(wallet);
    configSetup.partialSign(config);

    console.log("sending and confirming the transaction");
    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      configSetup,
      [wallet, config],
      { commitment: "confirmed" }
    );

    console.log("Config created successfully!");
    console.log(`Transaction: https://solscan.io/tx/${signature}`);
    console.log(`Config address: ${config.publicKey.toString()}`);
  } catch (error) {
    console.log(error);
  }
}

setupConfig();
