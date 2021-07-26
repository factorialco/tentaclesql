// Convert objecto to one level of deepness
const flattenObject = (ob, separator = '.') => {
  const toReturn = {}

  for (const index in ob) {
    if (!ob.hasOwnProperty || !Object.prototype.hasOwnProperty.call(ob, index)) {
      continue
    }

    if ((typeof ob[index]) === 'object') {
      const flatObject = flattenObject(ob[index])
      for (const prop in flatObject) {
        if (!Object.prototype.hasOwnProperty.call(flatObject, prop)) {
          continue
        }

        toReturn[index + separator + prop] = flatObject[prop]
      }
    } else {
      toReturn[index] = ob[index]
    }
  }
  return toReturn
}

export default flattenObject
