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

export const dateTimeLocalToInstant = value => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date.toISOString();
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

export const formatInstantLocal = value => {
    const localValue = temporalValue("instant", value);

    if (!localValue) {
        return "";
    }

    const [date, time] = localValue.split("T");
    const parts = (date || "").split("-");

    const displayDate = parts.length === 3
        ? `${parts[2]}/${parts[1]}/${parts[0]}`
        : date;

    return `${displayDate}${time ? ` ${time}` : ""}`;
};

export const Instant = (props = {}) =>
    Input({
        ...props,
        "data-grove-temporal": "instant",
        readOnly: true,
        type: "datetime-local",
        value: temporalValue("instant", props.value)
    });
