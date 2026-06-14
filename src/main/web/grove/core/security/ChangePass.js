import {
    Button,
    Form,
    FormHeader,
    Input,
    Page,
    showAppError
} from "../../../grove_lib/GroveComponents.js";
import {
    useMemo,
    useState
} from "../../../grove_lib/GroveAdapter.js";
import { changePassword } from "./SecurityService.js";

const ChangePass = props => {
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
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

    return Page({
        layout: "center",
        content: Form({
            centerActions: false,
            className: "grove-auth-form",
            data: passwords,
            layout: "center",
            main: [
            FormHeader({
                icon: "key",
                title: "Change Password"
            }),
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
                    showAppError("New password and confirm password do not match.");
                    return;
                }

                setIsBusy(true);

                let redirected = false;

                try {
                    await changePassword(props.authToken, {
                        currentPassword: passwords.currentPassword,
                        newPassword: passwords.newPassword
                    });

                    showAppError("Password changed.");

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
                } catch {
                    showAppError("Unable to change password.");
                } finally {
                    if (!redirected) {
                        setIsBusy(false);
                    }
                }
            }
        })
    });
};

export default ChangePass;
