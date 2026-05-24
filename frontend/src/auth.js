const USER_STORAGE_KEY = "user";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function debitStoredBalance(amount) {
  const user = getStoredUser();

  if (!user) {
    return null;
  }

  const debitAmount = Number(amount) || 0;
  const nextUser = {
    ...user,
    balance: Math.max((Number(user.balance) || 0) - debitAmount, 0),
  };

  storeUser(nextUser);
  return nextUser;
}

export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem("shadowauth_user");
}

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}
