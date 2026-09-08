import {
  hasEveryUserPermission,
  hasUserPermission,
  isPlatformAdminUser,
  PERMISSIONS,
} from "./permissions";

describe("multi-tenant role permissions", () => {
  const businessOwner = {
    isPlatformAdmin: false,
    permissions: ["*"],
    activeBusinessId: "business-a",
  };

  const platformOwner = {
    isPlatformAdmin: true,
    permissions: ["*"],
  };

  test("business wildcard allows business features", () => {
    expect(
      hasUserPermission(businessOwner, PERMISSIONS.INVOICES_VIEW)
    ).toBe(true);
    expect(
      hasEveryUserPermission(businessOwner, [
        PERMISSIONS.CLIENTS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW,
      ])
    ).toBe(true);
  });

  test("business wildcard does not grant platform management", () => {
    expect(isPlatformAdminUser(businessOwner)).toBe(false);
    expect(
      hasUserPermission(
        businessOwner,
        PERMISSIONS.PLATFORM_MANAGE_BUSINESSES
      )
    ).toBe(false);
  });

  test("platform flag grants platform management", () => {
    expect(isPlatformAdminUser(platformOwner)).toBe(true);
    expect(
      hasUserPermission(
        platformOwner,
        PERMISSIONS.PLATFORM_MANAGE_BUSINESSES
      )
    ).toBe(true);
  });

  test("explicit platform permission grants platform management", () => {
    const user = {
      isPlatformAdmin: false,
      permissions: [PERMISSIONS.PLATFORM_MANAGE_BUSINESSES],
    };

    expect(isPlatformAdminUser(user)).toBe(true);
    expect(
      hasUserPermission(user, PERMISSIONS.PLATFORM_MANAGE_BUSINESSES)
    ).toBe(true);
  });

  test("phase 6 permission keys exist", () => {
    expect(PERMISSIONS.SALESMEN_VIEW).toBe("salesmen.view");
    expect(PERMISSIONS.SALESMEN_CREATE).toBe("salesmen.create");
    expect(PERMISSIONS.SALESMEN_UPDATE).toBe("salesmen.update");
    expect(PERMISSIONS.SALESMEN_ARCHIVE).toBe("salesmen.archive");
    expect(PERMISSIONS.VISITS_VIEW).toBe("visits.view");
    expect(PERMISSIONS.VISITS_CREATE).toBe("visits.create");
    expect(PERMISSIONS.VISITS_UPDATE).toBe("visits.update");
    expect(PERMISSIONS.VISITS_DELETE).toBe("visits.delete");
    expect(PERMISSIONS.ORDERS_VIEW).toBe("orders.view");
    expect(PERMISSIONS.ORDERS_VIEW_OWN).toBe("orders.view_own");
    expect(PERMISSIONS.ORDERS_CREATE).toBe("orders.create");
    expect(PERMISSIONS.ORDERS_UPDATE).toBe("orders.update");
    expect(PERMISSIONS.ORDERS_SUBMIT).toBe("orders.submit");
    expect(PERMISSIONS.ORDERS_CANCEL).toBe("orders.cancel");
    expect(PERMISSIONS.ORDERS_CONVERT).toBe("orders.convert");
  });

  test("orders view or view_own allows route-style any-of check", () => {
    const booker = {
      permissions: [PERMISSIONS.ORDERS_VIEW_OWN, PERMISSIONS.ORDERS_CREATE],
    };
    expect(
      hasUserPermission(booker, [
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_VIEW_OWN,
      ])
    ).toBe(true);
    expect(hasUserPermission(booker, PERMISSIONS.ORDERS_VIEW)).toBe(false);
  });
});
