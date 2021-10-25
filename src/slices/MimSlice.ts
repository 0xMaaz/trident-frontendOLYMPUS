import { setAll } from "../helpers";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { IBaseAddressAsyncThunk } from "./interfaces";

import { calcAludelDetes } from "../helpers/PsiMimCrucible";

export const getMimData = createAsyncThunk(
  "stake/getMimData",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk) => {
    // only works on mainnet
    if (networkID !== 1) {
      // we don't have rinkeby contracts
      return { apy: 0, tvl: 0 };
    } else {
      // calcing APY & tvl
      const crucibleDetes = await calcAludelDetes(networkID, provider);
      let avgApy = crucibleDetes.averageApy;
      if (isNaN(avgApy)) avgApy = 0;

      return {
        apy: avgApy,
        tvl: crucibleDetes.tvlUsd,
        // NOTE (appleseed): balance is in accountSlice for the bond
        // balance: ethers.utils.formatUnits(sushiPsiMimBalance, "gwei"),
      };
    }
  },
);

/**
 * interface for object returned from getMimData + loading status
 */
export interface IUserMimDetails {
  apy: number;
  tvl: number;
  loading: boolean;
}

const initialState: IUserMimDetails = {
  loading: false,
  apy: 0,
  tvl: 0,
};

const mimSlice = createSlice({
  name: "mimData",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getMimData.pending, state => {
        state.loading = true;
      })
      .addCase(getMimData.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(getMimData.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      });
  },
});

export default mimSlice.reducer;

const baseInfo = (state: any) => state.mimData;

export const getMimState = createSelector(baseInfo, app => app);
