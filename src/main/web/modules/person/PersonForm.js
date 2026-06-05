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

const createEmptyPerson = () => ({
    id: "",
    name: "",
    designation: "",
    dob: null,
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
                label: "Submit",
                look: "pm",
                name: "submit",
                disabled: props.isBusy,
                type: "submit"
            }),
            Button({
                label: "Close",
                look: "sc",
                name: "close",
                disabled: props.isBusy,
                type: "button",
                onClick: props.onClose
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
