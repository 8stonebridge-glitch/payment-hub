import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "ph_session";

// ── Auth Hook ───────────────────────────────────────────────
export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const currentUser = useQuery(api.auth.me, token ? { token } : "skip");

  const signIn = useMutation(api.auth.signIn);
  const signOutMut = useMutation(api.auth.signOut);

  const login = useCallback(async (email, password) => {
    const result = await signIn({ email, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    return result.user;
  }, [signIn]);

  const logout = useCallback(async () => {
    if (token) await signOutMut({ token });
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
  }, [token, signOutMut]);

  return {
    user: currentUser || null,
    token,
    login,
    logout,
    isLoading: token && currentUser === undefined,
  };
}

// ── Companies Hook ──────────────────────────────────────────
export function useCompanies(token) {
  const list = useQuery(api.companies.list) || [];
  const createMut = useMutation(api.companies.create);

  // Convert array to map for compatibility with existing UI
  const companiesMap = {};
  list.forEach((c) => {
    companiesMap[c.companyId] = {
      id: c.companyId,
      name: c.name,
      short: c.short,
      color: c.color,
      categories: c.categories,
      prefix: c.prefix,
    };
  });

  const addCompany = useCallback(async (co) => {
    await createMut({
      token,
      companyId: co.id,
      name: co.name,
      short: co.short,
      color: co.color,
      categories: co.categories,
      prefix: co.prefix,
    });
  }, [token, createMut]);

  return { companies: companiesMap, companiesList: list, addCompany };
}

// ── Users Hook ──────────────────────────────────────────────
export function useUsers() {
  const list = useQuery(api.users.list) || [];
  return { users: list };
}

// ── Requests Hook ───────────────────────────────────────────
export function useRequests(token) {
  const list = useQuery(api.requests.list, token ? { token } : "skip") || [];

  const createMut = useMutation(api.requests.create);
  const approveMut = useMutation(api.requests.approve);
  const rejectMut = useMutation(api.requests.reject);
  const recallMut = useMutation(api.requests.recall);
  const payMut = useMutation(api.requests.payItem);
  const proofReqMut = useMutation(api.requests.requestProof);
  const proofUpMut = useMutation(api.requests.uploadProof);
  const resubmitMut = useMutation(api.requests.resubmit);

  const createRequest = useCallback(async (data) => {
    return await createMut({
      token,
      company: data.company,
      category: data.category,
      description: data.description,
      lineItems: data.line_items.map((li) => ({
        description: li.description,
        paymentFor: li.payment_for || "",
        quantity: li.quantity,
        unitPrice: li.unit_price,
        total: li.total,
        beneficiaryName: li.beneficiary_name,
        accountNumber: li.account_number,
        bankName: li.bank_name,
      })),
    });
  }, [token, createMut]);

  const approve = useCallback(async (requestId) => {
    await approveMut({ token, requestId });
  }, [token, approveMut]);

  const reject = useCallback(async (requestId, reason, note) => {
    await rejectMut({ token, requestId, reason, note });
  }, [token, rejectMut]);

  const recall = useCallback(async (requestId) => {
    await recallMut({ token, requestId });
  }, [token, recallMut]);

  const pay = useCallback(async (requestId, lineItemId) => {
    return await payMut({ token, requestId, lineItemId });
  }, [token, payMut]);

  const requestProof = useCallback(async (requestId, lineItemId) => {
    await proofReqMut({ token, requestId, lineItemId });
  }, [token, proofReqMut]);

  const uploadProof = useCallback(async (requestId, lineItemId) => {
    await proofUpMut({ token, requestId, lineItemId });
  }, [token, proofUpMut]);

  const resubmit = useCallback(async (requestId, data) => {
    await resubmitMut({
      token,
      requestId,
      description: data.description,
      category: data.category,
      lineItems: data.line_items.map((li) => ({
        description: li.description,
        paymentFor: li.payment_for || "",
        quantity: li.quantity,
        unitPrice: li.unit_price,
        total: li.total,
        beneficiaryName: li.beneficiary_name,
        accountNumber: li.account_number,
        bankName: li.bank_name,
      })),
    });
  }, [token, resubmitMut]);

  return {
    requests: list,
    createRequest,
    approve,
    reject,
    recall,
    pay,
    requestProof,
    uploadProof,
    resubmit,
  };
}
