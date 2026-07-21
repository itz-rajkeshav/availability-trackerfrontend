import LoginForm from "../../components/LoginForm";
import { ROLE } from "../../constants/roles.js";

export default function UserLogin() {
  return <LoginForm role={ROLE.USER} />;
}
