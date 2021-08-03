module.exports = {
  rootDir: "src",
  collectCoverage: true,
  collectCoverageFrom: ["**/*.ts", "!**/*.d.ts"],
  coverageDirectory: "../coverage",
  moduleFileExtensions: ["ts", "js"],
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  resetMocks: true,
};
