import {
    AppShell,
    createElement,
    createRoot,
    Div,
    Footer,
    Header,
    HashRouter,
    Menu,
    navigateHash,
    REST,
    useHashPath,
    useState
} from "./lib/Grove.js";
import { AppContext } from "./modules/application/AppContext.js";
import PersonList from "./modules/person/PersonList.js";
import { findPersonById } from "./modules/person/PersonService.js";
import TaskController from "./modules/task/TaskController.js";

const App = () => {
    const currentPath = useHashPath();
    const [previousCenterPath, setPreviousCenterPath] = useState("/persons");
    const [themeMode, setThemeMode] = useState("light");
    const [loggedInPerson, setLoggedInPerson] = useState(null);
    const [draftUserId, setDraftUserId] = useState(1);
    const [loginMessage, setLoginMessage] = useState("");
    const [loginBusy, setLoginBusy] = useState(false);
    const routes = [
        {
            element: PersonList,
            path: "/"
        },
        {
            element: PersonList,
            path: "/persons"
        },
        {
            element: TaskController,
            path: "/tasks"
        },
        {
            element: createElement(
                REST,
                {
                    embedded: true,
                    onClose() {
                        navigateHash(previousCenterPath || "/persons");
                    }
                }
            ),
            path: "/rest"
        }
    ];
    const centerTitle =
        currentPath === "/tasks"
            ? "Tasks"
            : currentPath === "/rest"
                ? "REST"
                : "Persons";
    const Center = Div(
        { className: "app-center" },
        createElement(
            HashRouter,
            {
                defaultPath: "/persons",
                fallback: PersonList,
                routes
            }
        )
    );
    const showCenterView = path => {
        navigateHash(path);
    };
    const showRestCenter = () => {
        if (currentPath !== "/rest") {
            setPreviousCenterPath(
                currentPath === "/"
                    ? "/persons"
                    : currentPath
            );
        }

        navigateHash("/rest");
    };

    return createElement(
        AppContext.Provider,
        {
            value: {
                loggedInPerson
            }
        },
        AppShell({
            centerTitle,
            themeMode,
            Header: Header({
                avatar: loggedInPerson?.photo || undefined,
                title: "Jakarta Data Person",
                subTitle: "Person and task management",
                userId: draftUserId,
                onUserIdChange(value) {
                    setDraftUserId(value);
                },
                loginDisabled: loginBusy,
                async onLogin() {
                    const nextUserId = Number(draftUserId);

                    if (Number.isNaN(nextUserId) || nextUserId <= 0) {
                        setLoginMessage("Enter a valid user id.");
                        return;
                    }

                    setLoginBusy(true);
                    setLoginMessage("");

                    try {
                        const person = await findPersonById(nextUserId);

                        setLoggedInPerson(person);
                        setDraftUserId(person.id ?? nextUserId);
                        setLoginMessage("");
                    } catch {
                        setLoginMessage(`Unable to login with user id ${nextUserId}.`);
                    } finally {
                        setLoginBusy(false);
                    }
                }
            }),
            Menu: Menu({
                links: [
                    {
                        active: currentPath === "/" || currentPath === "/persons",
                        href: "#/persons",
                        label: "Persons",
                        onClick() {
                            showCenterView("/persons");
                        }
                    },
                    {
                        active: currentPath === "/tasks",
                        href: "#/tasks",
                        label: "Tasks",
                        onClick() {
                            showCenterView("/tasks");
                        }
                    }
                ]
            }),
            Center,
            Footer: Footer({
                brand: loginMessage || loggedInPerson
                    ? `Jakarta Data Person${loggedInPerson ? ` | ${loggedInPerson.name}` : ""}${loginMessage ? ` | ${loginMessage}` : ""}`
                    : "Jakarta Data Person",
                onLogoClick: showRestCenter,
                themeMode,
                onThemeToggle() {
                    setThemeMode(currentTheme =>
                        currentTheme === "dark"
                            ? "light"
                            : "dark"
                    );
                }
            })
        })
    );
};

createRoot(document.getElementById("app")).render(createElement(App));
