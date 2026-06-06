import {
    Button,
    Form,
    Input,
    Instant,
    LocalDate,
    Photo,
    Select,
    useState
} from "../../lib/Grove.js";
import { normalizePerson } from "./PersonService.js";

const PersonForm = props => {
    const [person, setPerson] = useState(
        normalizePerson(props.person)
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
                type: "text"
            }),
            Input({
                label: "Designation:",
                name: "designation",
                type: "text"
            }),
            LocalDate({
                label: "DOB:",
                name: "dob"
            }),
            Instant({
                label: "Updated At:",
                name: "updatedAt",
                readOnly: true
            }),
            Input({
                label: "EMail:",
                name: "email",
                type: "email"
            }),
            Select({
                label: "Gender:",
                name: "gender",
                options: [
                    { label: "Female", value: "female" },
                    { label: "Male", value: "male" },
                    { label: "Other", value: "other" }
                ]
            }),
            Input({
                label: "MobileNo:",
                name: "mobileNo",
                type: "tel"
            })
        ],
        aside: Photo({
            label: "Photo",
            name: "photo"
        }),
        actions: [
            Button({
                label: props.mode === "update" ? "Update" : "Submit",
                look: "pm",
                name: "submit",
                disabled: props.isBusy,
                type: "submit"
            })
        ],
        onDataChange: setPerson,
        onSubmit(event) {
            event.preventDefault();
            props.onSubmit?.({ ...person });
        }
    });
};

export default PersonForm;
