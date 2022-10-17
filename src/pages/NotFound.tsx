import { Link } from "react-router-dom";

export default function NotFound() {
  return (<>
    <h1>
      Ez az oldal nem található.
    </h1>
    <p><Link to={"/"}>Vissza a főoldalra</Link></p>
  </>);
}