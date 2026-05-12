import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useSnackbarStore } from '@/stores/snackbarStore';
const router = useRouter();
const authStore = useAuthStore();
const snackbar = useSnackbarStore();
const processing = ref(false);
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const loginWithGoogle = () => {
    const redirectUri = window.location.origin;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile&prompt=select_account`;
    window.location.href = url;
};
const handleCallback = async () => {
    // Google retorna o token no hash da URL: #access_token=...&token_type=...
    const hash = window.location.hash.substring(1);
    if (!hash)
        return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (!accessToken)
        return;
    processing.value = true;
    // Limpa o hash da URL
    window.history.replaceState(null, '', window.location.pathname);
    try {
        const baseURL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${baseURL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken })
        });
        if (!res.ok) {
            const text = await res.text();
            let detail = 'Falha na autenticação';
            try {
                detail = JSON.parse(text).detail || detail;
            }
            catch { }
            snackbar.show(detail, 'error');
            processing.value = false;
            return;
        }
        const data = await res.json();
        if (data.success) {
            authStore.setAuth(data.token, data.user);
            snackbar.show('Login realizado com sucesso!', 'success');
            router.push('/dashboard');
        }
        else {
            snackbar.show('Falha na autenticação', 'error');
        }
    }
    catch (error) {
        console.error('Login error:', error);
        snackbar.show('Erro ao conectar com o servidor', 'error');
    }
    finally {
        processing.value = false;
    }
};
onMounted(() => {
    handleCallback();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.vContainer | typeof __VLS_components.VContainer | typeof __VLS_components['v-container']} */
vContainer;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ class: 'fill-height' },
    ...{ class: 'fluid' },
    ...{ class: 'pa-0' },
    ...{ class: 'd-flex' },
    ...{ class: 'align-center' },
    ...{ class: 'justify-center' },
}));
const __VLS_2 = __VLS_1({
    ...{ class: 'fill-height' },
    ...{ class: 'fluid' },
    ...{ class: 'pa-0' },
    ...{ class: 'd-flex' },
    ...{ class: 'align-center' },
    ...{ class: 'justify-center' },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['fill-height']} */ ;
/** @type {__VLS_StyleScopedClasses['fluid']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-0']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['align-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
const { default: __VLS_6 } = __VLS_3.slots;
let __VLS_7;
/** @ts-ignore @type { | typeof __VLS_components.vCard | typeof __VLS_components.VCard | typeof __VLS_components['v-card']} */
vCard;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    ...{ class: 'pa-8' },
    ...{ class: 'text-center' },
    elevation: "12",
    rounded: "lg",
    maxWidth: "400",
    width: "100%",
}));
const __VLS_9 = __VLS_8({
    ...{ class: 'pa-8' },
    ...{ class: 'text-center' },
    elevation: "12",
    rounded: "lg",
    maxWidth: "400",
    width: "100%",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
/** @type {__VLS_StyleScopedClasses['pa-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
const { default: __VLS_12 } = __VLS_10.slots;
let __VLS_13;
/** @ts-ignore @type { | typeof __VLS_components.vImg | typeof __VLS_components.VImg | typeof __VLS_components['v-img']} */
vImg;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    ...{ class: 'mx-auto' },
    ...{ class: 'mb-6' },
    src: "https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png",
    width: "120",
}));
const __VLS_15 = __VLS_14({
    ...{ class: 'mx-auto' },
    ...{ class: 'mb-6' },
    src: "https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1)({
    ...{ class: 'text-h5' },
    ...{ class: 'font-weight-bold' },
    ...{ class: 'mb-2' },
});
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['font-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p)({
    ...{ class: 'text-body-2' },
    ...{ class: 'text-medium-emphasis' },
    ...{ class: 'mb-8' },
});
/** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-medium-emphasis']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
if (!__VLS_ctx.processing) {
    let __VLS_18;
    /** @ts-ignore @type { | typeof __VLS_components.vBtn | typeof __VLS_components.VBtn | typeof __VLS_components['v-btn']} */
    vBtn;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        ...{ 'onClick': {} },
        ...{ class: 'mb-4' },
        color: "white",
        variant: "elevated",
        size: "large",
        block: true,
        prependIcon: "mdi-google",
    }));
    const __VLS_20 = __VLS_19({
        ...{ 'onClick': {} },
        ...{ class: 'mb-4' },
        color: "white",
        variant: "elevated",
        size: "large",
        block: true,
        prependIcon: "mdi-google",
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    let __VLS_23;
    const __VLS_24 = ({ click: {} },
        { onClick: (__VLS_ctx.loginWithGoogle) });
    /** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
    const { default: __VLS_25 } = __VLS_21.slots;
    // @ts-ignore
    [processing, loginWithGoogle,];
    var __VLS_21;
    var __VLS_22;
}
if (__VLS_ctx.processing) {
    let __VLS_26;
    /** @ts-ignore @type { | typeof __VLS_components.vProgressCircular | typeof __VLS_components.VProgressCircular | typeof __VLS_components['v-progress-circular']} */
    vProgressCircular;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        ...{ class: 'my-4' },
        indeterminate: true,
        size: "32",
        color: "primary",
    }));
    const __VLS_28 = __VLS_27({
        ...{ class: 'my-4' },
        indeterminate: true,
        size: "32",
        color: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    /** @type {__VLS_StyleScopedClasses['my-4']} */ ;
}
if (__VLS_ctx.processing) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p)({
        ...{ class: 'text-body-2' },
    });
    /** @type {__VLS_StyleScopedClasses['text-body-2']} */ ;
}
let __VLS_31;
/** @ts-ignore @type { | typeof __VLS_components.vDivider | typeof __VLS_components.VDivider | typeof __VLS_components['v-divider']} */
vDivider;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    ...{ class: 'my-4' },
}));
const __VLS_33 = __VLS_32({
    ...{ class: 'my-4' },
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
/** @type {__VLS_StyleScopedClasses['my-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p)({
    ...{ class: 'text-caption' },
    ...{ class: 'text-disabled' },
});
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-disabled']} */ ;
// @ts-ignore
[processing, processing,];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
