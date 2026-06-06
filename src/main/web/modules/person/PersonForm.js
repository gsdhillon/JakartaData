import {
    Button,
    Form,
    Input,
    Instant,
    LocalDate,
    Photo,
    Select,
    useMemo,
    useState
} from "../../lib/Grove.js";
import { normalizePerson } from "./PersonService.js";

const PersonForm = props => {
    const [person, setPerson] = useState(
        normalizePerson(props.person)
    );
    const readOnly = props.readOnly === true;
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

    return Form({
        className: "person-form",
        data: person,
        main: [
            Input({
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
                label: "Updated At:",
                name: "updatedAt",
                readOnly: true
            }),
            Input({
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
            })
        ],
        aside: Photo({
            label: "Photo",
            name: "photo",
            readOnly
        }),
        actions,
        onDataChange: setPerson,
        onSubmit(event) {
            event.preventDefault();
            props.onSubmit?.({ ...person });
        }
    });
};

export default PersonForm;
