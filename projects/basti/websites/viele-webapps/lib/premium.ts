export type PremiumType = "monthly" | "yearly" | "lifetime" | null;

export function getPremiumStatus(): boolean {
  if (typeof window === "undefined") return false;
  
  const premium = localStorage.getItem("premium");
  if (!premium) return false;

  const premiumData = JSON.parse(premium);
  const now = Date.now();

  if (premiumData.type === "lifetime") {
    return true;
  }

  if (premiumData.type === "monthly" || premiumData.type === "yearly") {
    return premiumData.expiresAt > now;
  }

  return false;
}

export function getPremiumType(): PremiumType {
  if (typeof window === "undefined") return null;
  
  const premium = localStorage.getItem("premium");
  if (!premium) return null;

  const premiumData = JSON.parse(premium);
  const now = Date.now();

  if (premiumData.type === "lifetime") {
    return "lifetime";
  }

  if (premiumData.type === "monthly" || premiumData.type === "yearly") {
    if (premiumData.expiresAt > now) {
      return premiumData.type;
    }
  }

  return null;
}

export function setPremium(type: "monthly" | "yearly" | "lifetime"): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  let expiresAt: number;

  if (type === "lifetime") {
    expiresAt = Number.MAX_SAFE_INTEGER;
  } else if (type === "monthly") {
    expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
  } else {
    expiresAt = now + 365 * 24 * 60 * 60 * 1000; // 365 days
  }

  const premiumData = {
    type,
    expiresAt,
    purchasedAt: now,
  };

  localStorage.setItem(
    "premium",
    JSON.stringify(premiumData)
  );

  // Also set simple premium flag for compatibility
  localStorage.setItem("premium_flag", "true");
}

