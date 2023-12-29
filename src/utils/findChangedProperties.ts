export default function findChangedProperties(obj1: Record<string, any>, obj2: Record<string, any>) {
    const changedProperties: Record<string, any> = {};

    for (const key in obj1) {
        if (obj1.hasOwnProperty(key)) {
            if (obj1[key] !== obj2[key]) {
                changedProperties[key] = obj2[key];
            }
        }
    }

    for (const key in obj2) {
        if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
            changedProperties[key] = obj2[key];
        }
    }

    return changedProperties;
}