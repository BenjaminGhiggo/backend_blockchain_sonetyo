const hre = require("hardhat");

async function main() {
    console.log("🎵 Deploying SonetyoNFT...\n");

    const SonetyoNFT = await hre.ethers.getContractFactory("SonetyoNFT");
    const sonetyo = await SonetyoNFT.deploy();

    await sonetyo.waitForDeployment();
    const address = await sonetyo.getAddress();

    console.log("✅ SonetyoNFT deployed to:", address);
    console.log("\n📋 Contract Details:");
    try {
        console.log("   Name:", await sonetyo.name());
        console.log("   Symbol:", await sonetyo.symbol());
        console.log("   Owner:", await sonetyo.owner());
    } catch (err) {
        console.log("   (No se pudieron leer name/symbol/owner en esta red; puede ser limitación del RPC de devnet)");
    }

    console.log("\n🔗 Explorer URL (zkSYS PoB Devnet):");
    console.log(`   https://explorer-pob.dev11.top/address/${address}`);

    console.log("\n💾 Frontend: crea o edita frontend/.env y añade:");
    console.log(`   VITE_CONTRACT_ADDRESS=${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
