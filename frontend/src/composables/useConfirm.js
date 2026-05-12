import { ref } from 'vue';
const isOpen = ref(false);
const title = ref('Confirmar Ação');
const message = ref('');
let resolveCallback = null;
export function useConfirm() {
    const confirm = (msg, titleText = 'Confirmar Exclusão') => {
        title.value = titleText;
        message.value = msg;
        isOpen.value = true;
        return new Promise((resolve) => {
            resolveCallback = resolve;
        });
    };
    const accept = () => {
        isOpen.value = false;
        if (resolveCallback)
            resolveCallback(true);
    };
    const cancel = () => {
        isOpen.value = false;
        if (resolveCallback)
            resolveCallback(false);
    };
    return { confirm, isOpen, title, message, accept, cancel };
}
