import {
    Button,
    createElement,
    Div,
    useCenterPanel,
    useEffect,
    useState
} from "../../lib/Grove.js";
import PersonForm from "./PersonForm.js";
import {
    createPerson,
    deletePersonById,
    findAllPersons,
    normalizePerson,
    updatePerson
} from "./PersonService.js";
import PersonTable from "./PersonTable.js";

const PersonList = () => {
    const centerPanel = useCenterPanel();
    const [persons, setPersons] = useState([]);
    const [statusMessage, setStatusMessage] = useState("Loading persons...");
    const [isBusy, setIsBusy] = useState(false);

    const loadPersons = async () => {
        setIsBusy(true);
        setStatusMessage("Loading persons...");

        try {
            const loadedPersons = await findAllPersons();

            setPersons(loadedPersons);
            setStatusMessage("");
        } catch {
            setStatusMessage("Unable to load persons from server.");
        } finally {
            setIsBusy(false);
        }
    };

    useEffect(() => {
        loadPersons();
    }, []);

    const savePerson = async (person, mode, id) => {
        return mode === "update"
            ? updatePerson(id, person)
            : createPerson(person);
    };

    const submitPerson = async (person, mode, id) => {
        setIsBusy(true);
        setStatusMessage("");

        try {
            await savePerson(person, mode, id);
            await loadPersons();
            centerPanel?.goBack();
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const openPersonForm = (mode, person = null) => {
        const normalizedPerson = person
            ? normalizePerson(person)
            : null;
        const id = normalizedPerson?.id;

        centerPanel?.pushPage({
            title: mode === "update" ? "Update" : "Add",
            content: createElement(
                PersonForm,
                {
                    isBusy,
                    mode,
                    person: normalizedPerson,
                    onSubmit(formPerson) {
                        return submitPerson(formPerson, mode, id);
                    }
                }
            )
        });
    };

    const deletePerson = async person => {
        if (!person.id) {
            setStatusMessage("Unable to delete person without id.");
            return;
        }

        setIsBusy(true);
        setStatusMessage("");

        try {
            await deletePersonById(person.id);
            await loadPersons();
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    return Div(
        { className: "card shadow-sm p-4 demo person-list-view" },
        statusMessage
            ? Div(
                { className: "text-muted align-self-stretch person-status" },
                statusMessage
            )
            : null,
        PersonTable({
            persons,
            onDelete: deletePerson,
            onUpdate: person => openPersonForm("update", person),
            isBusy
        }),
        Div(
            { className: "person-list-actions" },
            Button({
                label: "Add Person",
                look: "pm",
                name: "addPerson",
                type: "button",
                disabled: isBusy,
                onClick() {
                    openPersonForm("add");
                }
            }),
            Button({
                label: "Refresh",
                look: "sc",
                name: "refreshPersons",
                type: "button",
                disabled: isBusy,
                onClick: loadPersons
            })
        )
    );
};

export default PersonList;
