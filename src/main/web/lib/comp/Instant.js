/**
 * @file Instant.js
 * @author Gurmeet Singh
 * @email gsdhillon@gmail.com
 */

import { Input } from "./Input.js";

const pad = value =>
    String(value).padStart(2, "0");

const instantToDateTimeLocal = value => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join("-") + "T" + [
        pad(date.getHours()),
        pad(date.getMinutes())
    ].join(":");
};

export const temporalValue = (type, value) => {
    if (!value) {
        return "";
    }

    const text = String(value);

    if (type === "local-date") {
        return text.slice(0, 10);
    }

    return text.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(text)
        ? instantToDateTimeLocal(text)
        : text.slice(0, 16);
};

export const Instant = (props = {}) =>
    Input({
        readOnly: true,
        ...props,
        "data-grove-temporal": "instant",
        type: "datetime-local",
        value: temporalValue("instant", props.value)
    });
