task("deploy", "Mint a StoryNFT token to the given account")
  .setAction(async (taskArgs) => {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const StoryNFT = await ethers.getContractFactory("StoryNFT");
    const storyNFTToken = await StoryNFT.deploy("StoryNFT_test", "PATH");

    await storyNFTToken.deployed();

    console.log("Token address:", storyNFTToken.address);
  } 
);