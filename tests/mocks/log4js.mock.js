export const configure = () => { };
export const getLogger = () => ({
    info: () => { },
    error: () => { },
    warn: () => { },
    debug: () => { },
    trace: () => { },
    fatal: () => { },
});
export default {
    configure,
    getLogger,
};
