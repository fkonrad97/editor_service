const contract = require("../artifacts/contracts/StoryNFT.sol/StoryNFT.json");
const { mint } = require("../scripts/minting.js");

task("mint", "Mint a StoryNFT token to the given account")
  .addParam("tokenuri", "The Story's CID")
  .setAction(async (taskArgs) => {
    await mint(taskArgs.tokenuri);
  } 
);