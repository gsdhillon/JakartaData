/**
 * @file Photo.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { createElement } from "../Grove.js";
import { Button } from "./Button.js";
import { Div } from "./Div.js";
import { Input } from "./Input.js";

const defaultPhotoInputId = "photo-input";

const PhotoPicker = (props = {}) => {
    const {
        label,
        ...photoProps
    } = props;
    const inputId = photoProps.id || photoProps.name || defaultPhotoInputId;
    const valueInputId = `${inputId}-value`;
    const placeholder = label || photoProps.placeholder || "Photo";
    const hasPhoto = Boolean(photoProps.value);
    const commitPhotoValue = value => {
        const valueInput = document.getElementById(valueInputId);

        if (valueInput) {
            valueInput.value = value;
            valueInput.dispatchEvent(
                new Event("change", { bubbles: true })
            );
        }

        photoProps.onChange?.(value);
    };
    const downloadPhoto = () => {
        if (!photoProps.value) {
            return;
        }

        const link = document.createElement("a");

        link.href = photoProps.value;
        link.download = photoProps.downloadName || `${photoProps.name || "photo"}.png`;
        link.click();
    };

    return Div(
        { className: photoProps.className || "grove-photo-picker" },
        Div(
            { className: "grove-photo-preview" },
            photoProps.value
                ? createElement(
                    "img",
                    {
                        alt: placeholder,
                        src: photoProps.value
                    }
                )
                : placeholder
        ),
        Input({
            accept: photoProps.accept || "image/*",
            id: inputId,
            style: "display: none",
            type: "file",
            onChange(event) {
                const file = event.target.files?.[0];

                if (!file) {
                    commitPhotoValue("");
                    return;
                }

                const reader = new FileReader();

                reader.onload = () => {
                    commitPhotoValue(reader.result);
                };

                reader.readAsDataURL(file);
            }
        }),
        Input({
            id: valueInputId,
            name: photoProps.name,
            style: "display: none",
            type: "hidden",
            value: photoProps.value || ""
        }),
        Div(
            { className: "grove-photo-actions" },
            Button({
                className: photoProps.buttonClassName,
                label: photoProps.buttonText || "Browse",
                look: "ut",
                type: "button",
                onClick() {
                    document.getElementById(inputId)?.click();
                }
            }),
            Button({
                className: photoProps.buttonClassName,
                disabled: !hasPhoto,
                label: photoProps.downloadButtonText || "Download",
                look: "sc",
                type: "button",
                onClick: downloadPhoto
            })
        )
    );
};

/**
 * Creates a photo picker with a preview and browse button.
 * @param {Object} [props={}] - Photo picker props.
 * @param {string} [props.id] - Hidden file input id.
 * @param {string} [props.name] - Field name used by Form data binding.
 * @param {string} [props.label] - Placeholder text when no photo is selected.
 * @returns {Object} A Grove virtual node.
 */
export const Photo = (props = {}) =>
    createElement(PhotoPicker, props);

export const PhotoIf = (condition, props = {}) =>
    condition ? Photo(props) : null;
