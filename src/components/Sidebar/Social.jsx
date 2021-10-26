import { SvgIcon, Link } from "@material-ui/core";
import { ReactComponent as GitHub } from "../../assets/icons/github.svg";
import { ReactComponent as Medium } from "../../assets/icons/medium.svg";
import { ReactComponent as Twitter } from "../../assets/icons/twitter.svg";
import { ReactComponent as Discord } from "../../assets/icons/discord.svg";

export default function Social() {
  return (
    <div className="social-row">
      {/* TODO: Point Github link to correct repo */}
      <Link href="https://github.com/OlympusDAO" target="_blank">
        <SvgIcon color="primary" component={GitHub} />
      </Link>

      <Link href="https://tridentdao.medium.com/" target="_blank">
        <SvgIcon color="primary" component={Medium} />
      </Link>

      {/* TODO: Point Twitter link to correct user */}
      <Link href="https://twitter.com/OlympusDAO" target="_blank">
        <SvgIcon color="primary" component={Twitter} />
      </Link>

      {/* TODO: Point Discord link to correct invite link*/}

      <Link href="https://discord.gg/6QjjtUcfM4" target="_blank">
        <SvgIcon color="primary" component={Discord} />
      </Link>
    </div>
  );
}
