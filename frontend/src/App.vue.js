import { useRoute } from 'vue-router';
import DashboardLayout from '@/components/DashboardLayout.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
const route = useRoute();
const snackbar = useSnackbarStore();
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vApp | typeof __VLS_components.VApp | typeof __VLS_components['v-app']} */
vApp;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
if (__VLS_ctx.route.name === 'login') {
    let __VLS_7;
    /** @ts-ignore @type { | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view']} */
    routerView;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
    const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
else {
    const __VLS_12 = DashboardLayout;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
    const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
    const { default: __VLS_17 } = __VLS_15.slots;
    let __VLS_18;
    /** @ts-ignore @type { | typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components['router-view']} */
    routerView;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
    const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
    // @ts-ignore
    [route,];
    var __VLS_15;
}
const __VLS_23 = ConfirmDialog;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({}));
const __VLS_25 = __VLS_24({}, ...__VLS_functionalComponentArgsRest(__VLS_24));
let __VLS_28;
/** @ts-ignore @type { | typeof __VLS_components.vSnackbar | typeof __VLS_components.VSnackbar | typeof __VLS_components['v-snackbar']} */
vSnackbar;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    modelValue: (__VLS_ctx.snackbar.isVisible),
    color: (__VLS_ctx.snackbar.color),
    timeout: "3000",
    location: "top",
}));
const __VLS_30 = __VLS_29({
    modelValue: (__VLS_ctx.snackbar.isVisible),
    color: (__VLS_ctx.snackbar.color),
    timeout: "3000",
    location: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const { default: __VLS_33 } = __VLS_31.slots;
(__VLS_ctx.snackbar.message);
{
    const { actions: __VLS_34 } = __VLS_31.slots;
    let __VLS_35;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        ...{ 'onClick': {} },
        variant: "text",
    }));
    const __VLS_37 = __VLS_36({
        ...{ 'onClick': {} },
        variant: "text",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    let __VLS_40;
    const __VLS_41 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.snackbar.hide();
                // @ts-ignore
                [snackbar, snackbar, snackbar, snackbar,];
            } });
    const { default: __VLS_42 } = __VLS_38.slots;
    // @ts-ignore
    [];
    var __VLS_38;
    var __VLS_39;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_31;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
