import { ReactComponent as ForumIcon } from "../../assets/icons/forum.svg";
import { ReactComponent as GovIcon } from "../../assets/icons/governance.svg";
import { ReactComponent as DocsIcon } from "../../assets/icons/docs.svg";
import { ReactComponent as FeedbackIcon } from "../../assets/icons/feedback.svg";
import { SvgIcon } from "@material-ui/core";

const externalUrls = [
  {
    title: "Forum",
    url: "https://forum.tridentdao.finance/",
    icon: <SvgIcon color="primary" component={ForumIcon} />,
  },
  {
    title: "Governance",
    url: "https://vote.tridentdao.finance/",
    icon: <SvgIcon color="primary" component={GovIcon} />,
  },
  {
    title: "Docs",
    url: "https://docs.tridentdao.finance/",
    icon: <SvgIcon color="primary" component={DocsIcon} />,
  },
  {
    title: "Feedback",
    url: "https://tridentdao.canny.io/",
    icon: <SvgIcon color="primary" component={FeedbackIcon} />,
  },
];

export default externalUrls;
