import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import dotenv from "dotenv";
dotenv.config();

async function createPool() {
  const keypairData = JSON.parse(process.env.ADMIN_KEY);
  const secretKey = Uint8Array.from(keypairData);
  const wallet = Keypair.fromSecretKey(secretKey);

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const configAddress = new PublicKey(
    "9t8ESgLRyFroJ75Agom3azM9aj84Q1h1qqN7zVvuv3pg"
  );

  console.log(`Using config: ${configAddress.toString()}`);

  try {
    const baseMint = Keypair.generate();
    console.log(`Generated base mint: ${baseMint.publicKey.toString()}`);

    const createPoolParam = {
      baseMint: baseMint.publicKey,
      config: configAddress,
      name: "SOU_POOL",
      symbol: "SOU",
      uri: "https://raw.githubusercontent.com/soumalya340/Raw_Data/refs/heads/main/raw_uri",
      payer: wallet.publicKey,
      poolCreator: wallet.publicKey,
    };

    const client = new DynamicBondingCurveClient(connection, "confirmed");

    console.log("Creating pool transaction...");
    const poolTransaction = await client.pool.createPool(createPoolParam);

    const signature = await sendAndConfirmTransaction(
      connection,
      poolTransaction,
      [wallet, baseMint, wallet],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );
    console.log("Transaction confirmed!");
    console.log(
      `Pool created: https://solscan.io/tx/${signature}?cluster=devnet`
    );
  } catch (error) {
    console.error("Failed to create pool:", error);
    console.log("Error details:", JSON.stringify(error, null, 2));
  }
}

createPool()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
