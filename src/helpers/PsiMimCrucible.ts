import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { NetworkID } from "src/lib/Bond";
import { psi_mim, mim } from "./AllBonds";
import { abi as PsiMimCrucible } from "src/abi/PsiMimCrucible.json";
import { abi as UniswapIERC20 } from "src/abi/UniswapIERC20.json";
import { BigNumber, ethers } from "ethers";
import { addresses } from "src/constants";
import { getTokenPrice } from ".";

export const calcAludelDetes = async (networkID: NetworkID, provider: StaticJsonRpcProvider) => {
  const crucibleAddress = addresses[networkID].CRUCIBLE_PSI_MIM;
  const aludelContract = new ethers.Contract(crucibleAddress as string, PsiMimCrucible, provider);
  const aludelData = await aludelContract.getAludelData();
  // getting contractAddresses & Pricing for calculations below
  let psiPrice = await getTokenPrice("trident");
  let psiContractAddress = addresses[networkID].PSI_ADDRESS.toLowerCase();

  let mimPrice = await getTokenPrice("magic-internet-money");
  let mimContractAddress = mim.getAddressForReserve(networkID).toLowerCase();

  let psiMimPrice = await psi_mim.getBondReservePrice(networkID, provider);
  let psiMimContractAddress = psi_mim.getAddressForReserve(networkID).toLowerCase();

  let mistPrice = await getTokenPrice("alchemist");
  let mistContractAddress = addresses[networkID].MIST.toLowerCase();

  // set addresses & pricing in dictionary
  let usdValues: { [key: string]: number } = {};
  usdValues[psiContractAddress] = psiPrice;
  usdValues[psiMimContractAddress] = psiMimPrice;
  usdValues[mistContractAddress] = mistPrice;

  // console.log("usdValues", usdValues);
  let totalRemainingRewards = 0;
  let remainingDurations: number[] = [];
  let pastDurations: number[] = [];
  let dt_now = Date.now() / 1000;

  // console.log("aludelData", aludelData);
  // map through all fund() calls
  aludelData.rewardSchedules.map((rs: { start: string | number; duration: string | number; shares: number }) => {
    let rewardStart: number = parseFloat(rs.start.toString());
    let rewardDuration: number = parseFloat(rs.duration.toString());

    // if the reward has already ended, skip it
    if (rewardStart + rewardDuration > parseFloat(dt_now.toString())) {
      // shares remaining for reward schedule
      totalRemainingRewards += rs.shares * (1 - (dt_now - rewardStart) / rewardDuration);

      // seconds remaining of reward schedule
      remainingDurations.push(parseFloat(dt_now.toString()) - rewardStart + rewardDuration);

      // seconds past since start of reward schedule
      pastDurations.push(parseFloat(dt_now.toString()) - rewardStart);
    } else {
      // seconds since reward schedule started
      pastDurations.push(parseFloat(dt_now.toString()) - rewardStart + rewardDuration);
    }
  });

  // average duration in seconds for future releases
  let avgRemainingDuration = remainingDurations.reduce((a, b) => a + b, 0) / remainingDurations.length;

  // furthest start date for past funds
  let oldestDepositDate = Math.max.apply(null, pastDurations);

  // rewardToken is PSI for this Crucible
  const rewardTokenContract = new ethers.Contract(aludelData.rewardToken as string, UniswapIERC20, provider);

  let rewardTokenDecimals = await rewardTokenContract.decimals();
  // let rewardTokenDecimals = 9;

  let rewardPoolBalance = await rewardTokenContract.balanceOf(aludelData.rewardPool);
  // balance of rewardToken in pool
  let rewardTokenQuantity = rewardPoolBalance / 10 ** rewardTokenDecimals;

  // amount of bonus tokens in program
  const bonusTokensLength = (await aludelContract.getBonusTokenSetLength()) as BigNumber;
  const bonusTokensLengthNumber = bonusTokensLength.toNumber();

  let bonusTokenUsdValues: number[] = [];

  // get bonus tokens and their USD value
  await Promise.all(
    Array.from(Array(bonusTokensLengthNumber)).map(async (_, idx) => {
      const bonusTokenAddress = await aludelContract.getBonusTokenAtIndex(idx);
      const bonusTokenContract = new ethers.Contract(bonusTokenAddress, UniswapIERC20, provider);

      const bonusTokenDecimals = await bonusTokenContract.decimals();
      const balanceOfBonusToken = await bonusTokenContract.balanceOf(aludelData.rewardPool);
      const valueOfBonusToken = usdValues[bonusTokenAddress.toLowerCase()];

      const usdValueOfBonusToken = (balanceOfBonusToken / 10 ** bonusTokenDecimals) * valueOfBonusToken;
      bonusTokenUsdValues.push(usdValueOfBonusToken);
    }),
  );

  // calculate total USD value of bonus tokens
  let totalUsdValueOfBonusTokens = bonusTokenUsdValues.reduce((a, b) => a + b, 0);

  // scale shares to token decimals + base share (10 ** 6)
  let rewardsRemainingValue = totalRemainingRewards / 10 ** (rewardTokenDecimals + 6);

  // usd value of rewardToken
  let rewardTokenUsdValue = usdValues[aludelData.rewardToken.toLowerCase()];

  // usd value of rewardToken to be released
  let rewardsRemainingValueUsd = rewardsRemainingValue * rewardTokenUsdValue;

  // amount of rewardToken that are released
  let rewardsPreviouslyReleased = rewardTokenQuantity - rewardsRemainingValue;

  // percentage of rewardToken that are released
  let rewardsReleasedPercentage = rewardsPreviouslyReleased / rewardTokenQuantity;

  // usd value of rewardToken that are released
  let rewardsPreviouslyReleasedUsdValue = rewardsPreviouslyReleased * rewardTokenUsdValue;

  let mimContract = new ethers.Contract(mimContractAddress, UniswapIERC20, provider);

  let stakedPsi = (await rewardTokenContract.balanceOf(aludelData.stakingToken)) / 10 ** rewardTokenDecimals;
  // 18 decimals for MIM
  let stakedMim = (await mimContract.balanceOf(aludelData.stakingToken)) / 10 ** 18;

  let totalStakedTokensUsd = stakedPsi * psiPrice + stakedMim * mimPrice;

  let stakingTokenContract = new ethers.Contract(aludelData.stakingToken, UniswapIERC20, provider);
  let sushiTokenSupply = (await stakingTokenContract.totalSupply()) / 10 ** 18;
  // total stake of stakingToken with 18 decimals
  let aludelTotalStakedTokens = aludelData.totalStake / 10 ** 18;
  // total usd value of staked stakingToken is the percent of aludel-staked over sushi-staked times sushi staked USD
  let aludelTotalStakedTokensUsd = (aludelTotalStakedTokens / sushiTokenSupply) * totalStakedTokensUsd;

  let secs_in_year = 365 * 24 * 60 * 60;

  // future rewards multiplier based on avg future rewards duration
  let remainingTime = secs_in_year / avgRemainingDuration || 0;

  // past rewards multiplier based on ealiest rewardShedule start date
  let pastTime = secs_in_year / oldestDepositDate || 1;

  let numerator =
    // calculate apy from released rewardToken
    rewardsPreviouslyReleasedUsdValue * pastTime +
    // calculate apy from released bonus tokens based on rewardToken released percentage
    totalUsdValueOfBonusTokens * rewardsReleasedPercentage * pastTime +
    // calculate apy from future released rewardToken
    rewardsRemainingValueUsd * remainingTime +
    // calculate apy from future released bonus tokens based on rewardToken released percentage
    totalUsdValueOfBonusTokens * (1 - rewardsReleasedPercentage) * remainingTime;

  // divide apy based on value of staked stakingToken
  let averageApy = (numerator / aludelTotalStakedTokensUsd) * 100;

  return {
    averageApy: averageApy,
    tvlUsd: aludelTotalStakedTokensUsd,
  };
};
