import { Link } from "react-router-dom";
import { dictionary } from "../client/text-constants";

export default function NotFound() {
  return (<>
    <h1>
      {dictionary.notFound.message}
    </h1>
    <p><Link to={"/"}>{dictionary.notFound.back}</Link></p>
  </>);
}