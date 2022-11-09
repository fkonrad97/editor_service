const contract = require("../artifacts/web3module/contracts/StoryNFT.sol/StoryNFT.json");

task("mint", "Mint a StoryNFT token to the given account")
  .addParam("tokenuri", "The Story's CID")
  .setAction(async (taskArgs) => {
    let provider = ethers.provider;

    const privateKey = `0x${process.env.GOERLI_PRIVATE_KEY}`;
    const wallet = new ethers.Wallet(privateKey);
  
    wallet.provider = provider;
    const signer = wallet.connect(provider);
  
    const nft = await new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        contract.abi,
        signer
    );
  
    console.log("Waiting for 5 blocks to confirm...");
    const res = await nft.mint(process.env.METAMASK_KEY, taskArgs.tokenuri)
        .then((tx) => tx.wait(5))
        .then((receipt) => console.log(`Confirmed! Your transaction receipt is: ${receipt.transactionHash}`))
        .catch((e) => console.log("Something went wrong", e));
  } 
);