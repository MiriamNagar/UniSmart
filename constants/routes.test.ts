import { ROUTES } from "@/constants/routes";

describe("ROUTES.ADMIN", () => {
  it("exposes admin notes and folder content paths", () => {
    expect(ROUTES.ADMIN.NOTES).toBe("/(admin)/notes");
    expect(ROUTES.ADMIN.FOLDER_CONTENT).toBe("/(admin)/folder-content");
  });
});
