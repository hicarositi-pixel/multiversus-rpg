let lastThemeApplied = null;

export const ThemeEngine = {
    getLastAppliedKey: () => lastThemeApplied,
    apply: (themeKey, themeData, force = false) => {
        // Se o tema for o mesmo que já está aplicado, aborta para não dar LAG (a menos que force=true)
        if (!force && themeKey === lastThemeApplied) return;

        const styleId = "multiversus-theme-injector";
        const oldStyle = document.getElementById(styleId);
        if (oldStyle) oldStyle.remove();

        if (themeData?.extraCSS) {
            const styleTag = document.createElement("style");
            styleTag.id = styleId;
            styleTag.textContent = themeData.extraCSS;
            document.head.appendChild(styleTag);
        }

        lastThemeApplied = themeKey;
        console.log("MOTOR DE TEMA | Aplicado:", themeKey);
    }
};