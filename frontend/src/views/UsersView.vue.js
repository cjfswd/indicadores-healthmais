import { ref } from 'vue';
import { useCrud } from '@/composables/useCrud';
import { useConfirm } from '@/composables/useConfirm';
const { data: users, isLoading, filters, page, totalPages, remove, } = useCrud('users', { defaultPageSize: 10 });
const search = ref('');
const headers = [
    { title: 'Nome', key: 'name' },
    { title: 'Email', key: 'email' },
    { title: 'Ações', key: 'actions', sortable: false, align: 'end' },
];
const applySearch = () => {
    filters.value = search.value ? { name: { $regex: search.value, $options: 'i' } } : {};
    page.value = 1;
};
const nextPage = () => {
    if (page.value < totalPages.value)
        page.value++;
};
const { confirm } = useConfirm();
const deleteUser = async (id) => {
    if (!await confirm('Tem certeza que deseja excluir este usuário?'))
        return;
    await remove(id);
};
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: "space-y-8 animate-in fade-in duration-700" },
});
/** @type {__VLS_StyleScopedClasses['space-y-8']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-in']} */ ;
/** @type {__VLS_StyleScopedClasses['fade-in']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-700']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: 'd-flex' },
    ...{ class: 'justify-space-between' },
    ...{ class: 'align-center' },
    ...{ class: 'mb-4' },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-space-between']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h2)({
    ...{ class: 'text-h5' },
    ...{ class: 'font-weight-bold' },
});
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)({
    ...{ class: 'd-flex' },
    ...{ class: 'gap-4' },
});
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.search),
    placeholder: "Buscar usuário...",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    prependInnerIcon: "mdi-magnify",
    ...{ class: "max-w-xs" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.search),
    placeholder: "Buscar usuário...",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    prependInnerIcon: "mdi-magnify",
    ...{ class: "max-w-xs" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.applySearch) });
/** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
var __VLS_3;
var __VLS_4;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    color: "primary",
    disabled: true,
}));
const __VLS_9 = __VLS_8({
    color: "primary",
    disabled: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const { default: __VLS_12 } = __VLS_10.slots;
// @ts-ignore
[search, applySearch,];
var __VLS_10;
let __VLS_13;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    elevation: "1",
}));
const __VLS_15 = __VLS_14({
    elevation: "1",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
const { default: __VLS_18 } = __VLS_16.slots;
let __VLS_19;
/** @ts-ignore @type { | typeof __VLS_components.vDataTable | typeof __VLS_components.VDataTable | typeof __VLS_components['v-data-table']} */
vDataTable;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    items: (__VLS_ctx.users),
    headers: (__VLS_ctx.headers),
    loading: (__VLS_ctx.isLoading),
    hover: true,
}));
const __VLS_21 = __VLS_20({
    items: (__VLS_ctx.users),
    headers: (__VLS_ctx.headers),
    loading: (__VLS_ctx.isLoading),
    hover: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
const { default: __VLS_24 } = __VLS_22.slots;
{
    const { 'item.actions': __VLS_25 } = __VLS_22.slots;
    const [{ item }] = __VLS_vSlot(__VLS_25);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'gap-2' },
        ...{ class: 'justify-end' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    let __VLS_26;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        ...{ 'onClick': {} },
        variant: "text",
        color: "error",
        size: "small",
        icon: "mdi-delete",
    }));
    const __VLS_28 = __VLS_27({
        ...{ 'onClick': {} },
        variant: "text",
        color: "error",
        size: "small",
        icon: "mdi-delete",
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    let __VLS_31;
    const __VLS_32 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.deleteUser(item._id);
                // @ts-ignore
                [users, headers, isLoading, deleteUser,];
            } });
    var __VLS_29;
    var __VLS_30;
    // @ts-ignore
    [];
}
{
    const { bottom: __VLS_33 } = __VLS_22.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-center' },
        ...{ class: 'align-center' },
        ...{ class: 'pa-4' },
        ...{ class: 'gap-4' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    let __VLS_34;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        ...{ 'onClick': {} },
        icon: "mdi-chevron-left",
        variant: "text",
        disabled: (__VLS_ctx.page === 1),
    }));
    const __VLS_36 = __VLS_35({
        ...{ 'onClick': {} },
        icon: "mdi-chevron-left",
        variant: "text",
        disabled: (__VLS_ctx.page === 1),
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    let __VLS_39;
    const __VLS_40 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.page--;
                // @ts-ignore
                [page, page,];
            } });
    var __VLS_37;
    var __VLS_38;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({});
    (__VLS_ctx.page);
    (__VLS_ctx.totalPages || 1);
    let __VLS_41;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
        ...{ 'onClick': {} },
        icon: "mdi-chevron-right",
        variant: "text",
        disabled: (__VLS_ctx.page >= __VLS_ctx.totalPages),
    }));
    const __VLS_43 = __VLS_42({
        ...{ 'onClick': {} },
        icon: "mdi-chevron-right",
        variant: "text",
        disabled: (__VLS_ctx.page >= __VLS_ctx.totalPages),
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    let __VLS_46;
    const __VLS_47 = ({ click: {} },
        { onClick: (__VLS_ctx.nextPage) });
    var __VLS_44;
    var __VLS_45;
    // @ts-ignore
    [page, page, totalPages, totalPages, nextPage,];
}
// @ts-ignore
[];
var __VLS_22;
// @ts-ignore
[];
var __VLS_16;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
