const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SonetyoNFT", function () {
    let sonetyo;
    let owner, user1, user2;

    const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample-audio-file"));
    const sampleURI = "ipfs://QmSampleHash123";

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const SonetyoNFT = await ethers.getContractFactory("SonetyoNFT");
        sonetyo = await SonetyoNFT.deploy();
        await sonetyo.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set correct name and symbol", async function () {
            expect(await sonetyo.name()).to.equal("Sonetyo Proof");
            expect(await sonetyo.symbol()).to.equal("SONETYO");
        });

        it("Should start with 0 total supply", async function () {
            expect(await sonetyo.totalSupply()).to.equal(0);
        });
    });

    describe("Minting", function () {
        it("Should mint a new NFT with correct data", async function () {
            const tx = await sonetyo.connect(user1).mint(sampleHash, sampleURI);
            await tx.wait();

            expect(await sonetyo.totalSupply()).to.equal(1);
            expect(await sonetyo.ownerOf(0)).to.equal(user1.address);

            const proof = await sonetyo.getProof(0);
            expect(proof.audioHash).to.equal(sampleHash);
            expect(proof.creator).to.equal(user1.address);
            expect(proof.verificationCount).to.equal(0);
        });

        it("Should emit SonetyoMinted event", async function () {
            await expect(sonetyo.connect(user1).mint(sampleHash, sampleURI))
                .to.emit(sonetyo, "SonetyoMinted")
                .withArgs(0, user1.address, sampleHash, (await ethers.provider.getBlock("latest")).timestamp + 1);
        });

        it("Should increment creator mint count", async function () {
            await sonetyo.connect(user1).mint(sampleHash, sampleURI);

            const [totalMints, totalVerifications] = await sonetyo.getCreatorStats(user1.address);
            expect(totalMints).to.equal(1);
            expect(totalVerifications).to.equal(0);
        });

        it("Should reject duplicate audio hash", async function () {
            await sonetyo.connect(user1).mint(sampleHash, sampleURI);

            await expect(sonetyo.connect(user2).mint(sampleHash, sampleURI))
                .to.be.revertedWith("Este audio ya fue registrado");
        });

        it("Should reject empty hash", async function () {
            await expect(sonetyo.connect(user1).mint(ethers.ZeroHash, sampleURI))
                .to.be.revertedWith("Hash invalido");
        });
    });

    describe("Verification", function () {
        beforeEach(async function () {
            await sonetyo.connect(user1).mint(sampleHash, sampleURI);
        });

        it("Should allow user to verify another's idea", async function () {
            await sonetyo.connect(user2).verify(0);

            const proof = await sonetyo.getProof(0);
            expect(proof.verificationCount).to.equal(1);
        });

        it("Should emit SonetyoVerified event", async function () {
            await expect(sonetyo.connect(user2).verify(0))
                .to.emit(sonetyo, "SonetyoVerified")
                .withArgs(0, user2.address, 1);
        });

        it("Should reject self-verification", async function () {
            await expect(sonetyo.connect(user1).verify(0))
                .to.be.revertedWith("No puedes verificar tu propia idea");
        });

        it("Should reject double verification from same user", async function () {
            await sonetyo.connect(user2).verify(0);

            await expect(sonetyo.connect(user2).verify(0))
                .to.be.revertedWith("Ya verificaste esta idea");
        });

        it("Should increment verifier count", async function () {
            await sonetyo.connect(user2).verify(0);

            const [, totalVerifications] = await sonetyo.getCreatorStats(user2.address);
            expect(totalVerifications).to.equal(1);
        });
    });

    describe("Queries", function () {
        it("Should check if hash is registered", async function () {
            expect(await sonetyo.isHashRegistered(sampleHash)).to.equal(false);

            await sonetyo.connect(user1).mint(sampleHash, sampleURI);

            expect(await sonetyo.isHashRegistered(sampleHash)).to.equal(true);
        });

        it("Should return token URI", async function () {
            await sonetyo.connect(user1).mint(sampleHash, sampleURI);

            expect(await sonetyo.tokenURI(0)).to.equal(sampleURI);
        });
    });
});
