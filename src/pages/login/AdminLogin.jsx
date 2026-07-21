import LoginForm from "../../components/LoginForm";
import { ROLE } from "../../constants/roles.js";

export default function AdminLogin() {
  return <LoginForm role={ROLE.ADMIN} />;
}
