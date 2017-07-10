/**
 * Upload image
 * @param imageFilePath
 * @param method 'imgur' or 'sm.ms'
 */
export declare function uploadImage(imageFilePath: any, {method}: {
    method?: string;
}): Promise<string>;
