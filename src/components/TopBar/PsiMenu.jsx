import { useState, useEffect } from "react";
import { addresses, TOKEN_DECIMALS } from "../../constants";
import { getTokenImage } from "../../helpers";
import { useSelector } from "react-redux";
import { Link, SvgIcon, Popper, Button, Paper, Typography, Divider, Box, Fade, Slide } from "@material-ui/core";
import { ReactComponent as InfoIcon } from "../../assets/icons/info-fill.svg";
import { ReactComponent as ArrowUpIcon } from "../../assets/icons/arrow-up.svg";
import { ReactComponent as sPsiTokenImg } from "../../assets/tokens/token_sPSI.svg";
import { ReactComponent as psiTokenImg } from "../../assets/tokens/token_PSI.svg";
import "./psimenu.scss";
import { dai, frax } from "src/helpers/AllBonds";
import { useWeb3Context } from "../../hooks/web3Context";

import PSIImg from "src/assets/tokens/token_PSI.svg";
import SPSIImg from "src/assets/tokens/token_sPSI.svg";

const addTokenToWallet = (tokenSymbol, tokenAddress) => async () => {
  if (window.ethereum) {
    const host = window.location.origin;
    // NOTE (appleseed): 33T token defaults to sPSI logo since we don't have a 33T logo yet
    let tokenPath;
    // if (tokenSymbol === "PSI") {

    // } ? PSIImg : SPSIImg;
    switch (tokenSymbol) {
      case "PSI":
        tokenPath = PSIImg;
        break;
      default:
        tokenPath = SPSIImg;
    }
    const imageURL = `${host}/${tokenPath}`;

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: TOKEN_DECIMALS,
            image: imageURL,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
};

function PsiMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const isEthereumAPIAvailable = window.ethereum;
  const { chainID } = useWeb3Context();

  const networkID = chainID;

  const SPSI_ADDRESS = addresses[networkID].SPSI_ADDRESS;
  const PSI_ADDRESS = addresses[networkID].PSI_ADDRESS;
  const PT_TOKEN_ADDRESS = addresses[networkID].PT_TOKEN_ADDRESS;

  const handleClick = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = "psi-popper";
  const daiAddress = dai.getAddressForReserve(networkID);
  const fraxAddress = frax.getAddressForReserve(networkID);
  return (
    <Box
      component="div"
      onMouseEnter={e => handleClick(e)}
      onMouseLeave={e => handleClick(e)}
      id="psi-menu-button-hover"
    >
      <Button id="psi-menu-button" size="large" variant="contained" color="secondary" title="PSI" aria-describedby={id}>
        <SvgIcon component={InfoIcon} color="primary" />
        <Typography>PSI</Typography>
      </Button>

      <Popper id={id} open={open} anchorEl={anchorEl} placement="bottom-start" transition>
        {({ TransitionProps }) => {
          return (
            <Fade {...TransitionProps} timeout={100}>
              <Paper className="psi-menu" elevation={1}>
                <Box component="div" className="buy-tokens">
                  <Link
                    href={`https://app.sushi.com/swap?inputCurrency=${daiAddress}&outputCurrency=${PSI_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      {/* TODO: Fix Sushiswap link */}
                      <Typography align="left">
                        Buy on Sushiswap <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>

                  <Link
                    href={`https://app.uniswap.org/#/swap?inputCurrency=${fraxAddress}&outputCurrency=${PSI_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      {/* TODO: Fix Uniswap link */}
                      <Typography align="left">
                        Buy on Uniswap <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>

                  <Link href={`https://abracadabra.money/pool/10`} target="_blank" rel="noreferrer">
                    {/* TODO: Fix wrap sPSI on Abracadabra link */}
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography align="left">
                        Wrap sPSI on Abracadabra <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>
                </Box>

                <Box component="div" className="data-links">
                  <Divider color="secondary" className="less-margin" />
                  <Link href={`https://dune.xyz/shadow/Olympus-(PSI)`} target="_blank" rel="noreferrer">
                    {/* TODO: Fix Shadow's Dune Dashboard link */}
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography align="left">
                        Shadow's Dune Dashboard <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>
                </Box>

                {isEthereumAPIAvailable ? (
                  <Box className="add-tokens">
                    <Divider color="secondary" />
                    {/* TODO: Fix add token to wallet links */}
                    <p>ADD TOKEN TO WALLET</p>
                    <Box display="flex" flexDirection="row" justifyContent="space-between">
                      <Button variant="contained" color="secondary" onClick={addTokenToWallet("PSI", PSI_ADDRESS)}>
                        <SvgIcon
                          component={psiTokenImg}
                          viewBox="0 0 32 32"
                          style={{ height: "25px", width: "25px" }}
                        />
                        <Typography variant="body1">PSI</Typography>
                      </Button>
                      <Button variant="contained" color="secondary" onClick={addTokenToWallet("sPSI", SPSI_ADDRESS)}>
                        <SvgIcon
                          component={sPsiTokenImg}
                          viewBox="0 0 100 100"
                          style={{ height: "25px", width: "25px" }}
                        />
                        <Typography variant="body1">sPSI</Typography>
                      </Button>
                    </Box>
                  </Box>
                ) : null}
              </Paper>
            </Fade>
          );
        }}
      </Popper>
    </Box>
  );
}

export default PsiMenu;
