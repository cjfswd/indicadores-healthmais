import { ref, reactive, computed, watch } from 'vue';
import { z } from 'zod';
import { useCrud } from '@/composables/useCrud';
import { useQueryClient } from '@tanstack/vue-query';
import { fileToBase64, downloadFileFromDb } from '@/lib/proxy-client';
const PatientFormSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório').max(100, 'Nome muito longo'),
    operatorId: z.string().min(1, 'A operadora é obrigatória'),
    admissionDate: z.string().optional(),
    birthDate: z.string().optional(),
    observations: z.string().max(500, 'A observação deve ter no máximo 500 caracteres').optional(),
    file: z.any().nullable().optional().default(null)
});
const { create, update, isCreating, isUpdating } = useCrud('patients');
const { data: operators, isLoading: isLoadingOps } = useCrud('operators', { defaultPageSize: 100 });
const queryClient = useQueryClient();
import { useSnackbarStore } from '@/stores/snackbarStore';
const snackbar = useSnackbarStore();
const isOpen = ref(false);
const editingId = ref(null);
const form = reactive({
    name: '', operatorId: '', admissionDate: '', birthDate: '', observations: '',
    file: null
});
const errors = reactive({});
const rawFiles = ref([]);
/** Referência ao File object para conversão base64 no save */
const pendingFile = ref(null);
const processFile = (files) => {
    const fileArray = Array.isArray(files) ? files : files ? [files] : [];
    if (!fileArray.length) {
        pendingFile.value = null;
        form.file = null;
        return;
    }
    const file = fileArray[0];
    if (file.size > 5 * 1024 * 1024) {
        snackbar.show('O arquivo não pode exceder 5MB', 'error');
        rawFiles.value = [];
        return;
    }
    pendingFile.value = file;
    form.file = { name: file.name, type: file.type, size: file.size };
    rawFiles.value = [];
};
const removeFile = () => {
    form.file = null;
    pendingFile.value = null;
};
const downloadFile = (file, docId) => {
    downloadFileFromDb('patients', docId, 0, file.name);
};
const isSaving = computed(() => isCreating.value || isUpdating.value);
const validateForm = () => {
    Object.keys(errors).forEach(k => delete errors[k]);
    const result = PatientFormSchema.safeParse(form);
    if (!result.success) {
        result.error.issues.forEach(issue => {
            errors[issue.path[0]] = issue.message;
        });
        return false;
    }
    return true;
};
const isValid = computed(() => {
    return PatientFormSchema.safeParse(form).success;
});
// Auto-validate form fields when they change
watch(form, () => {
    if (Object.keys(errors).length > 0) {
        validateForm();
    }
}, { deep: true });
const savePatient = async () => {
    if (!validateForm())
        return;
    try {
        const op = operators.value?.find((o) => o._id === form.operatorId);
        const payload = {
            name: form.name,
            operatorId: op?._id || '',
            admissionDate: form.admissionDate,
            birthDate: form.birthDate,
            observations: form.observations,
            operator: op ? { _id: op._id, name: op.name } : undefined
        };
        // Se tem arquivo novo, converte para base64 e inclui no payload JSON
        if (pendingFile.value) {
            payload.file = await fileToBase64(pendingFile.value);
        }
        else {
            payload.file = form.file; // Mantém arquivo existente (metadata only)
        }
        if (editingId.value) {
            await update({ id: editingId.value, data: payload });
        }
        else {
            await create(payload);
        }
        close();
    }
    catch (e) {
        console.error(e);
        snackbar.show('Erro ao salvar paciente', 'error');
    }
};
const open = (patient) => {
    pendingFile.value = null;
    if (patient) {
        Object.assign(form, patient);
        form.operatorId = patient.operator?._id || '';
        form.file = patient.file ? { name: patient.file.name, type: patient.file.type, size: patient.file.size } : null;
        editingId.value = patient._id;
    }
    else {
        Object.assign(form, {
            name: '', operatorId: '', admissionDate: '', birthDate: '', observations: '', file: null
        });
        editingId.value = null;
    }
    Object.keys(errors).forEach(k => delete errors[k]);
    isOpen.value = true;
    validateForm();
};
const close = () => {
    isOpen.value = false;
};
const __VLS_exposed = { open, close };
defineExpose(__VLS_exposed);
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
    maxWidth: "800px",
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.isOpen),
    maxWidth: "800px",
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
    ...{ class: 'pa-4' },
}));
const __VLS_15 = __VLS_14({
    ...{ class: 'text-h6' },
    ...{ class: 'font-weight-bold' },
    ...{ class: 'pa-4' },
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
const { default: __VLS_18 } = __VLS_16.slots;
(__VLS_ctx.editingId ? 'Editar Paciente' : 'Novo Paciente');
// @ts-ignore
[isOpen, editingId,];
var __VLS_16;
let __VLS_19;
/** @ts-ignore @type { | typeof __VLS_components.vCardText | typeof __VLS_components.VCardText | typeof __VLS_components['v-card-text']} */
vCardText;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    ...{ class: 'pa-4' },
}));
const __VLS_21 = __VLS_20({
    ...{ class: 'pa-4' },
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
const { default: __VLS_24 } = __VLS_22.slots;
let __VLS_25;
/** @ts-ignore @type { | typeof __VLS_components.vForm | typeof __VLS_components.VForm | typeof __VLS_components['v-form']} */
vForm;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    ...{ 'onSubmit': {} },
}));
const __VLS_27 = __VLS_26({
    ...{ 'onSubmit': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
let __VLS_30;
const __VLS_31 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.savePatient) });
const { default: __VLS_32 } = __VLS_28.slots;
let __VLS_33;
/** @ts-ignore @type { | typeof __VLS_components.vRow | typeof __VLS_components.VRow | typeof __VLS_components['v-row']} */
vRow;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({}));
const __VLS_35 = __VLS_34({}, ...__VLS_functionalComponentArgsRest(__VLS_34));
const { default: __VLS_38 } = __VLS_36.slots;
let __VLS_39;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
    cols: "12",
    md: "6",
}));
const __VLS_41 = __VLS_40({
    cols: "12",
    md: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
const { default: __VLS_44 } = __VLS_42.slots;
let __VLS_45;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
    modelValue: (__VLS_ctx.form.name),
    label: "Nome *",
    variant: "outlined",
    errorMessages: (__VLS_ctx.errors.name),
    placeholder: "Nome do paciente",
}));
const __VLS_47 = __VLS_46({
    modelValue: (__VLS_ctx.form.name),
    label: "Nome *",
    variant: "outlined",
    errorMessages: (__VLS_ctx.errors.name),
    placeholder: "Nome do paciente",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
// @ts-ignore
[savePatient, form, errors,];
var __VLS_42;
let __VLS_50;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
    cols: "12",
    md: "6",
}));
const __VLS_52 = __VLS_51({
    cols: "12",
    md: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
const { default: __VLS_55 } = __VLS_53.slots;
let __VLS_56;
/** @ts-ignore @type { | typeof __VLS_components.vAutocomplete | typeof __VLS_components.VAutocomplete | typeof __VLS_components['v-autocomplete']} */
vAutocomplete;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
    modelValue: (__VLS_ctx.form.operatorId),
    items: (__VLS_ctx.operators),
    itemTitle: "name",
    itemValue: "_id",
    label: "Operadora *",
    variant: "outlined",
    errorMessages: (__VLS_ctx.errors.operatorId),
    loading: (__VLS_ctx.isLoadingOps),
}));
const __VLS_58 = __VLS_57({
    modelValue: (__VLS_ctx.form.operatorId),
    items: (__VLS_ctx.operators),
    itemTitle: "name",
    itemValue: "_id",
    label: "Operadora *",
    variant: "outlined",
    errorMessages: (__VLS_ctx.errors.operatorId),
    loading: (__VLS_ctx.isLoadingOps),
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
// @ts-ignore
[form, errors, operators, isLoadingOps,];
var __VLS_53;
let __VLS_61;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
    cols: "12",
    md: "6",
}));
const __VLS_63 = __VLS_62({
    cols: "12",
    md: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
const { default: __VLS_66 } = __VLS_64.slots;
let __VLS_67;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
    modelValue: (__VLS_ctx.form.admissionDate),
    type: "date",
    label: "Data de Admissão (Opcional)",
    variant: "outlined",
    errorMessages: (__VLS_ctx.errors.admissionDate),
}));
const __VLS_69 = __VLS_68({
    modelValue: (__VLS_ctx.form.admissionDate),
    type: "date",
    label: "Data de Admissão (Opcional)",
    variant: "outlined",
    errorMessages: (__VLS_ctx.errors.admissionDate),
}, ...__VLS_functionalComponentArgsRest(__VLS_68));
// @ts-ignore
[form, errors,];
var __VLS_64;
let __VLS_72;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
    cols: "12",
    md: "6",
}));
const __VLS_74 = __VLS_73({
    cols: "12",
    md: "6",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
const { default: __VLS_77 } = __VLS_75.slots;
let __VLS_78;
/** @ts-ignore @type { | typeof __VLS_components.vTextField | typeof __VLS_components.VTextField | typeof __VLS_components['v-text-field']} */
vTextField;
// @ts-ignore
const __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
    modelValue: (__VLS_ctx.form.birthDate),
    type: "date",
    label: "Data de Nascimento (Opcional)",
    variant: "outlined",
    errorMessages: (__VLS_ctx.errors.birthDate),
}));
const __VLS_80 = __VLS_79({
    modelValue: (__VLS_ctx.form.birthDate),
    type: "date",
    label: "Data de Nascimento (Opcional)",
    variant: "outlined",
    errorMessages: (__VLS_ctx.errors.birthDate),
}, ...__VLS_functionalComponentArgsRest(__VLS_79));
// @ts-ignore
[form, errors,];
var __VLS_75;
let __VLS_83;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
    cols: "12",
}));
const __VLS_85 = __VLS_84({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_84));
const { default: __VLS_88 } = __VLS_86.slots;
let __VLS_89;
/** @ts-ignore @type { | typeof __VLS_components.vTextarea | typeof __VLS_components.VTextarea | typeof __VLS_components['v-textarea']} */
vTextarea;
// @ts-ignore
const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
    modelValue: (__VLS_ctx.form.observations),
    label: "Observações (Opcional)",
    variant: "outlined",
    rows: "3",
    counter: "500",
    errorMessages: (__VLS_ctx.errors.observations),
}));
const __VLS_91 = __VLS_90({
    modelValue: (__VLS_ctx.form.observations),
    label: "Observações (Opcional)",
    variant: "outlined",
    rows: "3",
    counter: "500",
    errorMessages: (__VLS_ctx.errors.observations),
}, ...__VLS_functionalComponentArgsRest(__VLS_90));
// @ts-ignore
[form, errors,];
var __VLS_86;
let __VLS_94;
/** @ts-ignore @type { | typeof __VLS_components.vCol | typeof __VLS_components.VCol | typeof __VLS_components['v-col']} */
vCol;
// @ts-ignore
const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
    cols: "12",
}));
const __VLS_96 = __VLS_95({
    cols: "12",
}, ...__VLS_functionalComponentArgsRest(__VLS_95));
const { default: __VLS_99 } = __VLS_97.slots;
let __VLS_100;
/** @ts-ignore @type { | typeof __VLS_components.vFileInput | typeof __VLS_components.VFileInput | typeof __VLS_components['v-file-input']} */
vFileInput;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.rawFiles),
    label: "Anexar Arquivo (Opcional, Máx 5MB)",
    variant: "outlined",
    chips: true,
    showSize: true,
    prependInnerIcon: "mdi-paperclip",
    prependIcon: "",
}));
const __VLS_102 = __VLS_101({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.rawFiles),
    label: "Anexar Arquivo (Opcional, Máx 5MB)",
    variant: "outlined",
    chips: true,
    showSize: true,
    prependInnerIcon: "mdi-paperclip",
    prependIcon: "",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
let __VLS_105;
const __VLS_106 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.processFile) });
var __VLS_103;
var __VLS_104;
if (__VLS_ctx.form.file) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)({
        ...{ class: 'd-flex' },
        ...{ class: 'flex-wrap' },
        ...{ class: 'gap-2' },
        ...{ class: 'mt-2' },
    });
    /** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
    let __VLS_107;
    /** @ts-ignore @type { | typeof __VLS_components.vChip | typeof __VLS_components.VChip | typeof __VLS_components['v-chip']} */
    vChip;
    // @ts-ignore
    const __VLS_108 = __VLS_asFunctionalComponent1(__VLS_107, new __VLS_107({
        ...{ 'onClick:close': {} },
        ...{ 'onClick': {} },
        closable: true,
        color: "primary",
        variant: "tonal",
    }));
    const __VLS_109 = __VLS_108({
        ...{ 'onClick:close': {} },
        ...{ 'onClick': {} },
        closable: true,
        color: "primary",
        variant: "tonal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_108));
    let __VLS_112;
    const __VLS_113 = ({ 'click:close': {} },
        { 'onClick:close': (__VLS_ctx.removeFile) });
    const __VLS_114 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.form.file))
                    return;
                __VLS_ctx.editingId && !__VLS_ctx.pendingFile ? __VLS_ctx.downloadFile(__VLS_ctx.form.file, __VLS_ctx.editingId) : null;
                // @ts-ignore
                [editingId, editingId, form, form, rawFiles, processFile, removeFile, pendingFile, downloadFile,];
            } });
    const { default: __VLS_115 } = __VLS_110.slots;
    let __VLS_116;
    /** @ts-ignore @type { | typeof __VLS_components.vIcon | typeof __VLS_components.VIcon | typeof __VLS_components['v-icon']} */
    vIcon;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({
        start: true,
        size: "small",
    }));
    const __VLS_118 = __VLS_117({
        start: true,
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    const { default: __VLS_121 } = __VLS_119.slots;
    // @ts-ignore
    [];
    var __VLS_119;
    (__VLS_ctx.form.file.name);
    (Math.round(__VLS_ctx.form.file.size / 1024));
    // @ts-ignore
    [form, form,];
    var __VLS_110;
    var __VLS_111;
}
// @ts-ignore
[];
var __VLS_97;
// @ts-ignore
[];
var __VLS_36;
// @ts-ignore
[];
var __VLS_28;
var __VLS_29;
// @ts-ignore
[];
var __VLS_22;
let __VLS_122;
/** @ts-ignore @type { | typeof __VLS_components.vCardActions | typeof __VLS_components.VCardActions | typeof __VLS_components['v-card-actions']} */
vCardActions;
// @ts-ignore
const __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({
    ...{ class: 'pa-4' },
    ...{ class: 'pt-0' },
}));
const __VLS_124 = __VLS_123({
    ...{ class: 'pa-4' },
    ...{ class: 'pt-0' },
}, ...__VLS_functionalComponentArgsRest(__VLS_123));
/** @type {__VLS_StyleScopedClasses['pa-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-0']} */ ;
const { default: __VLS_127 } = __VLS_125.slots;
let __VLS_128;
/** @ts-ignore @type { | typeof __VLS_components.vSpacer | typeof __VLS_components.VSpacer | typeof __VLS_components['v-spacer']} */
vSpacer;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({}));
const __VLS_130 = __VLS_129({}, ...__VLS_functionalComponentArgsRest(__VLS_129));
let __VLS_133;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133({
    ...{ 'onClick': {} },
    variant: "text",
}));
const __VLS_135 = __VLS_134({
    ...{ 'onClick': {} },
    variant: "text",
}, ...__VLS_functionalComponentArgsRest(__VLS_134));
let __VLS_138;
const __VLS_139 = ({ click: {} },
    { onClick: (__VLS_ctx.close) });
const { default: __VLS_140 } = __VLS_136.slots;
// @ts-ignore
[close,];
var __VLS_136;
var __VLS_137;
let __VLS_141;
/** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
vBtn;
// @ts-ignore
const __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141({
    ...{ 'onClick': {} },
    color: "primary",
    variant: "flat",
    loading: (__VLS_ctx.isSaving),
    disabled: (!__VLS_ctx.isValid),
}));
const __VLS_143 = __VLS_142({
    ...{ 'onClick': {} },
    color: "primary",
    variant: "flat",
    loading: (__VLS_ctx.isSaving),
    disabled: (!__VLS_ctx.isValid),
}, ...__VLS_functionalComponentArgsRest(__VLS_142));
let __VLS_146;
const __VLS_147 = ({ click: {} },
    { onClick: (__VLS_ctx.savePatient) });
const { default: __VLS_148 } = __VLS_144.slots;
(__VLS_ctx.editingId ? 'Atualizar' : 'Salvar');
// @ts-ignore
[editingId, savePatient, isSaving, isValid,];
var __VLS_144;
var __VLS_145;
// @ts-ignore
[];
var __VLS_125;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    setup: () => __VLS_exposed,
});
export default {};
