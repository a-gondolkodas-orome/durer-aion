import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (<>
    <h1>
      {t('notFound:message')}
    </h1>
    <p><Link to={"/"}>{t('notFound:back')}</Link></p>
  </>);
}