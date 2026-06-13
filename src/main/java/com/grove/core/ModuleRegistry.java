package com.grove.core;

import java.util.Locale;
import java.util.Set;

public final class ModuleRegistry {

    private static final Set<String> ENABLED_MODULES = Set.of(
            // REGISTER BACKEND MODULES HERE: add/remove module keys before running mvn package.
            "person"
            ,"task"  // comment it to remove --- do at frontend from App.js
    );

    private ModuleRegistry() {
    }

    public static boolean isEnabled(String moduleKey) {
        return ENABLED_MODULES.contains(normalize(moduleKey));
    }

    public static Set<String> enabledModules() {
        return ENABLED_MODULES;
    }

    private static String normalize(String moduleKey) {
        return String.valueOf(moduleKey).trim().toLowerCase(Locale.ROOT);
    }
}
