module.exports = {
  collectCoverage: true,
  mapCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx,js}",
  ],
  moduleFileExtensions: ["ts", "tsx", "js"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: ["**/__tests__/*.(ts|tsx|js)"],
  testPathIgnorePatterns: ["/node_modules/", "/out/"]
};
