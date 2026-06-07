import {
    Alert,
    Button,
    Card,
    Form,
    FormHeader,
    Input,
    Page,
    useMemo,
    useState
} from "../../lib/Grove.js";
import { changePassword } from "./SecurityService.js";

const ChangePass = props => {
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [message, setMessage] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const actions = useMemo(
        () => [
            Button({
                icon: "key",
                label: isBusy ? "Saving" : "Change Password",
                look: "pm",
                name: "changePassword",
                disabled: isBusy || !props.authToken,
                type: "submit"
            })
        ],
        [isBusy, props.authToken]
    );

    return Page(
        { layout: "center" },
        Card(
            { kind: "login" },
            FormHeader({
                icon: "key",
                title: "Change Password"
            }),
            !props.authToken
                ? Alert({ look: "info", value: "Login before changing password." })
                : null,
            message
                ? Alert({ look: "warning", value: message })
                : null,
            Form({
                centerActions: false,
                data: passwords,
                main: [
                    Input({
                        label: "Current Password:",
                        name: "currentPassword",
                        type: "password"
                    }),
                    Input({
                        label: "New Password:",
                        name: "newPassword",
                        type: "password"
                    }),
                    Input({
                        label: "Confirm Password:",
                        name: "confirmPassword",
                        type: "password"
                    })
                ],
                actions,
                onDataChange: setPasswords,
                async onSubmit(event) {
                    event.preventDefault();

                    if (passwords.newPassword !== passwords.confirmPassword) {
                        setMessage("New password and confirm password do not match.");
                        return;
                    }

                    setIsBusy(true);
                    setMessage("");

                    let redirected = false;

                    try {
                        await changePassword(props.authToken, {
                            currentPassword: passwords.currentPassword,
                            newPassword: passwords.newPassword
                        });

                        if (props.onPasswordChanged) {
                            redirected = true;
                            props.onPasswordChanged();
                            return;
                        }

                        setPasswords({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: ""
                        });
                        setMessage("Password changed.");
                    } catch {
                        setMessage("Unable to change password.");
                    } finally {
                        if (!redirected) {
                            setIsBusy(false);
                        }
                    }
                }
            })
        )
    );
};

export default ChangePass;
