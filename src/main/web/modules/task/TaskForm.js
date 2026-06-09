import {
    Button,
    createElement,
    Div,
    Form,
    Input,
    Instant,
    LocalDateTime,
    Page,
    Photo,
    showAppError,
    TextArea,
    useEffect,
    useMemo,
    useState
} from "../../lib/Grove.js";
import PersonTable from "../person/PersonTable.js";
import {
    findAllPersons,
    findPersonById
} from "../person/PersonService.js";
import { normalizeTask } from "./TaskService.js";

const PickPersonPage = props =>
    Page(
        { layout: "fill" },
        createElement(
            PersonTable,
            {
                defaultActions: false,
                isBusy: false,
                persons: props.persons,
                title: "Pick Person",
                renderActions: (person, index) => [
                    Button({
                        id: `pickPerson-${index}`,
                        icon: "check2-circle",
                        label: "Pick",
                        look: "pm",
                        name: "pickPerson",
                        type: "button",
                        onClick() {
                            props.onPick?.(person);
                        }
                    })
                ]
            }
        )
    );

const TaskForm = props => {
    const centerPanel = props.centerPanel;
    const [task, setTask] = useState(
        normalizeTask(props.task, props.loggedInUserId)
    );
    const [assignedPerson, setAssignedPerson] = useState(props.assignedPerson || null);
    const [pickerBusy, setPickerBusy] = useState(false);
    const showSubmit = props.showSubmit !== false;
    const pickPerson = person => {
        const pickedTask = {
            ...task,
            assignedTo: person.id
        };

        setAssignedPerson(person);
        centerPanel?.updatePreviousPage?.(page => ({
            ...page,
            content: createElement(TaskForm, {
                ...props,
                assignedPerson: person,
                task: pickedTask
            })
        }));
        setTask(currentTask => ({
            ...currentTask,
            assignedTo: person.id
        }));
        centerPanel?.goBack();
    };
    useEffect(() => {
        const assignedTo = task.assignedTo;

        if (!assignedTo || !props.authToken) {
            setAssignedPerson(null);
            return undefined;
        }

        if (String(assignedPerson?.id || "") === String(assignedTo)) {
            return undefined;
        }

        let cancelled = false;

        findPersonById(assignedTo, props.authToken)
            .then(person => {
                if (!cancelled) {
                    setAssignedPerson(person || null);
                }
            })
            .catch(error => {
                if (!cancelled) {
                    setAssignedPerson(null);
                    showAppError(error?.message
                        ? `Unable to load assigned person: ${error.message}`
                        : "Unable to load assigned person.");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [task.assignedTo, props.authToken]);
    const openPersonPicker = async () => {
        if (props.readOnly) {
            return;
        }

        if (!centerPanel) {
            showAppError("Unable to open picker because the center panel is not available.");
            return;
        }

        if (!props.authToken) {
            showAppError("Login token is missing. Please logout and login again.");
            return;
        }

        setPickerBusy(true);

        let persons = [];

        try {
            persons = await findAllPersons(props.authToken);
        } catch (error) {
            showAppError(error?.message
                ? `Unable to load persons for picker: ${error.message}`
                : "Unable to load persons for picker.");
            return;
        } finally {
            setPickerBusy(false);
        }

        centerPanel?.pushPage({
            title: "Pick Person",
            content: createElement(PickPersonPage, {
                persons,
                onPick: pickPerson
            })
        });
    };
    const actions = useMemo(
        () => [
            showSubmit
                ? Button({
                    icon: "check2-circle",
                    label: props.mode === "update" ? "Update" : "Submit",
                    look: "pm",
                    name: "submit",
                    disabled: props.isBusy || props.readOnly,
                    type: "submit"
                })
                : null,
            Button({
                icon: "x-lg",
                label: "Close",
                look: "sc",
                name: "close",
                disabled: props.isBusy,
                type: "button",
                onClick: props.onClose
            })
        ],
        [
            showSubmit,
            props.isBusy,
            props.readOnly,
            props.onClose,
            task
        ]
    );

    return Page(
        { layout: "fill" },
        Form({
            data: task,
            layout: "stack",
            main: [
                Input({
                    label: "Id:",
                    name: "id",
                    readOnly: true,
                    type: "text"
                }),
                Input({
                    label: "Task Name:",
                    name: "taskName",
                    readOnly: props.readOnly,
                    type: "text"
                }),
                TextArea({
                    label: "Task Desc:",
                    name: "taskDesc",
                    readOnly: props.readOnly,
                    rows: 5
                }),
                Input({
                    label: "Add By:",
                    name: "addBy",
                    readOnly: true,
                    type: "number"
                }),
                Div(
                    { className: "task-person-picker" },
                    Input({
                        label: "Assigned To:",
                        name: "assignedTo",
                        readOnly: props.readOnly,
                        type: "number"
                    }),
                    Button({
                        icon: "person-check",
                        label: pickerBusy ? "Loading Persons" : "Pick Person",
                        look: "sc",
                        name: "pickAssignedPerson",
                        disabled: props.readOnly || pickerBusy || !props.authToken,
                        type: "button",
                        onClick: openPersonPicker
                    })
                ),
                LocalDateTime({
                    label: "Deadline:",
                    name: "deadLine",
                    readOnly: props.readOnly
                }),
                Instant({
                    label: "Created On:",
                    name: "createdOn",
                    readOnly: true
                }),
                Instant({
                    label: "Completed On:",
                    name: "completedOn",
                    readOnly: true
                })
            ],
            aside: Photo({
                hideButtons: true,
                label: "Assigned Person",
                person: assignedPerson,
                personName: assignedPerson
                    ? assignedPerson.name
                    : task.assignedTo
                        ? `Person ${task.assignedTo}`
                        : ""
            }),
            actions,
            onDataChange(updater) {
                setTask(currentTask => {
                    const nextTask = typeof updater === "function"
                        ? updater(currentTask)
                        : updater;

                    if (String(nextTask.assignedTo || "") !== String(currentTask.assignedTo || "")) {
                        setAssignedPerson(null);
                    }

                    return nextTask;
                });
            },
            onSubmit(event) {
                event.preventDefault();
                props.onSubmit?.({ ...task });
            }
        })
    );
};

export default TaskForm;
