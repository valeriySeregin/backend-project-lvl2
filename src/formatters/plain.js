const stringify = (value) => {
  switch (typeof value) {
    case ('object'):
      return '[complex value]';
    case ('string'):
      return `'${value}'`;
    default:
      return value;
  }
};

const generatePath = (parents, currentKey) => [...parents, currentKey].join('.');

const mappings = {
  nested: (node, parentKeys, iter) => iter(node.children, [...parentKeys, node.key]),
  unchanged: () => null,
  changed: (node, parentKeys) => {
    const oldVal = stringify(node.oldValue);
    const newVal = stringify(node.newValue);
    return `Property '${generatePath(parentKeys, node.key)}' was changed from ${oldVal} to ${newVal}`;
  },
  added: (node, parentKeys) => `Property '${generatePath(parentKeys, node.key)}' was added with value: ${stringify(node.value)}`,
  deleted: (node, parentKeys) => `Property '${generatePath(parentKeys, node.key)}' was deleted`,
};

const iter = (ast, parentKeys) => ast.map((node) => mappings[node.state](node, parentKeys, iter));

const render = (ast) => iter(ast, [])
  .flat(Infinity)
  .filter((str) => str)
  .join('\n');

export default render;
