import {
    createElement,
    Div,
    Form,
    FormHeader,
    Page,
    Text,
    useEffect
} from "../../../grove_lib/GroveComponents.js";
import { useAppContext } from "../AppContext.js";
import { logout } from "./SecurityService.js";

const Logout = () => {
    const { authToken, loggedIn, logoutSession } = useAppContext();

    useEffect(() => {
        if (loggedIn) {
            logout(authToken)
                .catch(() => null)
                .finally(() => logoutSession({ resetPage: false }));
        }
    }, [authToken, loggedIn, logoutSession]);

    return Page(
        { layout: "center" },
        Form({
            centerActions: false,
            className: "grove-auth-form",
            layout: "center",
            main: [
                FormHeader({
                    icon: "box-arrow-right",
                    title: "Logged Out"
                }),
                Div(
                    { className: "grove-auth-caption" },
                    createElement("i", {
                        "aria-hidden": "true",
                        className: "bi bi-check-circle"
                    }),
                    Text({
                        look: "caption",
                        value: "Thanks"
                    })
                ),
                createElement(
                    "a",
                    {
                        className: "btn btn-link fw-bold",
                        href: "#login"
                    },
                    "Sign in again"
                )
            ]
        })
    );
};

export default Logout;
