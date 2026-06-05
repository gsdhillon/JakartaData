import {
    Button,
    Form,
    Input,
    Instant,
    Label,
    LocalDateTime,
    TextArea,
    useState
} from "../../lib/Grove.js";

const createEmptyTask = loggedInUserId => ({
    id: "",
    taskName: "",
    taskDesc: "",
    addBy: loggedInUserId,
    assignedTo: "",
    deadLine: null,
    createdOn: null,
    completedOn: null
});

const normalizeTask = (task, loggedInUserId) => ({
    ...createEmptyTask(loggedInUserId),
    ...(task || {}),
    id: task?.id ?? "",
    addBy: task?.addBy ?? loggedInUserId,
    assignedTo: task?.assignedTo ?? ""
});

const TaskForm = props => {
    const [task, setTask] = useState(
        normalizeTask(props.task, props.loggedInUserId)
    );
    const showSubmit = props.showSubmit !== false;
    const showMarkCompleted = props.showMarkCompleted === true;

    return Form({
        className: "task-form",
        data: task,
        main: [
            Input({
                label: "Id:",
                name: "id",
                readOnly: true,
                type: "text"
            }),
            Input({
                label: "Task Name:",
                maxLength: 50,
                minLength: 5,
                name: "taskName",
                readOnly: props.readOnly,
                type: "text"
            }),
            Label(
                { className: "grove-field-label" },
                "Task Desc:",
                TextArea({
                    maxLength: 500,
                    minLength: 5,
                    name: "taskDesc",
                    readOnly: props.readOnly,
                    rows: 5
                })
            ),
            Input({
                label: "Add By:",
                name: "addBy",
                readOnly: true,
                type: "number"
            }),
            Input({
                label: "Assigned To:",
                min: "1",
                name: "assignedTo",
                readOnly: props.readOnly,
                type: "number"
            }),
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
        actions: [
            showSubmit
                ? Button({
                    label: "Submit",
                    look: "pm",
                    name: "submit",
                    disabled: props.isBusy || props.readOnly,
                    type: "submit"
                })
                : null,
            showMarkCompleted
                ? Button({
                    label: "Mark Completed",
                    look: "ut",
                    name: "completeTask",
                    disabled: props.isBusy,
                    type: "button",
                    onClick() {
                        props.onMarkCompleted?.({ ...task });
                    }
                })
                : null,
            Button({
                label: "Close",
                look: "sc",
                name: "close",
                disabled: props.isBusy,
                type: "button",
                onClick: props.onClose
            })
        ],
        onDataChange: setTask,
        onSubmit(event) {
            event.preventDefault();
            props.onSubmit?.({ ...task });
        }
    });
};

export default TaskForm;
