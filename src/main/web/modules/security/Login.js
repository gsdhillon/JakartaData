import {
    Button,
    Div,
    Form,
    Input,
    useMemo,
    useState
} from "../../lib/Grove.js";
import { login } from "./SecurityService.js";

const Login = props => {
    const [credentials, setCredentials] = useState({
        personId: "",
        password: ""
    });
    const [message, setMessage] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const actions = useMemo(
        () => [
            Button({
                icon: "box-arrow-in-right",
                label: isBusy ? "Signing In" : "Login",
                look: "pm",
                name: "login",
                disabled: isBusy,
                type: "submit"
            })
        ],
        [isBusy]
    );

    return Div(
        { className: "card shadow-sm p-4 security-form" },
        message
            ? Div({ className: "alert alert-warning py-2" }, message)
            : null,
        Form({
            data: credentials,
            main: [
                Input({
                    label: "Person Id:",
                    min: "1",
                    name: "personId",
                    type: "number"
                }),
                Input({
                    label: "Password:",
                    name: "password",
                    type: "password"
                })
            ],
            actions,
            onDataChange: setCredentials,
            async onSubmit(event) {
                event.preventDefault();
                setIsBusy(true);
                setMessage("");

                try {
                    const session = await login(credentials);
                    props.onLogin?.(session);
                } catch {
                    setMessage("Login failed.");
                } finally {
                    setIsBusy(false);
                }
            }
        })
    );
};

export default Login;