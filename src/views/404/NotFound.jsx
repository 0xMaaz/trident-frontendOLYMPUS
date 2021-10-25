import TridentLogo from "../../assets/Trident Logo.svg";
import "./notfound.scss";

export default function NotFound() {
  return (
    <div id="not-found">
      <div className="not-found-header">
        <a href="https://tridentdao.finance" target="_blank">
          <img className="branding-header-icon" src={TridentLogo} alt="OlympusDAO" />
        </a>

        <h4>Page not found</h4>
      </div>
    </div>
  );
}
