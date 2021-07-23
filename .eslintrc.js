module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  plugins: [
    "standard",
    "security",
    "@typescript-eslint"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    project: "./src/tsconfig.json"
  },
  rules: {
    quotes: [2, "double"],
    semi: [2, "always"],

    // The correct setup to fix no-unused-vars complaining about prop function params
    // https://stackoverflow.com/questions/57802057/eslint-configuring-no-unused-vars-for-typescript
    "@typescript-eslint/no-unused-vars": 1,
    "no-unused-vars": 0,
    "no-undef": 0,

    // https://stackoverflow.com/questions/63818415/react-was-used-before-it-was-defined
    "no-use-before-define": [0],
    "@typescript-eslint/no-use-before-define": [2],    

    "space-before-function-paren": [0],
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/no-empty-interface": 0,
    "@typescript-eslint/require-await": 0,
    "@typescript-eslint/restrict-template-expressions": 0,
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: false
      }
    ],

    // Temp disable
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-inferrable-types": 0,
    "@typescript-eslint/no-unsafe-assignment": 0,
    "@typescript-eslint/no-unsafe-call": 0,
    "@typescript-eslint/no-unsafe-member-access": 0,
    "@typescript-eslint/no-unused-vars": 0,
    "@typescript-eslint/no-use-before-define": 0,
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/unbound-method": 0
  }
};
