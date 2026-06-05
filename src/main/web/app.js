import {
    AppShell,
    createElement,
    createRoot,
    Div,
    Footer,
    Header,
    Menu,
    REST,
    useState
} from "./lib/Grove.js";
import { AppContext } from "./modules/application/AppContext.js";
import PersonController from "./modules/person/PersonController.js";
import TaskController from "./modules/task/TaskController.js";

const personsApiUrl = "./api/persons";

const requestJson = async (url, options = {}) => {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(response.statusText || "Request failed");
    }

    return response.status === 204
        ? null
        : response.json();
};

const App = () => {
    const [activeView, setActiveView] = useState("persons");
    const [previousCenterView, setPreviousCenterView] = useState("persons");
    const [themeMode, setThemeMode] = useState("light");
    const [loggedInPerson, setLoggedInPerson] = useState(null);
    const [draftUserId, setDraftUserId] = useState(1);
    const [loginMessage, setLoginMessage] = useState("");
    const [loginBusy, setLoginBusy] = useState(false);
    const Center = Div(
        { className: "app-center" },
        activeView === "persons"
            ? createElement(PersonController)
            : activeView === "tasks"
                ? createElement(TaskController)
            : activeView === "rest"
                ? createElement(
                    REST,
                    {
                        embedded: true,
                        onClose() {
                            setActiveView(previousCenterView || "persons");
                        }
                    }
                )
            : Div(
                { className: "app-empty-center" },
                "Select a menu item."
            )
    );
    const showCenterView = view => {
        setActiveView(view);
    };
    const showRestCenter = () => {
        if (activeView !== "rest") {
            setPreviousCenterView(activeView);
        }

        setActiveView("rest");
    };

    return createElement(
        AppContext.Provider,
        {
            value: {
                loggedInPerson
            }
        },
        AppShell({
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
                        const person = await requestJson(`${personsApiUrl}/${nextUserId}`);

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
                        active: activeView === "persons",
                        label: "Persons",
                        onClick() {
                            showCenterView("persons");
                        }
                    },
                    {
                        active: activeView === "tasks",
                        label: "Tasks",
                        onClick() {
                            showCenterView("tasks");
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
