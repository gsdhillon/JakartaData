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
import PersonController from "./modules/person/PersonController.js";

const App = () => {
    const [activeView, setActiveView] = useState("persons");
    const [themeMode, setThemeMode] = useState("light");
    const Center = Div(
        { className: "app-center" },
        activeView === "persons"
            ? createElement(PersonController)
            : Div(
                { className: "app-empty-center" },
                "Select a menu item."
            )
    );

    return AppShell({
        themeMode,
        Header: Header({
            title: "Jakarta Data Person",
            subTitle: "Person management",
            logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23eff6ff'/%3E%3Cpath d='M18 44c2-8 8-12 14-12s12 4 14 12' fill='none' stroke='%232563eb' stroke-width='5' stroke-linecap='round'/%3E%3Ccircle cx='32' cy='22' r='8' fill='%232563eb'/%3E%3C/svg%3E",
            avtar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='24' fill='%23dbeafe'/%3E%3Ccircle cx='24' cy='19' r='7' fill='%231e40af'/%3E%3Cpath d='M12 39c2-8 7-12 12-12s10 4 12 12' fill='%231e40af'/%3E%3C/svg%3E"
        }),
        Menu: Menu({
            links: [
                {
                    active: activeView === "persons",
                    label: "Persons",
                    onClick() {
                        setActiveView("persons");
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
    });
};

createRoot(document.getElementById("app")).render(createElement(App));
