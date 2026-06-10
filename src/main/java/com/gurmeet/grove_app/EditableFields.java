package com.gurmeet.grove_app;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;

public final class EditableFields {

    private EditableFields() {
    }

    public static <T> void copyEditableFields(T source, T target) {
        if (source == null || target == null) {
            return;
        }

        Class<?> type = source.getClass();

        if (!type.equals(target.getClass())) {
            throw new IllegalArgumentException("Source and target must have the same type");
        }

        for (Field field : type.getDeclaredFields()) {
            if (!isEditable(field)) {
                continue;
            }

            try {
                field.setAccessible(true);
                field.set(target, field.get(source));
            } catch (IllegalAccessException exception) {
                throw new IllegalStateException("Unable to copy field: " + field.getName(), exception);
            }
        }
    }

    private static boolean isEditable(Field field) {
        int modifiers = field.getModifiers();

        if (Modifier.isStatic(modifiers) || Modifier.isFinal(modifiers)) {
            return false;
        }

        EditableField editableField = field.getAnnotation(EditableField.class);

        return editableField != null && editableField.value();
    }
}
