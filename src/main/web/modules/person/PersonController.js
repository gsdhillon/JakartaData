import {
    Button,
    createElement,
    Div,
    useEffect,
    useState
} from "../../lib/Grove.js";
import PersonForm from "./PersonForm.js";
import PersonTable from "./PersonTable.js";

const personsApiUrl = "./api/persons";

const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        throw new Error(response.statusText || "Request failed");
    }

    return response.status === 204
        ? null
        : response.json();
};

const createEmptyPerson = () => ({
    id: "",
    name: "",
    designation: "",
    dob: null,
    appointmentAt: null,
    updatedAt: null,
    email: "",
    gender: "",
    mobileNo: "",
    photo: ""
});

const normalizePerson = person => ({
    ...createEmptyPerson(),
    ...(person || {}),
    id: person?.id ?? ""
});

const personPayload = person => {
    const payload = normalizePerson(person);

    if (payload.id === "") {
        delete payload.id;
    }

    delete payload.updatedAt;

    return payload;
};

const PersonController = () => {
    const [persons, setPersons] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedPersonId, setSelectedPersonId] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Loading persons...");
    const [isBusy, setIsBusy] = useState(false);
    const [mode, setMode] = useState("list");

    const loadPersons = async () => {
        setIsBusy(true);
        setStatusMessage("Loading persons...");

        try {
            const loadedPersons = await requestJson(personsApiUrl);

            setPersons((loadedPersons || []).map(normalizePerson));
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

    const showAddPersonForm = () => {
        setSelectedPerson(null);
        setSelectedPersonId(null);
        setMode("form");
    };

    const showUpdatePersonForm = person => {
        setSelectedPerson(normalizePerson(person));
        setSelectedPersonId(person.id);
        setMode("form");
    };

    const savePerson = async person => {
        const id = selectedPersonId ?? person.id;
        const isUpdate = id !== null && id !== undefined && id !== "";

        return requestJson(
            isUpdate
                ? `${personsApiUrl}/${id}`
                : personsApiUrl,
            {
                method: isUpdate ? "PUT" : "POST",
                body: JSON.stringify(personPayload(person))
            }
        );
    };

    const submitPerson = async person => {
        setIsBusy(true);
        setStatusMessage("");

        try {
            await savePerson(person);
            await loadPersons();
            setSelectedPerson(null);
            setSelectedPersonId(null);
            setMode("list");
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const deletePerson = async person => {
        if (!person.id) {
            setStatusMessage("Unable to delete person without id.");
            return;
        }

        setIsBusy(true);
        setStatusMessage("");

        try {
            await requestJson(
                `${personsApiUrl}/${person.id}`,
                { method: "DELETE" }
            );
            await loadPersons();
            setSelectedPerson(null);
            setSelectedPersonId(null);
        } catch {
        } finally {
            setIsBusy(false);
        }
    };

    const closePersonForm = () => {
        setSelectedPerson(null);
        setSelectedPersonId(null);
        setMode("list");
    };

    if (mode === "form") {
        return Div(
            { className: "card shadow-sm p-4 demo" },
            createElement(
                PersonForm,
                {
                    person: selectedPerson,
                    onClose: closePersonForm,
                    isBusy,
                    onSubmit: submitPerson
                }
            )
        );
    }

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
            onUpdate: showUpdatePersonForm,
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
                onClick: showAddPersonForm
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

export default PersonController;
