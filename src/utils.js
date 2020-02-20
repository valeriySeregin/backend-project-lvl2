import {
  union,
  isObject,
  isUndefined,
  isNull,
  flattenDeep,
} from 'lodash';

const compareValues = (before, after) => {
  if (isUndefined(before) && !isUndefined(after)) {
    return 'added';
  }
  if (!isUndefined(before) && isUndefined(after)) {
    return 'deleted';
  }
  if (before === after) {
    return 'unchanged';
  }

  return 'changed';
};

const getAst = (before, after) => {
  const keysFromBothObjects = union(Object.keys(before), Object.keys(after));

  const ast = keysFromBothObjects.reduce((acc, key) => {
    const beforeValue = before[key];
    const afterValue = after[key];

    if (isObject(beforeValue) && isObject(afterValue)) {
      return [...acc, {
        name: key,
        status: 'unchanged',
        value: null,
        children: getAst(beforeValue, afterValue),
      }];
    }

    const comparisonResult = compareValues(beforeValue, afterValue);

    if (comparisonResult === 'added') {
      return [...acc, {
        name: key,
        status: comparisonResult,
        value: afterValue,
        children: null,
      }];
    }

    if (comparisonResult === 'deleted') {
      return [...acc, {
        name: key,
        status: comparisonResult,
        value: beforeValue,
        children: null,
      }];
    }

    if (comparisonResult === 'changed') {
      return [...acc, {
        name: key,
        status: 'deleted',
        value: beforeValue,
        children: null,
      },
      {
        name: key,
        status: 'added',
        value: afterValue,
        children: null,
      }];
    }

    return [...acc, {
      name: key,
      status: 'unchanged',
      value: beforeValue,
      children: null,
    }];
  }, []);

  return ast;
};

const getSign = (status) => {
  switch (status) {
    case 'added':
      return '+ ';
    case 'deleted':
      return '- ';
    case 'unchanged':
      return '  ';
    default:
      break;
  }

  return '';
};

const render = (ast) => {
  const iter = (tree, count) => {
    const diffElementsArray = tree.reduce((acc, item) => {
      const {
        name,
        status,
        value,
        children,
      } = item;

      const indent = `${'    '.repeat(count)}`;
      const sign = getSign(status);

      if (!isNull(children)) {
        return [...acc, `${indent}  ${sign}${name}: {`, iter(children, count + 1), `${indent}    }`];
      }

      if (isObject(value)) {
        const astFromValue = getAst(value, value);
        return [...acc, `${indent}  ${sign}${name}: {`, iter(astFromValue, count + 1), `${indent}    }`];
      }

      return [...acc, `${indent}  ${sign}${name}: ${value}`];
    }, []);

    return diffElementsArray;
  };

  const flatDiffElements = flattenDeep(iter(ast, 0));
  const result = `{\n${flatDiffElements.join('\n')}\n}`;

  return result;
};

export { getAst, render };
