
export class ConfigController {
    getConfig() {
        return {
            STUDY_LIST_LIMIT_COUNT: parseInt(process.env.STUDY_LIST_LIMIT_COUNT || '10'),
            STUDY_LIMIT_TIME: parseInt(process.env.STUDY_LIMIT_TIME || '45'),
            LOCAL_LLM_PROVIDER: !!process.env.LOCAL_LLM_PROVIDER,
        }
    }
}