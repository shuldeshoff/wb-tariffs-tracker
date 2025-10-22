/**
 * Example test file - demonstrates test structure
 * Real tests should be written after configuring test environment properly
 */

describe("Example Test Suite", () => {
    it("should pass a simple test", () => {
        expect(1 + 1).toBe(2);
    });

    it("should work with strings", () => {
        const str = "hello";
        expect(str).toBe("hello");
        expect(str.length).toBe(5);
    });

    it("should work with arrays", () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    });

    it("should work with objects", () => {
        const obj = { name: "test", value: 123 };
        expect(obj).toHaveProperty("name");
        expect(obj.value).toBe(123);
    });
});

