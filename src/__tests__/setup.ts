/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";

// Mock Tauri API for tests
export const mockInvoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
    invoke: mockInvoke,
}));

// Reset mocks before each test
beforeEach(() => {
    mockInvoke.mockReset();
});
