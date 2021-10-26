import { ReactComponent as ForumIcon } from "../../assets/icons/forum.svg";
import { ReactComponent as GovIcon } from "../../assets/icons/governance.svg";
import { ReactComponent as DocsIcon } from "../../assets/icons/docs.svg";
import { ReactComponent as FeedbackIcon } from "../../assets/icons/feedback.svg";
import { SvgIcon } from "@material-ui/core";

const externalUrls = [
  {
    /* TODO: Implement Forum docs */
    title: "Forum",
    url: "https://forum.tridentdao.finance/",
    icon: <SvgIcon color="primary" component={ForumIcon} />,
  },
  {
    /* TODO: Implement Governance page */
    title: "Governance",
    url: "https://vote.tridentdao.finance/",
    icon: <SvgIcon color="primary" component={GovIcon} />,
  },
  {
    /* TODO: Implement Docs page */
    title: "Docs",
    url: "https://docs.tridentdao.finance/",
    icon: <SvgIcon color="primary" component={DocsIcon} />,
  },
  {
    /* TODO: Implement Feedback page */
    title: "Feedback",
    url: "https://tridentdao.canny.io/",
    icon: <SvgIcon color="primary" component={FeedbackIcon} />,
  },
];

export default externalUrls;
