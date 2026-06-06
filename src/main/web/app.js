import {
    AppShell,
    createElement,
    createRoot,
    Footer,
    Header,
    openAppPage,
    useState
} from "./lib/Grove.js";
import { AppContext } from "./modules/application/AppContext.js";
import PersonList from "./modules/person/PersonList.js";
import ChangePass from "./modules/security/ChangePass.js";
import Login from "./modules/security/Login.js";
import { logout as logoutSession } from "./modules/security/SecurityService.js";
import TaskList from "./modules/task/TaskList.js";

const App = () => {
    const [authToken, setAuthToken] = useState(null);
    const [loggedInPerson, setLoggedInPerson] = useState(null);
    const loggedIn = Boolean(authToken && loggedInPerson);
    const pages = [
        { component: PersonList, key: "persons", label: "Persons" },
        { component: TaskList, key: "tasks", label: "Tasks" },
        {
            component: Login,
            auth: false,
            key: "login",
            label: "Login",
            menu: false,
            props: {
                onLogin(session) {
                    setAuthToken(session.token);
                    setLoggedInPerson(session.person);
                    openAppPage("persons");
                }
            }
        },
        {
            component: ChangePass,
            key: "changePass",
            label: "Change Password",
            menu: false,
            props: {
                authToken
            }
        }
    ];
    const avatarMenu = [
        loggedIn
            ? {
                icon: "key",
                key: "changePass",
                label: "Change Password",
                onClick() {
                    openAppPage("changePass");
                }
            }
            : {
                icon: "box-arrow-in-right",
                key: "login",
                label: "Login",
                onClick() {
                    openAppPage("login");
                }
            },
        loggedIn
            ? {
                icon: "box-arrow-right",
                key: "logout",
                label: "Logout",
                async onClick() {
                    try {
                        await logoutSession(authToken);
                    } catch {
                    } finally {
                        setAuthToken(null);
                        setLoggedInPerson(null);
                        openAppPage("persons");
                    }
                }
            }
            : null
    ].filter(Boolean);

    return createElement(
        AppContext.Provider,
        {
            value: {
                authToken,
                loggedInPerson
            }
        },
        AppShell({
            authenticated: loggedIn,
            initialPage: loggedIn ? "persons" : "login",
            loginPageKey: "login",
            pages,
            Header: Header({
                avatar: loggedInPerson?.photo || undefined,
                avatarMenu,
                title: "Jakarta Data Person",
                subTitle: loggedInPerson
                    ? `Signed in as ${loggedInPerson.name}`
                    : "Person and task management"
            }),
            Footer: Footer({
                brand: "Jakarta Data Person"
            })
        })
    );
};

createRoot(document.getElementById("app")).render(createElement(App));
