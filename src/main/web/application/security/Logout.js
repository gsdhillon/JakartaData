import {
    Form,
    FormHeader,
    Page,
    Text,
    useEffect
} from "../../lib/Grove.js";
import { useAppContext } from "../AppContext.js";

const Logout = () => {
    const { loggedIn, logoutSession } = useAppContext();

    useEffect(() => {
        if (loggedIn) {
            logoutSession({ resetPage: false });
        }
    }, [loggedIn, logoutSession]);

    return Page(
        { layout: "center" },
        Form({
            centerActions: false,
            className: "grove-auth-form",
            layout: "center",
            main: [
                FormHeader({
                    icon: "box-arrow-right",
                    title: "Logout"
                }),
                Text({
                    look: "body",
                    value: "Thanks"
                })
            ]
        })
    );
};

export default Logout;
