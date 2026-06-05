import {
    AppShell,
    createElement,
    createRoot,
    Div,
    Footer,
    Header,
    Menu,
    useState
} from "./lib/Grove.js";
import { AppContext } from "./modules/application/AppContext.js";
import PersonController from "./modules/person/PersonController.js";
import TaskController from "./modules/task/TaskController.js";

const App = () => {
    const [activeView, setActiveView] = useState("persons");
    const [themeMode, setThemeMode] = useState("light");
    const [loggedInUserId, setLoggedInUserId] = useState(1);
    const [draftUserId, setDraftUserId] = useState(1);
    const Center = Div(
        { className: "app-center" },
        activeView === "persons"
            ? createElement(PersonController)
            : activeView === "tasks"
                ? createElement(TaskController)
            : Div(
                { className: "app-empty-center" },
                "Select a menu item."
            )
    );

    return createElement(
        AppContext.Provider,
        {
            value: {
                loggedInUserId
            }
        },
        AppShell({
            themeMode,
            Header: Header({
                title: "Jakarta Data Person",
                subTitle: "Person and task management",
                userId: draftUserId,
                onUserIdChange(value) {
                    setDraftUserId(value);
                },
                onLogin() {
                    const nextUserId = Number(draftUserId);

                    if (!Number.isNaN(nextUserId) && nextUserId > 0) {
                        setLoggedInUserId(nextUserId);
                        setDraftUserId(nextUserId);
                    }
                }
            }),
            Menu: Menu({
                links: [
                    {
                        active: activeView === "persons",
                        label: "Persons",
                        onClick() {
                            setActiveView("persons");
                        }
                    },
                    {
                        active: activeView === "tasks",
                        label: "Tasks",
                        onClick() {
                            setActiveView("tasks");
                        }
                    }
                ]
            }),
            Center,
            Footer: Footer({
                brand: "Jakarta Data Person",
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
