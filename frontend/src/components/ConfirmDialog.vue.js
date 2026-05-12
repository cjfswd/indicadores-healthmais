import { useConfirm } from '@/composables/useConfirm';
const { isOpen, title, message, accept, cancel } = useConfirm();
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vDialog | typeof __VLS_components.VDialog | typeof __VLS_components['v-dialog']} */
vDialog;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.isOpen),
    maxWidth: "400",
    persistent: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.isOpen),
    maxWidth: "400",
    persistent: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
let __VLS_13;
/** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
vCardTitle;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    ...{ class: 'text-h6' },
    ...{ class: 'font-weight-bold' },
    ...{ class: 'pt-4' },
    ...{ class: 'px-4' },
}));
const __VLS_15 = __VLS_14({
    ...{ class: 'text-h6' },
    ...{ class: 'font-weight-bold' },
    ...{ class: 'pt-4' },
    ...{ class: 'px-4' },
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
const { default: __VLS_18 } = __VLS_16.slots;
let __VLS_19;
/** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
vIcon;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    color: "warning",
    ...{ class: "mr-2" },
    size: "small",
}));
const __VLS_21 = __VLS_20({
    color: "warning",
    ...{ class: "mr-2" },
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
const { default: __VLS_24 } = __VLS_22.slots;
// @ts-ignore
[isOpen,];
var __VLS_22;
(__VLS_ctx.title);
// @ts-ignore
[title,];
var __VLS_16;
let __VLS_25;
/** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
vCardText;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    ...{ class: 'px-4' },
    ...{ class: 'py-2' },
}));
const __VLS_27 = __VLS_26({
    ...{ class: 'px-4' },
    ...{ class: 'py-2' },
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
const { default: __VLS_30 } = __VLS_28.slots;
(__VLS_ctx.message);
// @ts-ignore
[message,];
var __VLS_28;
let __VLS_31;
/** @ts-ignore @type { | typeof __VLS_components.vCardActions | typeof __VLS_components.VCardActions | typeof __VLS_components['v-card-actions']} */
vCardActions;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    ...{ class: 'pa-4' },
}));
const __VLS_33 = __VLS_32({
    ...{ class: 'pa-4' },
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
const { default: __VLS_36 } = __VLS_34.slots;
let __VLS_37;
/** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
vSpacer;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({}));
const __VLS_39 = __VLS_38({}, ...__VLS_functionalComponentArgsRest(__VLS_38));
let __VLS_42;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
    ...{ 'onClick': {} },
    variant: "text",
}));
const __VLS_44 = __VLS_43({
    ...{ 'onClick': {} },
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
let __VLS_47;
const __VLS_48 = ({ click: {} },
    { onClick: (__VLS_ctx.cancel) });
const { default: __VLS_49 } = __VLS_45.slots;
// @ts-ignore
[cancel,];
var __VLS_45;
var __VLS_46;
let __VLS_50;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
    ...{ 'onClick': {} },
    color: "error",
    variant: "flat",
}));
const __VLS_52 = __VLS_51({
    ...{ 'onClick': {} },
    color: "error",
    variant: "flat",
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
let __VLS_55;
const __VLS_56 = ({ click: {} },
    { onClick: (__VLS_ctx.accept) });
const { default: __VLS_57 } = __VLS_53.slots;
// @ts-ignore
[accept,];
var __VLS_53;
var __VLS_54;
// @ts-ignore
[];
var __VLS_34;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
