require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
const contract = require("../artifacts/contracts/StoryNFT.sol/StoryNFT.json");
const contractInterface = contract.abi;

async function mint(tokenURI) {
  let provider = ethers.provider;

  const privateKey = `0x${process.env.GOERLI_PRIVATE_KEY}`;
  const wallet = new ethers.Wallet(privateKey);
  
  wallet.provider = provider;
  const signer = wallet.connect(provider);
  
  const nft = await new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contractInterface,
      signer
    );
  
  console.log("Waiting for 5 blocks to confirm...");
  const res = 
      await nft.mint(process.env.METAMASK_KEY, tokenURI)
        .then((tx) => tx.wait(5))
        .then((receipt) => console.log(`Confirmed! Your transaction receipt is: ${receipt.transactionHash}`))
        .catch((e) => console.log("Something went wrong", e));
};

exports.mint = mint;