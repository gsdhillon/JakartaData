import {
    Button,
    Form,
    FormHeader,
    Input,
    Page
} from "../../../grove_lib/GroveComponents.js";
import {
    useMemo,
    useState
} from "../../../grove_lib/GroveAdapter.js";
import { useAppContext } from "../AppContext.js";
import { login } from "./SecurityService.js";

const base64UrlDecode = value => {
    const normalized = value
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padded = normalized.padEnd(
        normalized.length + ((4 - normalized.length % 4) % 4),
        "="
    );

    return atob(padded);
};

const jwtExpiryOf = token => {
    try {
        const payload = JSON.parse(base64UrlDecode(token.split(".")[1] || ""));

        return payload.exp
            ? new Date(payload.exp * 1000).toISOString()
            : null;
    } catch {
        return null;
    }
};

const loginInfoOf = session => {
    const userInfo = session.userInfo || session.user || null;

    return {
        avatarThumbnail:
            session.avatarThumbnail ||
            session.thumbnail ||
            userInfo?.avatarThumbnail ||
            userInfo?.thumbnail ||
            userInfo?.photo ||
            null,
        loginTime: new Date().toISOString(),
        name:
            session.name ||
            userInfo?.name ||
            userInfo?.userName ||
            userInfo?.username ||
            "",
        role:
            session.role ||
            userInfo?.role ||
            "",
        tokenExpiresAt: session.tokenExpiresAt || jwtExpiryOf(session.token),
        userInfo
    };
};

const Login = props => {
    const { loginSession } = useAppContext();
    const [credentials, setCredentials] = useState({
        loginId: "",
        password: ""
    });
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

    return Page({
        layout: "center",
        content: Form({
            centerActions: false,
            className: "grove-auth-form",
            data: credentials,
            layout: "center",
            main: [
            FormHeader({
                icon: "box-arrow-in-right",
                title: "Login"
            }),
                Input({
                    label: "Login ID:",
                    name: "loginId",
                    type: "text"
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

                try {
                    const session = await login(credentials);
                    loginSession(session, loginInfoOf(session));
                    if (typeof props.onLogin === "function") {
                        props.onLogin(session);
                    }
                } catch {
                } finally {
                    setIsBusy(false);
                }
            }
        })
    });
};

export default Login;
