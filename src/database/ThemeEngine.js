let lastThemeApplied = null;

export const ThemeEngine = {
    apply: (themeKey, themeData) => {
        // Se o tema for o mesmo que já está aplicado, aborta para não dar LAG
        if (themeKey === lastThemeApplied) return;

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