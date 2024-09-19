export function sortObjectsByKeyOrder(
  objects: Record<string, any>[],
  orderedKeys: string[],
): Record<string, any>[] {
  return objects.map((obj) => {
    const sortedObj: Record<string, any> = {};
    orderedKeys.forEach((key) => {
      if (obj.hasOwnProperty(key)) {
        sortedObj[key] = obj[key];
      }
    });
    return sortedObj;
  });
}
