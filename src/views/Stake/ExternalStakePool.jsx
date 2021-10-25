import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  Box,
  Paper,
  Typography,
  Button,
  SvgIcon,
  TableHead,
  TableCell,
  TableBody,
  Table,
  TableRow,
  TableContainer,
  Zoom,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";

import useMediaQuery from "@material-ui/core/useMediaQuery";
import BondLogo from "../../components/BondLogo";
import { ReactComponent as PsiMimImg } from "src/assets/tokens/PSI-MIM.svg";
import { ReactComponent as ArrowUp } from "../../assets/icons/arrow-up.svg";
import { getMimData } from "../../slices/MimSlice";
import { useWeb3Context } from "src/hooks/web3Context";
import { trim } from "../../helpers";

export default function ExternalStakePool() {
  const dispatch = useDispatch();
  const { provider, hasCachedProvider, address, connected, connect, chainID } = useWeb3Context();
  const [walletChecked, setWalletChecked] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 705px)");
  const isMobileScreen = useMediaQuery("(max-width: 513px)");

  const isMimLoading = useSelector(state => state.mimData.loading);
  const mimData = useSelector(state => {
    return state.mimData;
  });

  const psiMimReserveBalance = useSelector(state => {
    return state.account && state.account.bonds?.psi_mim_lp?.balance;
  });

  const loadMimData = async () => {
    await dispatch(getMimData({ address: address, provider: provider, networkID: chainID }));
  };

  useEffect(() => {
    if (hasCachedProvider()) {
      // then user DOES have a wallet
      connect().then(() => {
        setWalletChecked(true);
      });
    } else {
      // then user DOES NOT have a wallet
      setWalletChecked(true);
    }
  }, []);

  // this useEffect fires on state change from above. It will ALWAYS fire AFTER
  useEffect(() => {
    // don't load ANY details until wallet is Checked
    if (walletChecked) {
      loadMimData();
    }
  }, [walletChecked]);

  return (
    <Zoom in={true}>
      <Paper className={`psi-card secondary ${isSmallScreen && "mobile"}`}>
        <div className="card-header">
          <Typography variant="h5">Farm Pool</Typography>
        </div>
        <div className="card-content">
          {!isSmallScreen ? (
            <TableContainer className="stake-table">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="left">APY</TableCell>
                    <TableCell align="left">TVD</TableCell>
                    <TableCell align="left">Balance</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Box className="psi-pairs">
                        <BondLogo bond={{ bondIconSvg: PsiMimImg, isLP: true }}></BondLogo>
                        <Typography>PSI-MIM</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="left">
                      {isMimLoading ? (
                        <Skeleton width="80px" />
                      ) : mimData.apy === 0 ? (
                        "Coming Soon"
                      ) : (
                        trim(mimData.apy, 1) + "%"
                      )}
                    </TableCell>
                    <TableCell align="left">
                      {isMimLoading ? (
                        <Skeleton width="80px" />
                      ) : (
                        new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                          minimumFractionDigits: 0,
                        }).format(mimData.tvl)
                      )}
                    </TableCell>
                    <TableCell align="left">
                      {isMimLoading ? <Skeleton width="80px" /> : (trim(psiMimReserveBalance, 2) || 0) + " SLP"}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        color="secondary"
                        href="https://crucible.alchemist.wtf/reward-programs"
                        target="_blank"
                        className="stake-lp-button"
                      >
                        <Typography variant="body1">Stake in Crucible</Typography>
                        <SvgIcon component={ArrowUp} color="primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <div className="stake-pool">
              <div className={`pool-card-top-row ${isMobileScreen && "small"}`}>
                <Box className="psi-pairs">
                  <BondLogo bond={{ bondIconSvg: PsiMimImg, isLP: true }}></BondLogo>
                  <Typography gutterBottom={false}>PSI-MIM</Typography>
                </Box>
              </div>
              <div className="pool-data">
                <div className="data-row">
                  <Typography>APY</Typography>
                  <Typography>
                    {isMimLoading ? (
                      <Skeleton width="80px" />
                    ) : mimData.apy === 0 ? (
                      "Coming Soon"
                    ) : (
                      trim(mimData.apy, 1) + "%"
                    )}
                  </Typography>
                </div>
                <div className="data-row">
                  <Typography>TVD</Typography>
                  <Typography>
                    {isMimLoading ? (
                      <Skeleton width="80px" />
                    ) : (
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                        minimumFractionDigits: 0,
                      }).format(mimData.tvl)
                    )}
                  </Typography>
                </div>
                <div className="data-row">
                  <Typography>Balance</Typography>
                  <Typography>
                    {isMimLoading ? <Skeleton width="80px" /> : (trim(mimData.balance, 2) || 0) + "LP"}
                  </Typography>
                </div>

                <Button
                  variant="outlined"
                  color="secondary"
                  href="https://crucible.alchemist.wtf/reward-programs"
                  target="_blank"
                  className="stake-lp-button"
                  fullWidth
                >
                  <Typography variant="body1">Stake in Crucible</Typography>
                  <SvgIcon component={ArrowUp} color="primary" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Paper>
    </Zoom>
  );
}
