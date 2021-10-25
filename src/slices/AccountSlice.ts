import { ethers } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as sPSI } from "../abi/sPSI.json";
import { abi as sPSIv2 } from "../abi/sPSIv2.json";
import { abi as fuseProxy } from "../abi/FuseProxy.json";
import { abi as wsPSI } from "../abi/wsPSI.json";

import { setAll } from "../helpers";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { Bond, NetworkID } from "src/lib/Bond"; // TODO: this type definition needs to move out of BOND.
import { RootState } from "src/store";
import { IBaseAddressAsyncThunk, ICalcUserBondDetailsAsyncThunk } from "./interfaces";

export const getBalances = createAsyncThunk(
  "account/getBalances",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk) => {
    const psiContract = new ethers.Contract(addresses[networkID].PSI_ADDRESS as string, ierc20Abi, provider);
    const psiBalance = await psiContract.balanceOf(address);
    const spsiContract = new ethers.Contract(addresses[networkID].SPSI_ADDRESS as string, ierc20Abi, provider);
    const spsiBalance = await spsiContract.balanceOf(address);
    let poolBalance = 0;
    const poolTokenContract = new ethers.Contract(addresses[networkID].PT_TOKEN_ADDRESS as string, ierc20Abi, provider);
    poolBalance = await poolTokenContract.balanceOf(address);

    return {
      balances: {
        psi: ethers.utils.formatUnits(psiBalance, "gwei"),
        spsi: ethers.utils.formatUnits(spsiBalance, "gwei"),
        pool: ethers.utils.formatUnits(poolBalance, "gwei"),
      },
    };
  },
);

interface IUserAccountDetails {
  balances: {
    dai: string;
    psi: string;
    spsi: string;
  };
  staking: {
    psiStake: number;
    psiUnstake: number;
  };
  bonding: {
    daiAllowance: number;
  };
}

export const loadAccountDetails = createAsyncThunk(
  "account/loadAccountDetails",
  async ({ networkID, provider, address }: IBaseAddressAsyncThunk) => {
    let psiBalance = 0;
    let spsiBalance = 0;
    let fspsiBalance = 0;
    let wspsiBalance = 0;
    let stakeAllowance = 0;
    let unstakeAllowance = 0;
    let lpStaked = 0;
    let pendingRewards = 0;
    let lpBondAllowance = 0;
    let daiBondAllowance = 0;
    let aPSIAbleToClaim = 0;
    let poolBalance = 0;
    let poolAllowance = 0;

    const daiContract = new ethers.Contract(addresses[networkID].DAI_ADDRESS as string, ierc20Abi, provider);
    const daiBalance = await daiContract.balanceOf(address);

    if (addresses[networkID].PSI_ADDRESS) {
      const psiContract = new ethers.Contract(addresses[networkID].PSI_ADDRESS as string, ierc20Abi, provider);
      psiBalance = await psiContract.balanceOf(address);
      stakeAllowance = await psiContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);
    }

    if (addresses[networkID].SPSI_ADDRESS) {
      const spsiContract = new ethers.Contract(addresses[networkID].SPSI_ADDRESS as string, sPSIv2, provider);
      spsiBalance = await spsiContract.balanceOf(address);
      unstakeAllowance = await spsiContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
      poolAllowance = await spsiContract.allowance(address, addresses[networkID].PT_PRIZE_POOL_ADDRESS);
    }

    if (addresses[networkID].PT_TOKEN_ADDRESS) {
      const poolTokenContract = await new ethers.Contract(addresses[networkID].PT_TOKEN_ADDRESS, ierc20Abi, provider);
      poolBalance = await poolTokenContract.balanceOf(address);
    }

    for (const fuseAddressKey of ["FUSE_6_SPSI", "FUSE_18_SPSI"]) {
      if (addresses[networkID][fuseAddressKey]) {
        const fspsiContract = await new ethers.Contract(
          addresses[networkID][fuseAddressKey] as string,
          fuseProxy,
          provider,
        );
        fspsiContract.signer;
        const exchangeRate = ethers.utils.formatEther(await fspsiContract.exchangeRateStored());
        const balance = ethers.utils.formatUnits(await fspsiContract.balanceOf(address), "gwei");
        fspsiBalance += Number(balance) * Number(exchangeRate);
      }
    }

    if (addresses[networkID].WSPSI_ADDRESS) {
      const wspsiContract = new ethers.Contract(addresses[networkID].WSPSI_ADDRESS as string, wsPSI, provider);
      const balance = await wspsiContract.balanceOf(address);
      wspsiBalance = await wspsiContract.wPSITosPSI(balance);
    }

    return {
      balances: {
        dai: ethers.utils.formatEther(daiBalance),
        psi: ethers.utils.formatUnits(psiBalance, "gwei"),
        spsi: ethers.utils.formatUnits(spsiBalance, "gwei"),
        fspsi: fspsiBalance,
        wspsi: ethers.utils.formatUnits(wspsiBalance, "gwei"),
        pool: ethers.utils.formatUnits(poolBalance, "gwei"),
      },
      staking: {
        psiStake: +stakeAllowance,
        psiUnstake: +unstakeAllowance,
      },
      bonding: {
        daiAllowance: daiBondAllowance,
      },
      pooling: {
        spsiPool: +poolAllowance,
      },
    };
  },
);

export interface IUserBondDetails {
  allowance: number;
  interestDue: number;
  bondMaturationBlock: number;
  pendingPayout: string; //Payout formatted in gwei.
}
export const calculateUserBondDetails = createAsyncThunk(
  "account/calculateUserBondDetails",
  async ({ address, bond, networkID, provider }: ICalcUserBondDetailsAsyncThunk) => {
    if (!address) {
      return {
        bond: "",
        displayName: "",
        bondIconSvg: "",
        isLP: false,
        allowance: 0,
        balance: "0",
        interestDue: 0,
        bondMaturationBlock: 0,
        pendingPayout: "",
      };
    }
    // dispatch(fetchBondInProgress());

    // Calculate bond details.
    const bondContract = bond.getContractForBond(networkID, provider);
    const reserveContract = bond.getContractForReserve(networkID, provider);

    let interestDue, pendingPayout, bondMaturationBlock;

    const bondDetails = await bondContract.bondInfo(address);
    interestDue = bondDetails.payout / Math.pow(10, 9);
    bondMaturationBlock = +bondDetails.vesting + +bondDetails.lastBlock;
    pendingPayout = await bondContract.pendingPayoutFor(address);

    let allowance,
      balance = 0;
    allowance = await reserveContract.allowance(address, bond.getAddressForBond(networkID));
    balance = await reserveContract.balanceOf(address);
    // formatEthers takes BigNumber => String
    const balanceVal = ethers.utils.formatEther(balance);
    // balanceVal should NOT be converted to a number. it loses decimal precision
    return {
      bond: bond.name,
      displayName: bond.displayName,
      bondIconSvg: bond.bondIconSvg,
      isLP: bond.isLP,
      allowance: Number(allowance),
      balance: balanceVal,
      interestDue,
      bondMaturationBlock,
      pendingPayout: ethers.utils.formatUnits(pendingPayout, "gwei"),
    };
  },
);

interface IAccountSlice {
  bonds: { [key: string]: IUserBondDetails };
  balances: {
    psi: string;
    spsi: string;
    dai: string;
    oldspsi: string;
  };
  loading: boolean;
}
const initialState: IAccountSlice = {
  loading: false,
  bonds: {},
  balances: { psi: "", spsi: "", dai: "", oldspsi: "" },
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    fetchAccountSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAccountDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAccountDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAccountDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(getBalances.pending, state => {
        state.loading = true;
      })
      .addCase(getBalances.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(getBalances.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(calculateUserBondDetails.pending, state => {
        state.loading = true;
      })
      .addCase(calculateUserBondDetails.fulfilled, (state, action) => {
        if (!action.payload) return;
        const bond = action.payload.bond;
        state.bonds[bond] = action.payload;
        state.loading = false;
      })
      .addCase(calculateUserBondDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      });
  },
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: RootState) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
