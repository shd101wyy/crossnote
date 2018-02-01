/**
 * {#identifier .class1 .class2 key1=value1 key2=value2}
 * @param text
 * @param asArray whether to return as Array or Object, default: false
 */
export function parseAttributes(text = "", asArray = false): object | string[] {
  text = text.trim();
  if (text[0] === "{" && text[text.length - 1] === "}") {
    text = text.slice(1, -1);
  }

  function findKey(start) {
    let end = start;
    while (end < text.length) {
      const char = text[end];
      if (char.match(/^[,;=\s:]$/)) {
        // end of key
        break;
      }
      end++;
    }
    let val: number | string | boolean = text.slice(start, end);

    // boolean
    if (val.match(/^true$/i)) {
      val = true;
    } else if (val.match(/^false$/i)) {
      val = false;
    } else if (!isNaN(val as any)) {
      // number
      val = parseFloat(val as any);
    }

    return [end, val];
  }

  function findString(start) {
    const quote = text[start];
    let end = start + 1;
    while (end < text.length) {
      if (text[end] === "\\") {
        end++;
        continue;
      }
      if (text[end] === quote) {
        break;
      }
      end++;
    }
    return [end, text.slice(start + 1, end)];
  }

  const output: { [key: string]: any } = {};
  const arr = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "#") {
      // id
      const [end, id] = findKey(i + 1);
      if (id) {
        output.id = id;
      }
      i = end;
    } else if (char === ".") {
      // class
      const [end, className] = findKey(i + 1);
      if (className) {
        if (!output.class) {
          output.class = className;
        } else {
          output.class += " " + className;
        }
      }
      i = end;
    } else if (char.match(/['"`]/)) {
      // string
      const [end, content] = findString(i);
      arr.push(content);
      i = end;
    } else if (char === "[") {
      let j = i + 1;
      let inString = false;
      let count = 1;
      while (j < text.length) {
        const char2 = text[j];
        if (char2.match(/['"`]/)) {
          inString = !inString;
        } else if (inString && char2 === "\\") {
          j += 1;
        } else if (!inString) {
          if (char2 === "[") {
            count += 1;
          } else if (char2 === "]") {
            count -= 1;
          }
        }
        if (count === 0) {
          break;
        }
        j += 1;
      }
      arr.push(parseAttributes(text.slice(i + 1, j), true));
      i = j;
    } else if (char.match(/^[\w-]$/)) {
      // key | val
      const [end, x] = findKey(i);
      if (asArray || arr.length % 2 || text[end] === "=") {
        arr.push(x);
      } else {
        output[x] = true;
      }
      i = end;
    } else if (char.match(/\W/)) {
      // not word
      continue;
    } else {
      throw new Error(
        `SyntaxError: Unexpected token ${char} in Attributes at position ${i}`
      );
    }
  }

  if (asArray) {
    return arr;
  }

  for (let i = 0; i < arr.length; i += 2) {
    if (i + 1 >= arr.length) {
      break;
    }
    const key = arr[i];
    const val = arr[i + 1];
    output[key] = val;
  }

  return output;
}

/**
 * Convert JSON object to attributes string
 * @param obj
 */
export function stringifyAttributes(
  obj: object,
  addCurlyParentheses: boolean = true
): string {
  let output = "";

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      output += `${key}=`;
      const value = obj[key];
      if (value instanceof Array) {
        output += "[";
        value.forEach((v, i) => {
          output += JSON.stringify(v);
          if (i + 1 !== value.length) {
            output += ", ";
          }
        });
        output += "]";
      } else {
        output += JSON.stringify(value);
      }
      output += " ";
    }
  }
  if (addCurlyParentheses) {
    return "{" + output.trim() + "}";
  } else {
    return output.trim();
  }
}
