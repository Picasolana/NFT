require('dotenv').config();

const { Connection, clusterApiUrl, Keypair } = require('@solana/web3.js');
const { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile } = require('@metaplex/js');
const fs = require('fs');

const bs58 = require('bs58');
const privateKey = new Uint8Array([154, 169,  78,  51, 163,  78,  77, 110,  46, 201,   4,
    252,  85, 175, 231,  40,  55, 106, 193,  49,  51, 101,
    30, 100,  95,  52,  57, 155, 226, 231,  39, 183, 139,
    100,   5, 214, 236,  11, 226, 250, 211, 188,  76, 187,
    150, 119, 121, 164, 126, 125,  49,  94,  27, 142, 200,
    119, 182, 166, 111,  45, 163, 159, 218,  94]); // replace with your private key as a Uint8Array
const base58EncodedSecretKey = bs58.encode(privateKey);

// Convert the base58 encoded secret key to a Uint8Array
const secretKeyUint8Array = bs58.decode(base58EncodedSecretKey);
const walletKeypair = Keypair.fromSecretKey(secretKeyUint8Array);

module.exports = async function mintNFT() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(walletKeypair))
    .use(bundlrStorage({ 
        address: 'https://devnet.bundlr.network', 
        providerUrl: 'https://api.devnet.solana.com', 
        timeout: 60000 
    }));

  // Replace 'path/to/your/image.jpg' with the actual path to your NFT image
  const imagePath = 'path/to/your/image.jpg';
  const imageFile = fs.readFileSync(imagePath);
  const imageMetaplexFile = toMetaplexFile(imageFile, imagePath);

  // Upload the image to Arweave via Bundlr
  const { uri: imageUri } = await metaplex.storage().upload(imageMetaplexFile);

  // Create metadata for the NFT
  const metadata = {
    name: "Your NFT Name",
    symbol: "",
    description: "A description of your NFT",
    image: imageUri,
    properties: {
      files: [{ uri: imageUri, type: "image/jpg" }],
      category: "image"
    }
  };

  // Upload the metadata to Arweave
  const { uri: metadataUri } = await metaplex.storage().uploadJson(metadata);

  // Mint the NFT
  const { nft } = await metaplex.nfts().create({
    uri: metadataUri,
    name: metadata.name,
    sellerFeeBasisPoints: 500, // Example: 5.00% seller fee
  });

  console.log("NFT minted successfully:", nft);
}