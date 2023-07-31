(() => {
  let json = null;

  const addNewBookmarkEventHandler = async (a) => {
    let param = {};
    let pathItem = json.paths[a.split('\n')[1]][a.split('\n')[0].toLowerCase()];
    param.name = camelCase(pathItem.summary);
    param.path = a.split('\n')[1].replace('{', '${');
    param.method = a.split('\n')[0].toLowerCase();

    let arr = [];
    param.suffix = '';
    if (pathItem.parameters?.length) {
      let str = '';
      for (let i = 0; i < pathItem.parameters.length; i++) {
        const element = pathItem.parameters[i];
        if (findKey(element.schema, '$ref')) {
          let ref = findKey(element.schema, '$ref').split('/').at(-1);
          let b = json.components.schemas[ref];
          str += `${element.name}:${b.title},`;
        } else {
          str += `${element.name}:${element.schema.type || 'number'},`;
        }
        if (element.in == 'query') {
          if (findKey(element, '$ref')) {
            let ref = findKey(element, '$ref');
            handelDataType(
              json.components.schemas[ref.split('/').at(-1)],
              json.components.schemas,
              arr
            );
          }
          console.log('elemen111', element);
          param.suffix += element.name + '=${' + element.name + '}&';
        }
      }
      if (param.suffix) {
        param.suffix = param.suffix.substring(0, param.suffix.length - 1);
      }
      param.pathParameter = str.substring(0, str.length - 1);
    }
    if (pathItem.requestBody) {
      let v = findKey(pathItem.requestBody, 'schema');
      if (v) {
        let ref = findKey(v, '$ref');
        if (ref) {
          handelDataType(
            json.components.schemas[ref.split('/').at(-1)],
            json.components.schemas,
            arr
          );
          param.type = json.components.schemas[ref.split('/').at(-1)].title;
        } else {
          const { type, items } = v;
          if (type == 'array') {
            param.type = `${items.type || 'number'}[]`;
          } else {
            param.type = type;
          }
        }
      }
    }
    arr = arr.join('\n').replaceAll('integer', 'number');
    param.inter = arr;
    chrome.storage.sync.set({
      path: param,
    });
  };
  const newElementLoaded = () => {
    const bookmarkBtnExists = document.getElementsByClassName('bookmark-btn');
    if (!bookmarkBtnExists.length) {
      const btngroup = document.getElementsByClassName('opblock-summary');
      for (let i = 0; i < btngroup.length; i++) {
        // bookmarkBtn = document.createElement('div');
        bookmarkBtn = document.createElement('img');
        bookmarkBtn.src = chrome.runtime.getURL('image/star.png');
        // bookmarkBtn.innerText = 'test';
        bookmarkBtn.className = 'bookmark-btn';
        btngroup[i].appendChild(bookmarkBtn);
        bookmarkBtn.addEventListener('click', () =>
          addNewBookmarkEventHandler(`${btngroup[i].innerText}`)
        );
      }
    }
  };
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, data } = obj;
    if (type === 'NEW') {
      console.log(3);
      json = data;
      newElementLoaded();
    }
  });
})();
const findKey = (obj, key) => {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = findKey(obj[i], key);
      if (result) {
        return result;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (let prop in obj) {
      if (prop === key) {
        return obj[prop];
      }
      const result = findKey(obj[prop], key);
      if (result) {
        return result;
      }
    }
  }
  return null;
};
function camelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}
function handelDataType(bodyProperties, allSchema, arr) {
  if (!bodyProperties) return;
  const { properties, required, type, title } = bodyProperties;
  if (type == 'object') {
    let body = `export interface $ {\n`;
    for (const key in properties) {
      const { type, items } = properties[key];
      let req = required?.includes(key);
      console.log('required', req);
      if (type) {
        if (type == 'array') {
          if (findKey(items, '$ref')) {
            let itemRef = findKey(items, '$ref').split('/').at(-1);
            let b = allSchema[itemRef];
            body += `  ${key}${!req ? '?' : ''}:${b.title}[];\n`;
            handelDataType(b, allSchema, arr);
          } else {
            body += `  ${key}${!req ? '?' : ''}:${items.type}[];\n`;
          }
        } else if (type == 'string' && type.enum) {
          arr.push(`export enum ${type.title} {${type.enum.join(',\n')}}`);
        } else {
          body += `  ${key}${!req ? '?' : ''}:${type};\n`;
        }
      } else {
        let ref = findKey(properties[key], '$ref');
        if (ref) {
          let b = allSchema[ref.split('/').at(-1)];
          body += `  ${key}${!req ? '?' : ''}:${b.title};\n`;
          handelDataType(b, allSchema, arr);
        }
      }
    }
    body = body.replaceAll('$', title);
    body += '}\n';
    arr.push(body);
  } else {
    if (bodyProperties.enum) {
      arr.push(
        `export type ${title} =${bodyProperties.enum
          .map((i) => (type == 'integer' ? i : `"${i}"`))
          .join(' | ')};`
      );
    }
  }
}