import { ref } from 'vue';
import { useTheme } from 'vuetify';
import NotificationBell from '@/components/NotificationBell.vue';
import { useAuthStore } from '@/stores/authStore';
const drawer = ref(true);
const theme = useTheme();
const authStore = useAuthStore();
const savedTheme = localStorage.getItem('app_theme');
if (savedTheme) {
    theme.global.name.value = savedTheme;
}
const toggleTheme = () => {
    const current = theme.global.name.value;
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    theme.global.name.value = nextTheme;
    localStorage.setItem('app_theme', nextTheme);
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vAppBar | typeof __VLS_components.VAppBar | typeof __VLS_components['v-app-bar']} */
vAppBar;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    elevation: "1",
    density: "compact",
    color: (__VLS_ctx.theme.global.name.value === 'dark' ? 'surface' : 'white'),
}));
const __VLS_2 = __VLS_1({
    elevation: "1",
    density: "compact",
    color: (__VLS_ctx.theme.global.name.value === 'dark' ? 'surface' : 'white'),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_5 } = __VLS_3.slots;
let __VLS_6;
/** @ts-ignore @type { | typeof __VLS_components.vAppBarNavIcon | typeof __VLS_components.VAppBarNavIcon | typeof __VLS_components['v-app-bar-nav-icon']} */
vAppBarNavIcon;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    ...{ 'onClick': {} },
}));
const __VLS_8 = __VLS_7({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
let __VLS_11;
const __VLS_12 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.drawer = !__VLS_ctx.drawer;
            // @ts-ignore
            [theme, drawer, drawer,];
        } });
var __VLS_9;
var __VLS_10;
let __VLS_13;
/** @ts-ignore @type { | typeof __VLS_components.vAppBarTitle | typeof __VLS_components.VAppBarTitle | typeof __VLS_components['v-app-bar-title']} */
vAppBarTitle;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
// @ts-ignore
[];
var __VLS_16;
let __VLS_19;
/** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
vSpacer;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({}));
const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const __VLS_24 = NotificationBell;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
const __VLS_26 = __VLS_25({}, ...__VLS_functionalComponentArgsRest(__VLS_25));
if (__VLS_ctx.authStore.user) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'align-center' },
        ...{ class: 'gap-2' },
        ...{ class: 'mr-4' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mr-4']} */ ;
    let __VLS_29;
    /** @ts-ignore @type { | typeof __VLS_components.vAvatar | typeof __VLS_components.VAvatar | typeof __VLS_components['v-avatar']} */
    vAvatar;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        size: "32",
    }));
    const __VLS_31 = __VLS_30({
        size: "32",
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    const { default: __VLS_34 } = __VLS_32.slots;
    let __VLS_35;
    /** @ts-ignore @type { | typeof __VLS_components.vImg | typeof __VLS_components.VImg | typeof __VLS_components['v-img']} */
    vImg;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        src: (__VLS_ctx.authStore.user.avatar),
    }));
    const __VLS_37 = __VLS_36({
        src: (__VLS_ctx.authStore.user.avatar),
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    // @ts-ignore
    [authStore, authStore,];
    var __VLS_32;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-caption' },
    });
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    (__VLS_ctx.authStore.user.name);
}
// @ts-ignore
[authStore,];
var __VLS_3;
let __VLS_40;
/** @ts-ignore @type { | typeof __VLS_components.vNavigationDrawer | typeof __VLS_components.VNavigationDrawer | typeof __VLS_components['v-navigation-drawer']} */
vNavigationDrawer;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    modelValue: (__VLS_ctx.drawer),
    color: "blue-darken-4",
    theme: "dark",
    width: (200),
}));
const __VLS_42 = __VLS_41({
    modelValue: (__VLS_ctx.drawer),
    color: "blue-darken-4",
    theme: "dark",
    width: (200),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const { default: __VLS_45 } = __VLS_43.slots;
let __VLS_46;
/** @ts-ignore @type { | typeof __VLS_components.vList | typeof __VLS_components.VList | typeof __VLS_components['v-list']} */
vList;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
    density: "compact",
    nav: true,
}));
const __VLS_48 = __VLS_47({
    density: "compact",
    nav: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_47));
const { default: __VLS_51 } = __VLS_49.slots;
let __VLS_52;
/** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
vListItem;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
    prependIcon: "mdi-view-dashboard",
    title: "Dashboard",
    to: "/dashboard",
    exact: true,
}));
const __VLS_54 = __VLS_53({
    prependIcon: "mdi-view-dashboard",
    title: "Dashboard",
    to: "/dashboard",
    exact: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
let __VLS_57;
/** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
vListItem;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
    prependIcon: "mdi-account-injury",
    title: "Pacientes",
    to: "/patients",
}));
const __VLS_59 = __VLS_58({
    prependIcon: "mdi-account-injury",
    title: "Pacientes",
    to: "/patients",
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
let __VLS_62;
/** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
vListItem;
// @ts-ignore
const __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
    prependIcon: "mdi-calendar-check",
    title: "Eventos",
    to: "/events",
}));
const __VLS_64 = __VLS_63({
    prependIcon: "mdi-calendar-check",
    title: "Eventos",
    to: "/events",
}, ...__VLS_functionalComponentArgsRest(__VLS_63));
// @ts-ignore
[drawer,];
var __VLS_49;
let __VLS_67;
/** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
vSpacer;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({}));
const __VLS_69 = __VLS_68({}, ...__VLS_functionalComponentArgsRest(__VLS_68));
let __VLS_72;
/** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
vDivider;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({}));
const __VLS_74 = __VLS_73({}, ...__VLS_functionalComponentArgsRest(__VLS_73));
let __VLS_77;
/** @ts-ignore @type { | typeof __VLS_components.vList | typeof __VLS_components.VList | typeof __VLS_components['v-list']} */
vList;
// @ts-ignore
const __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
    density: "compact",
    nav: true,
}));
const __VLS_79 = __VLS_78({
    density: "compact",
    nav: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_78));
const { default: __VLS_82 } = __VLS_80.slots;
let __VLS_83;
/** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
vListItem;
// @ts-ignore
const __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
    ...{ 'onClick': {} },
    prependIcon: (__VLS_ctx.theme.global.name.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'),
    title: (__VLS_ctx.theme.global.name.value === 'dark' ? 'Modo Claro' : 'Modo Escuro'),
}));
const __VLS_85 = __VLS_84({
    ...{ 'onClick': {} },
    prependIcon: (__VLS_ctx.theme.global.name.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'),
    title: (__VLS_ctx.theme.global.name.value === 'dark' ? 'Modo Claro' : 'Modo Escuro'),
}, ...__VLS_functionalComponentArgsRest(__VLS_84));
let __VLS_88;
const __VLS_89 = ({ click: {} },
    { onClick: (__VLS_ctx.toggleTheme) });
var __VLS_86;
var __VLS_87;
let __VLS_90;
/** @ts-ignore @type { | typeof __VLS_components.vListItem | typeof __VLS_components.VListItem | typeof __VLS_components['v-list-item']} */
vListItem;
// @ts-ignore
const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
    ...{ 'onClick': {} },
    prependIcon: "mdi-logout",
    title: "Sair",
}));
const __VLS_92 = __VLS_91({
    ...{ 'onClick': {} },
    prependIcon: "mdi-logout",
    title: "Sair",
}, ...__VLS_functionalComponentArgsRest(__VLS_91));
let __VLS_95;
const __VLS_96 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.authStore.logout();
            // @ts-ignore
            [theme, theme, authStore, toggleTheme,];
        } });
var __VLS_93;
var __VLS_94;
// @ts-ignore
[];
var __VLS_80;
// @ts-ignore
[];
var __VLS_43;
let __VLS_97;
/** @ts-ignore @type { | typeof __VLS_components.vMain | typeof __VLS_components.VMain | typeof __VLS_components['v-main']} */
vMain;
// @ts-ignore
const __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97({
    ...{ class: (__VLS_ctx.theme.global.name.value === 'dark' ? 'bg-grey-darken-4' : 'bg-grey-lighten-4') },
    ...{ style: {} },
}));
const __VLS_99 = __VLS_98({
    ...{ class: (__VLS_ctx.theme.global.name.value === 'dark' ? 'bg-grey-darken-4' : 'bg-grey-lighten-4') },
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_98));
const { default: __VLS_102 } = __VLS_100.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ style: {} },
});
var __VLS_103 = {};
// @ts-ignore
[theme,];
var __VLS_100;
// @ts-ignore
var __VLS_104 = __VLS_103;
// @ts-ignore
[];
const __VLS_base = (await import('vue')).defineComponent({});
const __VLS_export = {};
export default {};
