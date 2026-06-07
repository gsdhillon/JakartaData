import {
    Alert,
    Button,
    Form,
    Input,
    Instant,
    LocalDate,
    Page,
    Photo,
    Select,
    useMemo,
    useState
} from "../../lib/Grove.js";
import { OptBoolean } from "../../lib/comp/OptBoolean.js";
import { normalizePerson } from "./PersonService.js";

const PersonForm = props => {
    const [person, setPerson] = useState(
        normalizePerson(props.person)
    );
    const [message, setMessage] = useState("");
    const readOnly = props.readOnly === true;
    const isAdd = props.mode === "add";
    const actions = useMemo(
        () => [
            props.showSubmit === false
                ? null
                : Button({
                icon: props.mode === "update" ? "check2-circle" : "plus-circle",
                label: props.mode === "update" ? "Update" : "Submit",
                look: "pm",
                name: "submit",
                disabled: props.isBusy || readOnly,
                type: "submit"
            })
        ].filter(Boolean),
        [props.mode, props.isBusy, props.showSubmit, readOnly]
    );

    return Page(
        { layout: "fill" },
        message
            ? Alert({ look: "warning", value: message })
            : null,
        Form({
            data: person,
            editableFields: {
                id: false,
                updatedAt: false
            },
            hideNonEditableFields: isAdd,
            layout: "stack",
            main: [
                Input({
                    editable: false,
                    label: "Id:",
                    name: "id",
                    readOnly: true,
                    type: "text"
                }),
                Input({
                    label: "Name:",
                    name: "name",
                    readOnly,
                    type: "text"
                }),
                Input({
                    label: "Designation:",
                    name: "designation",
                    readOnly,
                    type: "text"
                }),
                LocalDate({
                    label: "DOB:",
                    name: "dob",
                    readOnly
                }),
                Instant({
                    editable: false,
                    label: "Updated At:",
                    name: "updatedAt",
                    readOnly: true
                }),
                Input({
                    autoComplete: "off",
                    label: "EMail:",
                    name: "email",
                    readOnly,
                    type: "email"
                }),
                Select({
                    label: "Gender:",
                    name: "gender",
                    disabled: readOnly,
                    options: [
                        { label: "Female", value: "female" },
                        { label: "Male", value: "male" },
                        { label: "Other", value: "other" }
                    ]
                }),
                Select({
                    label: "Role:",
                    name: "role",
                    disabled: readOnly || props.roleReadOnly,
                    options: props.roleOptions || [
                        { label: "USER", value: "USER" }
                    ]
                }),
                Input({
                    label: "MobileNo:",
                    name: "mobileNo",
                    readOnly,
                    type: "tel"
                }),
                isAdd
                    ? Input({
                        autoComplete: "off",
                        label: "Initial Password:",
                        name: "rawPassword",
                        readOnly,
                        type: "setpass"
                    })
                    : null,
                isAdd
                    ? Input({
                        autoComplete: "off",
                        label: "Confirm Password:",
                        name: "confirmPassword",
                        readOnly,
                        type: "setpass"
                    })
                    : null,
                isAdd
                    ? OptBoolean({
                        disabled: readOnly || !props.canEditPasswordChangeRequired,
                        label: "Force Password Change:",
                        name: "passwordChangeRequired",
                        nullable: false
                    })
                    : null
            ],
            aside: Photo({
                label: "Photo",
                name: "photo",
                readOnly
            }),
            actions,
            autoComplete: isAdd ? "off" : undefined,
            onDataChange: setPerson,
            onSubmit(event) {
                event.preventDefault();

                if (isAdd && person.rawPassword !== person.confirmPassword) {
                    setMessage("Initial password and confirm password do not match.");
                    return;
                }

                setMessage("");
                props.onSubmit?.({ ...person });
            }
        })
    );
};

export default PersonForm;
