import {
    Button,
    Form,
    Input,
    Instant,
    LocalDateTime,
    Page,
    TextArea,
    useMemo,
    useState
} from "../../lib/Grove.js";
import { normalizeTask } from "./TaskService.js";

const TaskForm = props => {
    const [task, setTask] = useState(
        normalizeTask(props.task, props.loggedInUserId)
    );
    const showSubmit = props.showSubmit !== false;
    const showMarkCompleted = props.showMarkCompleted === true;
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
            showMarkCompleted
                ? Button({
                    icon: "check-circle",
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
            showMarkCompleted,
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
                Input({
                    label: "Assigned To:",
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
            actions,
            onDataChange: setTask,
            onSubmit(event) {
                event.preventDefault();
                props.onSubmit?.({ ...task });
            }
        })
    );
};

export default TaskForm;
