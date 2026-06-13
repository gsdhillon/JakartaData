import {
    Button,
    createElement,
    Div,
    Form,
    Input,
    Instant,
    LocalDateTime,
    Page,
    Select,
    showAppError,
    TextArea,
    useCallback,
    useCenterPanelActions,
    useEffect,
    useMemo,
    useState
} from "../../grove_lib/Grove.js";
import PersonTable from "../person/PersonTable.js";
import { findAllPersons } from "../person/PersonService.js";
import { normalizeTask } from "./TaskService.js";

const sameId = (left, right) => String(left || "") === String(right || "");

const personName = person =>
    person?.name || (person?.id ? `Person ${person.id}` : "Person");

const initials = person => String(person?.name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("") || "?";

const PersonThumb = props => {
    const person = props.person || {};

    return Div(
        { className: "task-person-thumb" },
        person.photo
            ? createElement(
                "img",
                {
                    alt: personName(person),
                    src: person.photo
                }
            )
            : initials(person)
    );
};

const formatActionOn = value => {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleString();
};

const selectedPersonIds = task =>
    (task.memberIds || [])
        .filter(id => id !== null && id !== undefined && id !== "")
        .map(Number)
        .filter(id => !Number.isNaN(id));

const selectedPersonsFrom = (persons, ids, existingPersons = []) =>
    ids.map(id =>
        persons.find(person => sameId(person.id, id)) ||
        existingPersons.find(person => sameId(person.id, id)) ||
        {
            id,
            name: `Person ${id}`,
            designation: "",
            photo: ""
        }
    );

const MemberListPage = props =>
    Page(
        { layout: "fill" },
        createElement(
            PersonTable,
            {
                // Keep PersonTable from publishing filter/export actions to the
                // CenterPanel toolbar here. Selection changes re-render this picker
                // frequently, and table-owned toolbar VNodes caused a render loop.
                centerActions: false,
                defaultActions: false,
                persons: props.persons || [],
                showExport: false,
                showToolbarUtilities: false,
                title: "Members"
            }
        )
    );

const PickPersonPage = props => {
    const [selectedIds, setSelectedIds] = useState(props.initialSelectedIds || []);
    const selectedSet = new Set(selectedIds.map(id => String(id)));
    const togglePerson = useCallback(person => {
        setSelectedIds(current => {
            const currentSet = new Set(current.map(id => String(id)));

            if (currentSet.has(String(person.id))) {
                return current.filter(id => !sameId(id, person.id));
            }

            return [...current, person.id];
        });
    }, []);
    const renderPersonActions = useCallback(
        person => [
            Button({
                className: "task-picker-select-button",
                icon: selectedSet.has(String(person.id)) ? "check-square" : "square",
                label: selectedSet.has(String(person.id)) ? "Selected" : "Select",
                look: selectedSet.has(String(person.id)) ? "pm" : "sc",
                name: "togglePerson",
                type: "button",
                onClick() {
                    togglePerson(person);
                }
            })
        ],
        [selectedIds, togglePerson]
    );
    const toolbarActions = useMemo(
        () => Div(
            { className: "grove-form-actions" },
            Button({
                icon: "check2-circle",
                label: "Done",
                look: "pm",
                name: "pickMembersDone",
                type: "button",
                onClick() {
                    props.onPick?.(selectedIds);
                }
            })
        ),
        [props.onPick, selectedIds]
    );

    useCenterPanelActions(toolbarActions);

    return Page(
        { layout: "fill" },
        createElement(
            PersonTable,
            {
                centerActions: false,
                defaultActions: false,
                isBusy: false,
                persons: props.persons,
                selectedPersonIds: selectedIds,
                selectionMode: "multiple",
                showExport: false,
                showSelectionColumn: false,
                showToolbarUtilities: false,
                title: "Pick Members",
                renderActions: renderPersonActions,
                onToggleSelected: togglePerson
            }
        )
    );
};

const ActionPanel = props => {
    const [draft, setDraft] = useState({
        status: "pending",
        desc: ""
    });
    const actions = props.actions || [];
    const canAdd = props.canAddActions && !props.isBusy;
    const statusOptions = props.isCompleted
        ? props.canReopenTask
            ? [{ label: "Reopen", value: "pending" }]
            : [{ label: "Completed", value: "completed" }]
        : [
            { label: "Pending", value: "pending" },
            { label: "Completed", value: "completed" }
        ];
    const actionStatus = statusOptions.some(option => option.value === draft.status)
        ? draft.status
        : statusOptions[0]?.value || "pending";

    return Div(
        { className: "task-actions-panel" },
        Div(
            { className: "task-actions-list" },
            actions.length
                ? actions.map(action =>
                    Div(
                        {
                            className: "task-action-message",
                            key: action.id || `${action.actionBy}-${action.actionOn}`
                        },
                        Div(
                            { className: "task-action-meta" },
                            PersonThumb({
                                person: action.actionByPerson
                            }),
                            createElement(
                                "span",
                                { className: "task-action-person" },
                                personName(action.actionByPerson)
                            ),
                            createElement(
                                "span",
                                { className: `task-action-status task-action-status-${action.status || "pending"}` },
                                action.status || "pending"
                            ),
                            createElement(
                                "span",
                                { className: "task-action-on" },
                                formatActionOn(action.actionOn)
                            )
                        ),
                        createElement(
                            "p",
                            { className: "task-action-desc" },
                            action.desc || ""
                        )
                    )
                )
                : Div({ className: "task-empty-note" }, "No actions added")
        ),
        Div(
            { className: "task-action-form" },
            TextArea({
                label: "Action:",
                readOnly: !canAdd,
                rows: 3,
                value: draft.desc,
                onChange(event) {
                    setDraft(current => ({
                        ...current,
                        desc: event.target.value
                    }));
                }
            }),
            Div(
                { className: "task-action-submit-row" },
                Select({
                    label: "Status:",
                    options: statusOptions,
                    placeholder: false,
                    disabled: !canAdd,
                    value: actionStatus,
                    onChange(event) {
                        setDraft(current => ({
                            ...current,
                            status: event.target.value
                        }));
                    }
                }),
                Button({
                    icon: "send",
                    label: "Add",
                    look: "pm",
                    name: "addTaskAction",
                    disabled: !canAdd || !draft.desc.trim(),
                    type: "button",
                    onClick: async () => {
                        const savedTask = await props.onAddAction?.({
                            ...draft,
                            status: actionStatus
                        });

                        if (savedTask) {
                            setDraft({
                                status: "pending",
                                desc: ""
                            });
                        }
                    }
                })
            )
        )
    );
};

const TaskForm = props => {
    const centerPanel = props.centerPanel;
    const normalizeFormTask = () => {
        const normalizedTask = normalizeTask(props.task, props.loggedInUserId);

        return {
            ...normalizedTask,
            creatorName: normalizedTask.creatorName || props.creatorPerson?.name || ""
        };
    };
    const [task, setTask] = useState(() => normalizeFormTask());
    const [members, setMembers] = useState(task.members || []);
    const [creator, setCreator] = useState(task.creator || props.creatorPerson || null);
    const showSubmit = props.showSubmit !== false;
    const hasSavedTask = Boolean(task.id);
    useEffect(() => {
        const nextTask = normalizeFormTask();

        setTask(nextTask);
        setMembers(nextTask.members || []);
        setCreator(nextTask.creator || props.creatorPerson || null);
    }, [props.task, props.creatorPerson, props.loggedInUserId]);
    const pickPersons = (persons, ids) => {
        const selectedPersons = selectedPersonsFrom(persons, ids, members);
        const memberSummary = selectedPersons
            .map(person => person.name || `Person ${person.id}`)
            .join(", ");
        const pickedTask = {
            ...task,
            memberIds: ids,
            members: selectedPersons,
            memberSummary
        };

        centerPanel?.updatePreviousPage?.(page => ({
            ...page,
            content: createElement(TaskForm, {
                ...props,
                members: selectedPersons,
                creatorPerson: creator,
                task: pickedTask
            })
        }));
        centerPanel?.goBack();
    };
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

        let persons = [];

        try {
            persons = await findAllPersons(props.authToken);
        } catch (error) {
            showAppError(error?.message
                ? `Unable to load persons for picker: ${error.message}`
                : "Unable to load persons for picker.");
            return;
        }

        centerPanel?.pushPage({
            title: "Pick Members",
            content: createElement(PickPersonPage, {
                initialSelectedIds: selectedPersonIds(task),
                persons,
                onPick(ids) {
                    pickPersons(persons, ids);
                }
            })
        });
    };
    const openMemberList = () => {
        if (!centerPanel) {
            showAppError("Unable to open members because the center panel is not available.");
            return;
        }

        centerPanel.pushPage({
            title: "Members",
            content: createElement(MemberListPage, {
                persons: members
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
            props.mode
        ]
    );
    const onAddAction = async action => {
        const savedTask = await props.onAddAction?.(action);

        if (savedTask) {
            const normalizedTask = normalizeTask(savedTask, props.loggedInUserId);

            setTask(normalizedTask);
            setMembers(normalizedTask.members || []);
            setCreator(normalizedTask.creator || creator);
        }

        return savedTask;
    };

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
                hasSavedTask
                    ? Input({
                        label: "Created By:",
                        name: "creatorName",
                        readOnly: true,
                        type: "text"
                    })
                    : null,
                Div(
                    { className: "task-assignee-picker" },
                    Input({
                        label: "Members:",
                        name: "memberSummary",
                        readOnly: true,
                        type: "text"
                    }),
                    Button({
                        icon: "people",
                        label: null,
                        look: "sc",
                        name: "viewMembers",
                        disabled: !members.length,
                        title: "View members",
                        type: "button",
                        onClick: openMemberList
                    }),
                    Button({
                        icon: "person-plus",
                        label: "Pick",
                        look: "sc",
                        name: "pickAssignedPerson",
                        disabled: props.readOnly || !props.authToken,
                        type: "button",
                        onClick: openPersonPicker
                    })
                ),
                LocalDateTime({
                    label: "Deadline:",
                    name: "deadLine",
                    readOnly: props.readOnly
                }),
                hasSavedTask
                    ? Instant({
                        label: "Created On:",
                        name: "createdOn",
                        readOnly: true
                    })
                    : null,
                hasSavedTask
                    ? Instant({
                        label: "Completed On:",
                        name: "completedOn",
                        readOnly: true
                    })
                    : null,
                hasSavedTask
                    ? Div(
                        { className: "task-form-actions-full" },
                        ActionPanel({
                            actions: task.actions,
                            canAddActions: props.canAddActions,
                            canReopenTask: props.canReopenTask,
                            isCompleted: Boolean(task.completedOn),
                            isBusy: props.isBusy,
                            onAddAction
                        })
                    )
                    : null
            ],
            actions,
            onDataChange(updater) {
                setTask(currentTask => {
                    const nextTask = typeof updater === "function"
                        ? updater(currentTask)
                        : updater;

                    return {
                        ...nextTask,
                        memberIds: selectedPersonIds(nextTask),
                        members
                    };
                });
            },
            onSubmit(event) {
                event.preventDefault();
                props.onSubmit?.({
                    ...task,
                    members,
                    memberIds: selectedPersonIds(task)
                });
            }
        })
    );
};

export default TaskForm;
