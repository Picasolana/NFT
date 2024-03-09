const { Connection, PublicKey, clusterApiUrl, Keypair } = require("@solana/web3.js");
const { programs } = require("@metaplex/js");
const { Metadata, CreateMetadata, CreateMasterEdition, Data } = programs.metadata;
const { MintLayout, Token } = require("@solana/spl-token");

// Your Solana wallet keypair
const walletKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.SOLANA_WALLET_SECRET_KEY)));

// Function to mint an NFT
async function mintNFT() {
    // Connect to the Solana devnet
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Create a new token mint
    const mint = await Token.createMint(
        connection,
        walletKeypair,
        walletKeypair.publicKey,
        null,
        0, // Decimals
        MintLayout,
    );

    // Create the associated token account for the wallet
    const tokenAccount = await mint.createAccount(walletKeypair.publicKey);

    // Mint one token (NFT) to the wallet
    await mint.mintTo(tokenAccount, walletKeypair.publicKey, [], 1);

    // Create metadata for the NFT
    const metadataData = new Data({
        symbol: "",
        name: "Your NFT Name",
        uri: "https://example.com/your-nft-metadata.json", // URL to the metadata JSON
        sellerFeeBasisPoints: 0,
        creators: null,
    });

    // Create the metadata account
    await new CreateMetadata(
        { feePayer: walletKeypair.publicKey },
        {
            metadata: Metadata.getPDA(mint.publicKey),
            metadataData,
            updateAuthority: walletKeypair.publicKey,
            mint: mint.publicKey,
            mintAuthority: walletKeypair.publicKey,
        },
    ).sendAndConfirm(connection, [walletKeypair]);

    // Create the master edition
    await new CreateMasterEdition(
        { feePayer: walletKeypair.publicKey },
        {
            edition: Metadata.getEdition(mint.publicKey),
            metadata: Metadata.getPDA(mint.publicKey),
            updateAuthority: walletKeypair.publicKey,
            mint: mint.publicKey,
            mintAuthority: walletKeypair.publicKey,
            maxSupply: 1,
        },
    ).sendAndConfirm(connection, [walletKeypair]);

    console.log("NFT minted:", mint.publicKey.toString());
}

mintNFT().catch(console.error);
