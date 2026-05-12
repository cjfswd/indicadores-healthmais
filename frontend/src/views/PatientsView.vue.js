import { ref, reactive } from 'vue';
import { useCrud } from '@/composables/useCrud';
import { useConfirm } from '@/composables/useConfirm';
import { downloadFileFromDb } from '@/lib/proxy-client';
import PatientFormModal from '@/components/PatientFormModal.vue';
const { data: patients, isLoading, filters, page, totalPages, remove, } = useCrud('patients', { defaultPageSize: 10 });
const { data: operators } = useCrud('operators', { defaultPageSize: 100 });
const filtersForm = reactive({
    name: '',
    operatorId: null
});
const clearFilters = () => {
    filtersForm.name = '';
    filtersForm.operatorId = null;
    applySearch();
};
const formModal = ref(null);
const applySearch = () => {
    const newFilters = {};
    if (filtersForm.name)
        newFilters.name = { $regex: filtersForm.name, $options: 'i' };
    if (filtersForm.operatorId)
        newFilters['operator._id'] = filtersForm.operatorId;
    filters.value = newFilters;
    page.value = 1;
};
const jumpToPage = ref(null);
const goToPage = () => {
    if (jumpToPage.value && jumpToPage.value >= 1 && jumpToPage.value <= totalPages.value) {
        page.value = jumpToPage.value;
        jumpToPage.value = null;
    }
};
const openModal = (patient) => {
    formModal.value?.open(patient);
};
const { confirm } = useConfirm();
const downloadFile = (file, docId) => {
    downloadFileFromDb('patients', docId, 0, file.name);
};
const deletePatient = async (id) => {
    if (!await confirm('Tem certeza que deseja excluir este paciente?'))
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
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    color: "primary",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    color: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.openModal();
            // @ts-ignore
            [openModal,];
        } });
const { default: __VLS_7 } = __VLS_3.slots;
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
let __VLS_8;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
    ...{ class: 'mb-4' },
    elevation: "0",
    border: true,
}));
const __VLS_10 = __VLS_9({
    ...{ class: 'mb-4' },
    elevation: "0",
    border: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
const { default: __VLS_13 } = __VLS_11.slots;
let __VLS_14;
/** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
vCardText;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
    ...{ class: 'pa-3' },
}));
const __VLS_16 = __VLS_15({
    ...{ class: 'pa-3' },
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
/** @type {__VLS_StyleScopedClasses['pa-3']} */ ;
const { default: __VLS_19 } = __VLS_17.slots;
let __VLS_20;
/** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
vRow;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    dense: true,
    align: "center",
}));
const __VLS_22 = __VLS_21({
    dense: true,
    align: "center",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const { default: __VLS_25 } = __VLS_23.slots;
let __VLS_26;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    cols: "12",
    sm: "4",
    md: "4",
}));
const __VLS_28 = __VLS_27({
    cols: "12",
    sm: "4",
    md: "4",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
const { default: __VLS_31 } = __VLS_29.slots;
let __VLS_32;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.name),
    placeholder: "Buscar por nome...",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    prependInnerIcon: "mdi-magnify",
    clearable: true,
}));
const __VLS_34 = __VLS_33({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.name),
    placeholder: "Buscar por nome...",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    prependInnerIcon: "mdi-magnify",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
let __VLS_37;
const __VLS_38 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.applySearch) });
var __VLS_35;
var __VLS_36;
// @ts-ignore
[filtersForm, applySearch,];
var __VLS_29;
let __VLS_39;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
    cols: "12",
    sm: "4",
    md: "4",
}));
const __VLS_41 = __VLS_40({
    cols: "12",
    sm: "4",
    md: "4",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
const { default: __VLS_44 } = __VLS_42.slots;
let __VLS_45;
/** @ts-ignore @type { | typeof __VLS_components.vAutocomplete | typeof __VLS_components.VAutocomplete | typeof __VLS_components['v-autocomplete']} */
vAutocomplete;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.operatorId),
    items: (__VLS_ctx.operators),
    itemTitle: "name",
    itemValue: "_id",
    placeholder: "Filtrar Operadora",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}));
const __VLS_47 = __VLS_46({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.filtersForm.operatorId),
    items: (__VLS_ctx.operators),
    itemTitle: "name",
    itemValue: "_id",
    placeholder: "Filtrar Operadora",
    density: "compact",
    variant: "outlined",
    hideDetails: true,
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
let __VLS_50;
const __VLS_51 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.applySearch) });
var __VLS_48;
var __VLS_49;
// @ts-ignore
[filtersForm, applySearch, operators,];
var __VLS_42;
let __VLS_52;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
    cols: "12",
    sm: "4",
    md: "4",
}));
const __VLS_54 = __VLS_53({
    cols: "12",
    sm: "4",
    md: "4",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const { default: __VLS_57 } = __VLS_55.slots;
if (__VLS_ctx.filtersForm.name || __VLS_ctx.filtersForm.operatorId) {
    let __VLS_58;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        prependIcon: "mdi-filter-off",
    }));
    const __VLS_60 = __VLS_59({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        prependIcon: "mdi-filter-off",
    }, ...__VLS_functionalComponentArgsRest(__VLS_59));
    let __VLS_63;
    const __VLS_64 = ({ click: {} },
        { onClick: (__VLS_ctx.clearFilters) });
    const { default: __VLS_65 } = __VLS_61.slots;
    // @ts-ignore
    [filtersForm, filtersForm, clearFilters,];
    var __VLS_61;
    var __VLS_62;
}
// @ts-ignore
[];
var __VLS_55;
// @ts-ignore
[];
var __VLS_23;
// @ts-ignore
[];
var __VLS_17;
// @ts-ignore
[];
var __VLS_11;
let __VLS_66;
/** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
vRow;
// @ts-ignore
const __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({}));
const __VLS_68 = __VLS_67({}, ...__VLS_functionalComponentArgsRest(__VLS_67));
const { default: __VLS_71 } = __VLS_69.slots;
for (const [item] of __VLS_vFor((__VLS_ctx.patients))) {
    let __VLS_72;
    /** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
    vCol;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        cols: "12",
        md: "6",
        lg: "4",
        key: (item._id),
    }));
    const __VLS_74 = __VLS_73({
        cols: "12",
        md: "6",
        lg: "4",
        key: (item._id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    const { default: __VLS_77 } = __VLS_75.slots;
    let __VLS_78;
    /** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
    vCard;
    // @ts-ignore
    const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
        elevation: "1",
        ...{ class: "h-100 d-flex flex-column" },
    }));
    const __VLS_80 = __VLS_79({
        elevation: "1",
        ...{ class: "h-100 d-flex flex-column" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_79));
    /** @type {__VLS_StyleScopedClasses['h-100']} */ ;
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-column']} */ ;
    const { default: __VLS_83 } = __VLS_81.slots;
    let __VLS_84;
    /** @ts-ignore @type { | typeof __VLS_components.vCardTitle | typeof __VLS_components.VCardTitle | typeof __VLS_components['v-card-title']} */
    vCardTitle;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-space-between' },
        ...{ class: 'align-start' },
    }));
    const __VLS_86 = __VLS_85({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-space-between' },
        ...{ class: 'align-start' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-space-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-start']} */ ;
    const { default: __VLS_89 } = __VLS_87.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-wrap' },
        ...{ class: 'text-subtitle-1' },
        ...{ class: 'font-weight-bold' },
        ...{ class: 'pr-2' },
        ...{ style: {} },
    });
    /** @type {__VLS_StyleScopedClasses['text-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-subtitle-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['pr-2']} */ ;
    (item.name);
    // @ts-ignore
    [patients,];
    var __VLS_87;
    let __VLS_90;
    /** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
    vCardText;
    // @ts-ignore
    const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
        ...{ class: 'flex-grow-1' },
    }));
    const __VLS_92 = __VLS_91({
        ...{ class: 'flex-grow-1' },
    }, ...__VLS_functionalComponentArgsRest(__VLS_91));
    /** @type {__VLS_StyleScopedClasses['flex-grow-1']} */ ;
    const { default: __VLS_95 } = __VLS_93.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-body-2' },
        ...{ class: 'mb-2' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: 'font-weight-bold' },
    });
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    (item.operator?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-body-2' },
        ...{ class: 'mb-2' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: 'font-weight-bold' },
    });
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    if (item.admissionDate) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({});
        (new Date(item.admissionDate).toLocaleDateString());
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-warning' },
            ...{ class: 'font-italic' },
        });
        /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-italic']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-body-2' },
        ...{ class: 'mb-2' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: 'font-weight-bold' },
    });
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    if (item.birthDate) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({});
        (new Date(item.birthDate).toLocaleDateString());
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-warning' },
            ...{ class: 'font-italic' },
        });
        /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-italic']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'text-body-2' },
        ...{ class: 'mb-4' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
        ...{ class: 'font-weight-bold' },
    });
    /** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
    if (item.observations) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({});
        (item.observations);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({
            ...{ class: 'text-grey' },
            ...{ class: 'font-italic' },
        });
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-italic']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'flex-wrap' },
        ...{ class: 'gap-1' },
        ...{ class: 'mt-auto' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-auto']} */ ;
    if (item.events && item.events.length) {
        let __VLS_96;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
            size: "x-small",
            color: "secondary",
            variant: "tonal",
            prependIcon: "mdi-calendar-check",
        }));
        const __VLS_98 = __VLS_97({
            size: "x-small",
            color: "secondary",
            variant: "tonal",
            prependIcon: "mdi-calendar-check",
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        const { default: __VLS_101 } = __VLS_99.slots;
        (item.events.length);
        // @ts-ignore
        [];
        var __VLS_99;
    }
    if (item.file) {
        let __VLS_102;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102({
            ...{ 'onClick': {} },
            size: "x-small",
            color: "primary",
            variant: "tonal",
            prependIcon: "mdi-download",
            ...{ style: {} },
        }));
        const __VLS_104 = __VLS_103({
            ...{ 'onClick': {} },
            size: "x-small",
            color: "primary",
            variant: "tonal",
            prependIcon: "mdi-download",
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_103));
        let __VLS_107;
        const __VLS_108 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!(item.file))
                        return;
                    __VLS_ctx.downloadFile(item.file, item._id);
                    // @ts-ignore
                    [downloadFile,];
                } });
        const { default: __VLS_109 } = __VLS_105.slots;
        (item.file.name);
        // @ts-ignore
        [];
        var __VLS_105;
        var __VLS_106;
    }
    else {
        let __VLS_110;
        /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
        vChip;
        // @ts-ignore
        const __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
            size: "x-small",
            color: "grey",
            variant: "tonal",
            prependIcon: "mdi-paperclip",
        }));
        const __VLS_112 = __VLS_111({
            size: "x-small",
            color: "grey",
            variant: "tonal",
            prependIcon: "mdi-paperclip",
        }, ...__VLS_functionalComponentArgsRest(__VLS_111));
        const { default: __VLS_115 } = __VLS_113.slots;
        // @ts-ignore
        [];
        var __VLS_113;
    }
    // @ts-ignore
    [];
    var __VLS_93;
    let __VLS_116;
    /** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
    vDivider;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({}));
    const __VLS_118 = __VLS_117({}, ...__VLS_functionalComponentArgsRest(__VLS_117));
    let __VLS_121;
    /** @ts-ignore @type { | typeof __VLS_components.vCardActions | typeof __VLS_components.VCardActions | typeof __VLS_components['v-card-actions']} */
    vCardActions;
    // @ts-ignore
    const __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121({}));
    const __VLS_123 = __VLS_122({}, ...__VLS_functionalComponentArgsRest(__VLS_122));
    const { default: __VLS_126 } = __VLS_124.slots;
    let __VLS_127;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_128 = __VLS_asFunctionalComponent1(__VLS_127, new __VLS_127({
        ...{ 'onClick': {} },
        variant: "text",
        color: "secondary",
        size: "small",
        prependIcon: "mdi-calendar-search",
    }));
    const __VLS_129 = __VLS_128({
        ...{ 'onClick': {} },
        variant: "text",
        color: "secondary",
        size: "small",
        prependIcon: "mdi-calendar-search",
    }, ...__VLS_functionalComponentArgsRest(__VLS_128));
    let __VLS_132;
    const __VLS_133 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.$router.push({ path: '/events', query: { patientId: item._id } });
                // @ts-ignore
                [$router,];
            } });
    const { default: __VLS_134 } = __VLS_130.slots;
    // @ts-ignore
    [];
    var __VLS_130;
    var __VLS_131;
    let __VLS_135;
    /** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
    vSpacer;
    // @ts-ignore
    const __VLS_136 = __VLS_asFunctionalComponent1(__VLS_135, new __VLS_135({}));
    const __VLS_137 = __VLS_136({}, ...__VLS_functionalComponentArgsRest(__VLS_136));
    let __VLS_140;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        size: "small",
        icon: "mdi-pencil",
    }));
    const __VLS_142 = __VLS_141({
        ...{ 'onClick': {} },
        variant: "text",
        color: "primary",
        size: "small",
        icon: "mdi-pencil",
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    let __VLS_145;
    const __VLS_146 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.openModal(item);
                // @ts-ignore
                [openModal,];
            } });
    var __VLS_143;
    var __VLS_144;
    let __VLS_147;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
        ...{ 'onClick': {} },
        variant: "text",
        color: "error",
        size: "small",
        icon: "mdi-delete",
    }));
    const __VLS_149 = __VLS_148({
        ...{ 'onClick': {} },
        variant: "text",
        color: "error",
        size: "small",
        icon: "mdi-delete",
    }, ...__VLS_functionalComponentArgsRest(__VLS_148));
    let __VLS_152;
    const __VLS_153 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.deletePatient(item._id);
                // @ts-ignore
                [deletePatient,];
            } });
    var __VLS_150;
    var __VLS_151;
    // @ts-ignore
    [];
    var __VLS_124;
    // @ts-ignore
    [];
    var __VLS_81;
    // @ts-ignore
    [];
    var __VLS_75;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_69;
if (__VLS_ctx.totalPages > 1) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'justify-center' },
        ...{ class: 'align-center' },
        ...{ class: 'pa-4' },
        ...{ class: 'mt-4' },
        ...{ class: 'gap-4' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['align-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
    let __VLS_154;
    /** @ts-ignore @type { | typeof __VLS_components.vPagination | typeof __VLS_components.VPagination | typeof __VLS_components['v-pagination']} */
    vPagination;
    // @ts-ignore
    const __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({
        modelValue: (__VLS_ctx.page),
        length: (__VLS_ctx.totalPages),
        totalVisible: (5),
        density: "compact",
        rounded: true,
    }));
    const __VLS_156 = __VLS_155({
        modelValue: (__VLS_ctx.page),
        length: (__VLS_ctx.totalPages),
        totalVisible: (5),
        density: "compact",
        rounded: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_155));
    let __VLS_159;
    /** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
    vTextField;
    // @ts-ignore
    const __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({
        ...{ 'onKeydown': {} },
        ...{ class: 'flex-grow-0' },
        modelValue: (__VLS_ctx.jumpToPage),
        modelModifiers: { number: true, },
        type: "number",
        variant: "outlined",
        density: "compact",
        hideDetails: true,
        placeholder: "Ir p/",
        ...{ style: {} },
        min: (1),
        max: (__VLS_ctx.totalPages),
    }));
    const __VLS_161 = __VLS_160({
        ...{ 'onKeydown': {} },
        ...{ class: 'flex-grow-0' },
        modelValue: (__VLS_ctx.jumpToPage),
        modelModifiers: { number: true, },
        type: "number",
        variant: "outlined",
        density: "compact",
        hideDetails: true,
        placeholder: "Ir p/",
        ...{ style: {} },
        min: (1),
        max: (__VLS_ctx.totalPages),
    }, ...__VLS_functionalComponentArgsRest(__VLS_160));
    let __VLS_164;
    const __VLS_165 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.goToPage) });
    /** @type {__VLS_StyleScopedClasses['flex-grow-0']} */ ;
    var __VLS_162;
    var __VLS_163;
}
const __VLS_166 = PatientFormModal;
// @ts-ignore
const __VLS_167 = __VLS_asFunctionalComponent1(__VLS_166, new __VLS_166({
    ref: "formModal",
}));
const __VLS_168 = __VLS_167({
    ref: "formModal",
}, ...__VLS_functionalComponentArgsRest(__VLS_167));
var __VLS_171 = {};
var __VLS_169;
// @ts-ignore
var __VLS_172 = __VLS_171;
// @ts-ignore
[totalPages, totalPages, totalPages, page, jumpToPage, goToPage,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
