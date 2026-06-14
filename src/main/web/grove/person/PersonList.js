import {
    Button,
    Page,
    showAppError,
    useCenterPanel
} from "../../grove_lib/GroveComponents.js";
import {
    createElement,
    useEffect,
    useMemo,
    useState
} from "../../grove_lib/GroveAdapter.js";
import { useAuth } from "../core/AppContext.js";
import PersonForm from "./PersonForm.js?v=dev-20260607-01";
import {
    createPerson,
    deletePersonById,
    findAllPersons,
    normalizePerson,
    updatePerson
} from "./PersonService.js";
import PersonTable from "./PersonTable.js";

const SUPER_ADMIN = "SUPER-ADMIN";
const ADMIN = "ADMIN";
const USER = "USER";

const samePerson = (left, right) => String(left || "") === String(right || "");
const roleOf = person => person?.role || USER;

const creatableRoles = actor => {
    const actorRole = roleOf(actor);

    if (actorRole === SUPER_ADMIN) {
        return [ADMIN, USER];
    }

    if (actorRole === ADMIN) {
        return [USER];
    }

    return [];
};

const canUpdatePerson = (actor, person) => {
    const actorRole = roleOf(actor);
    const targetRole = roleOf(person);

    if (actorRole === SUPER_ADMIN) {
        return samePerson(actor?.id, person?.id) || targetRole === ADMIN || targetRole === USER;
    }

    if (actorRole === ADMIN) {
        return targetRole === USER;
    }

    return actorRole === USER && samePerson(actor?.id, person?.id);
};

const canDeletePerson = (actor, person) => {
    const actorRole = roleOf(actor);
    const targetRole = roleOf(person);

    if (actorRole === SUPER_ADMIN) {
        return targetRole === ADMIN || targetRole === USER;
    }

    if (actorRole === ADMIN) {
        return targetRole === USER;
    }

    return false;
};

const canResetPassword = (actor, person) => {
    const actorRole = roleOf(actor);
    const targetRole = roleOf(person);

    if (actorRole === SUPER_ADMIN) {
        return targetRole === ADMIN || targetRole === USER;
    }

    if (actorRole === ADMIN) {
        return targetRole === USER;
    }

    return false;
};

const PersonList = () => {
    const centerPanel = useCenterPanel();
    const { authToken, loggedInUser } = useAuth();
    const [persons, setPersons] = useState([]);
    const [isBusy, setIsBusy] = useState(false);
    const canCreateRoles = creatableRoles(loggedInUser);

    const loadPersons = async () => {
        if (!authToken) {
            setPersons([]);
            return;
        }

        setIsBusy(true);

        try {
            const loadedPersons = await findAllPersons(authToken);

            setPersons(loadedPersons);
        } catch {
            showAppError("Unable to load persons from server.");
        } finally {
            setIsBusy(false);
        }
    };

    useEffect(() => {
        loadPersons();
    }, [authToken]);

    const savePerson = async (person, mode, id) => mode === "update"
        ? updatePerson(id, person, authToken)
        : createPerson(person, authToken);

    const submitPerson = async (person, mode, id) => {
        setIsBusy(true);

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
            : normalizePerson({ role: canCreateRoles[0] || USER });
        const id = normalizedPerson?.id;
        const isView = mode === "view";
        const canUpdate = mode === "add"
            ? canCreateRoles.length > 0
            : canUpdatePerson(loggedInUser, normalizedPerson);
        const canResetTargetPassword = mode === "update" && canResetPassword(loggedInUser, normalizedPerson);
        const formPerson =
            canResetTargetPassword && roleOf(loggedInUser) !== SUPER_ADMIN
                ? {
                    ...normalizedPerson,
                    passwordChangeRequired: true
                }
                : normalizedPerson;
        const roleOptions = mode === "add"
            ? canCreateRoles
            : roleOf(loggedInUser) === SUPER_ADMIN && !samePerson(loggedInUser?.id, normalizedPerson?.id)
                ? [ADMIN, USER]
                : [roleOf(normalizedPerson)];

        centerPanel?.pushPage({
            title: mode === "update"
                ? "Update"
                : mode === "view"
                    ? "View"
                    : "Add",
            content: createElement(
                PersonForm,
                {
                    isBusy,
                    canEditPasswordChangeRequired: mode === "add"
                        ? roleOf(loggedInUser) === SUPER_ADMIN
                        : roleOf(loggedInUser) === SUPER_ADMIN && canResetTargetPassword,
                    canResetPassword: canResetTargetPassword,
                    mode,
                    person: formPerson,
                    readOnly: isView || !canUpdate,
                    roleOptions: roleOptions.map(role => ({ label: role, value: role })),
                    roleReadOnly: roleOptions.length <= 1,
                    showSubmit: !isView && canUpdate,
                    onSubmit(formPerson) {
                        return submitPerson(formPerson, mode, id);
                    }
                }
            )
        });
    };

    const deletePerson = async person => {
        if (!person.id) {
            showAppError("Unable to delete person without id.");
            return;
        }

        setIsBusy(true);

        try {
            await deletePersonById(person.id, authToken);
            await loadPersons();
        } catch {
        } finally {
            setIsBusy(false);
        }
    };
    const toolbarActions = useMemo(
        () => [
            Button({
                icon: "person-plus",
                label: "Add Person",
                look: "pm",
                name: "addPerson",
                type: "button",
                disabled: isBusy || canCreateRoles.length === 0,
                onClick() {
                    openPersonForm("add");
                }
            }),
            Button({
                icon: "arrow-clockwise",
                label: null,
                look: "sc",
                name: "refreshPersons",
                title: "Refresh persons",
                type: "button",
                disabled: isBusy,
                onClick: loadPersons
            })
        ],
        [isBusy, authToken, loggedInUser]
    );

    return Page({
        layout: "fill",
        content: PersonTable({
            persons,
            onDelete: deletePerson,
            onUpdate: person => openPersonForm("update", person),
            onView: person => openPersonForm("view", person),
            canDelete: person => canDeletePerson(loggedInUser, person),
            canUpdate: person => canUpdatePerson(loggedInUser, person),
            isBusy,
            toolbarActions
        })
    });
};

export default PersonList;
