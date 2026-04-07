import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (<>
    <h1>
      {t('error.notFound')}
    </h1>
    <p><Link to={"/"}>{t('general.returnHome')}</Link></p>
  </>);
}