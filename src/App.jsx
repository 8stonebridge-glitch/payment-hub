import { useState, useEffect, useCallback, useRef } from "react";

// ── Company & Category Config ──────────────────────────────────────────
let COMPANIES = {
    quickmove: {
        id: "quickmove", name: "QuickMove Logistics", short: "QML", color: "#00C896",
        categories: ["Repair", "Movement", "Commission", "Others"],
        prefix: { Repair: "QR", Movement: "QM", Commission: "QC", Others: "QO" }
    },
    aerocool: {
        id: "aerocool", name: "AeroCool Services", short: "ACS", color: "#54A0FF",
        categories: ["Purchase", "Repair", "Logistics", "Others"],
        prefix: { Purchase: "AP", Repair: "AR", Logistics: "AL", Others: "AO" }
    }
};

const USERS = {
    qr1: { id: "qr1", name: "Adebayo Ogundimu", email: "adebayo@quickmove.ng", role: "requester", company: "quickmove" },
    qr2: { id: "qr2", name: "Fatima Bello", email: "fatima@quickmove.ng", role: "requester", company: "quickmove" },
    ar1: { id: "ar1", name: "Emeka Nwosu", email: "emeka@aerocool.ng", role: "requester", company: "aerocool" },
    adm1: { id: "adm1", name: "Chidinma Okafor", email: "chidinma@paymenthub.ng", role: "admin", company: "all" },
    adm2: { id: "adm2", name: "Tolu Bakare", email: "tolu@paymenthub.ng", role: "admin", company: "all" },
    fin1: { id: "fin1", name: "Olumide Adeyemi", email: "olumide@paymenthub.ng", role: "finance", company: "all" },
};

const BANKS = ["Access Bank", "Ecobank", "Fidelity Bank", "First Bank", "FCMB", "GTBank", "Keystone Bank", "Kuda", "Moniepoint", "Opay", "Palmpay", "Polaris Bank", "Stanbic IBTC", "Sterling Bank", "UBA", "Union Bank", "Unity Bank", "Wema Bank", "Zenith Bank"];
const REJECTION_REASONS = ["Incorrect pricing / amounts", "Wrong or missing vendor details", "Not an approved vendor", "Duplicate request", "Insufficient budget", "Missing supporting documents", "Wrong category", "Other (see note)"];

const fmtNGN = (kobo) => "\u20A6" + (kobo / 100).toLocaleString("en-NG");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const fmtFull = (d) => fmtDate(d) + " \u00B7 " + fmtTime(d);
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
let paySeq = 100;
const genPayRef = () => { const d = new Date(); const ds = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0"); paySeq++; return "TRF-" + ds + "-" + String(paySeq).padStart(3, "0"); };

const SEED = [
    {
        id: uid(), ref_id: "QM-074", date: "2026-02-11", company: "quickmove", category: "Movement",
        requester_id: "qr1", description: "1 Small truck Awosika to Oshodi + Labourers",
        total_amount: 5500000, status: "approved", approved_by: "adm1", approved_at: "2026-02-11T10:30:00Z",
        rejected_reason: null, rejected_note: null, rejected_by: null, resubmit_count: 0,
        created_at: "2026-02-11T08:12:00Z", updated_at: "2026-02-11T10:30:00Z",
        line_items: [
            { id: uid(), description: "Truck JJJ936YF \u2014 Awosika to Oshodi", payment_for: "Truck Driver", quantity: 1, unit_price: 4500000, total: 4500000, beneficiary_name: "Ogundele Kolawole Aderibigbe", account_number: "0232097299", bank_name: "GTBank", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 0 },
            { id: uid(), description: "Labourers Loading \u2014 Oshodi", payment_for: "Loading Crew", quantity: 1, unit_price: 500000, total: 500000, beneficiary_name: "Moses Emmanuel Ogah", account_number: "8027183014", bank_name: "Opay", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 1 },
            { id: uid(), description: "Labourers Offloading \u2014 Awoshika", payment_for: "Offloading Crew", quantity: 1, unit_price: 500000, total: 500000, beneficiary_name: "Shakira Titilope Adeosun", account_number: "9550221140", bank_name: "Palmpay", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 2 },
        ],
        timeline: [
            { id: uid(), action: "submitted", actor_name: "Adebayo Ogundimu", note: "Request submitted", created_at: "2026-02-11T08:12:00Z" },
            { id: uid(), action: "approved", actor_name: "Chidinma Okafor", note: "Approved for payment", created_at: "2026-02-11T10:30:00Z" },
        ]
    },
    {
        id: uid(), ref_id: "QM-075", date: "2026-02-12", company: "quickmove", category: "Movement",
        requester_id: "qr1", description: "2 Trucks Lagos to Ibadan \u2014 Flour delivery",
        total_amount: 15000000, status: "pending",
        approved_by: null, approved_at: null, rejected_reason: null, rejected_note: null, rejected_by: null, resubmit_count: 0,
        created_at: "2026-02-12T09:45:00Z", updated_at: "2026-02-12T09:45:00Z",
        line_items: [
            { id: uid(), description: "Truck ABC123 \u2014 Lagos to Ibadan", payment_for: "Truck Driver", quantity: 1, unit_price: 8000000, total: 8000000, beneficiary_name: "Ibrahim Suleiman", account_number: "0123456789", bank_name: "First Bank", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 0 },
            { id: uid(), description: "Truck DEF456 \u2014 Lagos to Ibadan", payment_for: "Truck Driver", quantity: 1, unit_price: 7000000, total: 7000000, beneficiary_name: "Blessing Nwankwo", account_number: "9876543210", bank_name: "UBA", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 1 },
        ],
        timeline: [
            { id: uid(), action: "submitted", actor_name: "Adebayo Ogundimu", note: "Request submitted", created_at: "2026-02-12T09:45:00Z" },
        ]
    },
    {
        id: uid(), ref_id: "QR-041", date: "2026-02-10", company: "quickmove", category: "Repair",
        requester_id: "qr2", description: "Engine overhaul \u2014 Truck JJJ936YF",
        total_amount: 35000000, status: "paid",
        approved_by: "adm1", approved_at: "2026-02-10T11:00:00Z", rejected_reason: null, rejected_note: null, rejected_by: null, resubmit_count: 0,
        created_at: "2026-02-10T07:30:00Z", updated_at: "2026-02-10T15:20:00Z",
        line_items: [
            { id: uid(), description: "Engine parts supply", payment_for: "Parts Supplier", quantity: 1, unit_price: 25000000, total: 25000000, beneficiary_name: "Autoparts Nigeria Ltd", account_number: "1234567890", bank_name: "Zenith Bank", is_paid: true, paid_by: "fin1", paid_at: "2026-02-10T14:00:00Z", payment_ref: "TRF-20260210-001", proof_requested: true, proof_image_url: "receipt.jpg", sort_order: 0 },
            { id: uid(), description: "Mechanic labour", payment_for: "Mechanic", quantity: 1, unit_price: 10000000, total: 10000000, beneficiary_name: "Chukwu Emeka", account_number: "0987654321", bank_name: "Access Bank", is_paid: true, paid_by: "fin1", paid_at: "2026-02-10T15:20:00Z", payment_ref: "TRF-20260210-002", proof_requested: false, proof_image_url: null, sort_order: 1 },
        ],
        timeline: [
            { id: uid(), action: "submitted", actor_name: "Fatima Bello", note: "Request submitted", created_at: "2026-02-10T07:30:00Z" },
            { id: uid(), action: "approved", actor_name: "Chidinma Okafor", note: "Approved", created_at: "2026-02-10T11:00:00Z" },
            { id: uid(), action: "paid", actor_name: "Olumide Adeyemi", note: "Paid Autoparts Nigeria Ltd \u2014 TRF-20260210-001", created_at: "2026-02-10T14:00:00Z" },
            { id: uid(), action: "paid", actor_name: "Olumide Adeyemi", note: "Paid Chukwu Emeka \u2014 TRF-20260210-002", created_at: "2026-02-10T15:20:00Z" },
        ]
    },
    {
        id: uid(), ref_id: "QC-008", date: "2026-02-13", company: "quickmove", category: "Commission",
        requester_id: "qr1", description: "Agent commission \u2014 February loads",
        total_amount: 7500000, status: "rejected",
        approved_by: null, approved_at: null, rejected_reason: "Incorrect pricing / amounts", rejected_note: "Commission rate should be 5% not 8%. Recalculate and resubmit.",
        rejected_by: "adm1", resubmit_count: 0,
        created_at: "2026-02-13T11:00:00Z", updated_at: "2026-02-13T14:00:00Z",
        line_items: [
            { id: uid(), description: "Agent commission \u2014 Ojo Transport", payment_for: "Transport Agent", quantity: 1, unit_price: 7500000, total: 7500000, beneficiary_name: "Ojo Transport Agency", account_number: "5566778899", bank_name: "Kuda", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 0 },
        ],
        timeline: [
            { id: uid(), action: "submitted", actor_name: "Adebayo Ogundimu", note: "Request submitted", created_at: "2026-02-13T11:00:00Z" },
            { id: uid(), action: "rejected", actor_name: "Chidinma Okafor", note: "Incorrect pricing / amounts \u2014 Commission rate should be 5% not 8%.", created_at: "2026-02-13T14:00:00Z" },
        ]
    },
    {
        id: uid(), ref_id: "QM-076", date: "2026-02-14", company: "quickmove", category: "Movement",
        requester_id: "qr1", description: "Truck Ikorodu to Apapa \u2014 Container",
        total_amount: 9500000, status: "partially_paid",
        approved_by: "adm1", approved_at: "2026-02-14T09:00:00Z", rejected_reason: null, rejected_note: null, rejected_by: null, resubmit_count: 0,
        created_at: "2026-02-14T07:00:00Z", updated_at: "2026-02-14T12:00:00Z",
        line_items: [
            { id: uid(), description: "Truck \u2014 Ikorodu to Apapa", payment_for: "Truck Driver", quantity: 1, unit_price: 7500000, total: 7500000, beneficiary_name: "Tunde Bakare", account_number: "3344556677", bank_name: "Sterling Bank", is_paid: true, paid_by: "fin1", paid_at: "2026-02-14T12:00:00Z", payment_ref: "TRF-20260214-001", proof_requested: false, proof_image_url: null, sort_order: 0 },
            { id: uid(), description: "Labourers \u2014 Apapa offloading", payment_for: "Offloading Crew", quantity: 1, unit_price: 2000000, total: 2000000, beneficiary_name: "Yusuf Abdullahi", account_number: "1122334455", bank_name: "Moniepoint", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 1 },
        ],
        timeline: [
            { id: uid(), action: "submitted", actor_name: "Adebayo Ogundimu", note: "Request submitted", created_at: "2026-02-14T07:00:00Z" },
            { id: uid(), action: "approved", actor_name: "Chidinma Okafor", note: "Approved", created_at: "2026-02-14T09:00:00Z" },
            { id: uid(), action: "paid", actor_name: "Olumide Adeyemi", note: "Paid Tunde Bakare \u2014 TRF-20260214-001", created_at: "2026-02-14T12:00:00Z" },
        ]
    },
    {
        id: uid(), ref_id: "AP-015", date: "2026-02-12", company: "aerocool", category: "Purchase",
        requester_id: "ar1", description: "3x Samsung WindFree AC units \u2014 Lekki office",
        total_amount: 180000000, status: "approved",
        approved_by: "adm1", approved_at: "2026-02-12T14:00:00Z", rejected_reason: null, rejected_note: null, rejected_by: null, resubmit_count: 0,
        created_at: "2026-02-12T10:00:00Z", updated_at: "2026-02-12T14:00:00Z",
        line_items: [
            { id: uid(), description: "Samsung WindFree 1.5HP x 3", payment_for: "AC Supplier", quantity: 3, unit_price: 45000000, total: 135000000, beneficiary_name: "CoolZone Electronics", account_number: "2233445566", bank_name: "GTBank", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 0 },
            { id: uid(), description: "Installation \u2014 3 units", payment_for: "Installer", quantity: 3, unit_price: 15000000, total: 45000000, beneficiary_name: "AC Install Pro", account_number: "7788990011", bank_name: "Access Bank", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 1 },
        ],
        timeline: [
            { id: uid(), action: "submitted", actor_name: "Emeka Nwosu", note: "Request submitted", created_at: "2026-02-12T10:00:00Z" },
            { id: uid(), action: "approved", actor_name: "Chidinma Okafor", note: "Approved for payment", created_at: "2026-02-12T14:00:00Z" },
        ]
    },
    {
        id: uid(), ref_id: "AR-009", date: "2026-02-14", company: "aerocool", category: "Repair",
        requester_id: "ar1", description: "AC compressor replacement \u2014 VI branch",
        total_amount: 8500000, status: "pending",
        approved_by: null, approved_at: null, rejected_reason: null, rejected_note: null, rejected_by: null, resubmit_count: 0,
        created_at: "2026-02-14T08:30:00Z", updated_at: "2026-02-14T08:30:00Z",
        line_items: [
            { id: uid(), description: "Compressor unit + gas refill", payment_for: "Parts Supplier", quantity: 1, unit_price: 6500000, total: 6500000, beneficiary_name: "CoolTech Repairs", account_number: "4455667788", bank_name: "Zenith Bank", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 0 },
            { id: uid(), description: "Technician labour", payment_for: "Technician", quantity: 1, unit_price: 2000000, total: 2000000, beneficiary_name: "Francis Okoro", account_number: "9900112233", bank_name: "Opay", is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: 1 },
        ],
        timeline: [
            { id: uid(), action: "submitted", actor_name: "Emeka Nwosu", note: "Request submitted", created_at: "2026-02-14T08:30:00Z" },
        ]
    },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
:root{--bg:#0C0E14;--bg2:#14171F;--bg3:#1C2029;--bg4:#252936;--border:#2A2F3E;--border2:#363C4E;--text:#ECF0F6;--text2:#99A1B5;--text3:#636B82;--accent:#00C896;--accent2:#00A67A;--ad:rgba(0,200,150,0.08);--warn:#FF5C5C;--wd:rgba(255,92,92,0.08);--orange:#FF9F43;--od:rgba(255,159,67,0.08);--blue:#54A0FF;--bd:rgba(84,160,255,0.08);--purple:#A78BFA;--pd:rgba(167,139,250,0.08);--r:14px;--rs:10px;--f:'DM Sans',-apple-system,sans-serif;--m:'JetBrains Mono',monospace}
*{margin:0;padding:0;box-sizing:border-box}html,body,#root{height:100%;background:var(--bg);color:var(--text);font-family:var(--f);-webkit-font-smoothing:antialiased}
.app{display:flex;flex-direction:column;min-height:100%;max-width:480px;margin:0 auto;position:relative;background:var(--bg)}.app.logged-in{height:100%;overflow:hidden}
.login-page{display:flex;flex-direction:column;padding-bottom:40px}.login-hero{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px 24px 28px;text-align:center;background:linear-gradient(180deg,var(--bg2) 0%,var(--bg) 100%)}.login-logo{width:60px;height:60px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;color:var(--bg);margin-bottom:14px}.login-app-name{font-size:24px;font-weight:700;letter-spacing:-.5px;margin-bottom:4px}.login-sub{font-size:13px;color:var(--text3)}.login-section{padding:20px 20px 10px}.login-section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text3);margin-bottom:12px}
.company-cards{display:flex;gap:10px;margin-bottom:8px}.company-card{flex:1;background:var(--bg2);border:2px solid var(--border);border-radius:var(--r);padding:16px 10px;text-align:center;cursor:pointer;transition:all .15s}.company-card:hover{border-color:var(--border2);transform:translateY(-1px)}.company-card.selected{border-color:var(--accent);background:var(--ad)}.cc-icon{width:42px;height:42px;border-radius:12px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff}.cc-name{font-size:13px;font-weight:600;line-height:1.3}.cc-tag{font-size:10px;color:var(--text3);margin-top:4px}
.user-list{display:flex;flex-direction:column;gap:6px;padding:0 20px 24px}.user-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);cursor:pointer;transition:all .15s}.user-row:hover{border-color:var(--border2);background:var(--bg3)}.user-row:active{transform:scale(.98)}.ur-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}.ur-info{flex:1}.ur-name{font-size:14px;font-weight:600}.ur-email{font-size:12px;color:var(--text3)}.ur-role{font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:.4px}
.header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--bg2);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;min-height:54px}.header-left{display:flex;align-items:center;gap:10px}.header-logo{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff}.header-title{font-size:16px;font-weight:600;letter-spacing:-.3px}.header-right{display:flex;align-items:center;gap:8px}.avatar{width:32px;height:32px;border-radius:50%;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--text2);cursor:pointer;transition:all .15s}.avatar:hover{background:var(--border)}
.role-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:.4px}.role-badge.requester{background:var(--bd);color:var(--blue)}.role-badge.admin{background:var(--od);color:var(--orange)}.role-badge.finance{background:var(--ad);color:var(--accent)}
.content{flex:1;overflow-y:auto;overflow-x:hidden;padding-bottom:80px;scroll-behavior:smooth}.content::-webkit-scrollbar{width:0}
.nav{display:flex;position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:var(--bg2);border-top:1px solid var(--border);padding:4px 6px 8px;z-index:100}.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;border-radius:var(--rs);cursor:pointer;transition:all .15s;position:relative}.nav-item:hover{background:var(--bg3)}.nav-item.active{color:var(--accent)}.n-icon{font-size:18px;opacity:.4;transition:opacity .15s}.nav-item.active .n-icon{opacity:1}.n-label{font-size:10px;font-weight:500;color:var(--text3);transition:color .15s}.nav-item.active .n-label{color:var(--accent)}.badge{position:absolute;top:0;right:calc(50% - 18px);min-width:18px;height:18px;border-radius:9px;background:var(--warn);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px}
.stat-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px 16px}.stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:14px 10px}.s-num{font-size:22px;font-weight:700;font-family:var(--m);letter-spacing:-1px}.s-val{font-size:11px;color:var(--text2);margin-top:2px;font-family:var(--m)}.s-lbl{font-size:10px;color:var(--text3);margin-top:6px;text-transform:uppercase;letter-spacing:.6px;font-weight:500}.stat-card.pending{border-color:rgba(255,159,67,.25)}.stat-card.pending .s-num{color:var(--orange)}.stat-card.approved{border-color:rgba(84,160,255,.25)}.stat-card.approved .s-num{color:var(--blue)}.stat-card.paid{border-color:rgba(0,200,150,.25)}.stat-card.paid .s-num{color:var(--accent)}
.section-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px}.section-title{font-size:14px;font-weight:600;color:var(--text2)}.section-link{font-size:13px;color:var(--accent);cursor:pointer;font-weight:500}
.req-list{padding:0 16px;display:flex;flex-direction:column;gap:8px}.req-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:14px;cursor:pointer;transition:all .15s}.req-card:hover{border-color:var(--border2);transform:translateY(-1px)}.req-card:active{transform:scale(.995)}.req-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}.req-ref{font-family:var(--m);font-size:13px;font-weight:600;color:var(--accent)}.req-cat{font-size:11px;color:var(--text3);margin-top:1px;display:flex;align-items:center;gap:4px}.cat-dot{width:6px;height:6px;border-radius:50%;display:inline-block}.req-desc{font-size:14px;color:var(--text);line-height:1.4;margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.req-bottom{display:flex;justify-content:space-between;align-items:center}.req-amount{font-family:var(--m);font-size:15px;font-weight:600}.req-meta{font-size:11px;color:var(--text3);text-align:right}
.status{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;padding:3px 10px;border-radius:99px;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap}.status.pending{background:var(--od);color:var(--orange)}.status.approved{background:var(--bd);color:var(--blue)}.status.paid{background:var(--ad);color:var(--accent)}.status.partially_paid{background:var(--pd);color:var(--purple)}.status.rejected{background:var(--wd);color:var(--warn)}.status.recalled{background:rgba(255,255,255,.06);color:var(--text3)}
.detail-header{padding:14px 16px;display:flex;align-items:center;gap:12px}.back-btn{width:36px;height:36px;border-radius:50%;background:var(--bg3);border:none;color:var(--text);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0}.back-btn:hover{background:var(--bg4)}.detail-title-group{flex:1;min-width:0}.detail-ref{font-family:var(--m);font-size:17px;font-weight:700;color:var(--accent)}.detail-cat{font-size:12px;color:var(--text3);display:flex;align-items:center;gap:4px;margin-top:1px}
.stepper{display:flex;align-items:center;padding:0 16px 14px;gap:0}.step{display:flex;flex-direction:column;align-items:center;gap:4px}.step-dot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;border:2px solid var(--border);color:var(--text3)}.step-dot.done{background:var(--accent);border-color:var(--accent);color:var(--bg)}.step-dot.current{border-color:var(--accent);color:var(--accent)}.step-dot.rejected{background:var(--warn);border-color:var(--warn);color:#fff}.step-dot.recalled{background:var(--bg4);border-color:var(--text3);color:var(--text3)}.step-line{flex:1;height:2px;background:var(--border);min-width:20px}.step-line.done{background:var(--accent)}.step-label{font-size:9px;color:var(--text3);white-space:nowrap}
.rejection-banner{margin:0 16px 12px;padding:14px;border-radius:var(--r);border:1px solid}.rejection-banner.rejected{background:var(--wd);border-color:rgba(255,92,92,.2)}.rejection-banner.recalled{background:rgba(255,255,255,.03);border-color:var(--border)}.rb-title{font-size:13px;font-weight:600;margin-bottom:6px;display:flex;align-items:center;gap:6px}.rb-reason{font-size:14px;font-weight:500;color:var(--text);margin-bottom:4px}.rb-note{font-size:13px;color:var(--text2);line-height:1.4}
.detail-info{padding:0 16px 12px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.info-item{background:var(--bg2);border-radius:var(--rs);padding:10px 12px}.info-label{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}.info-value{font-size:14px;font-weight:500}.info-value.amount{font-family:var(--m);color:var(--accent);font-weight:700}
.line-items-section{padding:10px 16px}.li-header{font-size:12px;font-weight:600;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px}.li-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:14px;margin-bottom:8px}.li-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}.li-desc{font-size:14px;font-weight:500;flex:1;margin-right:8px}.li-amount{font-family:var(--m);font-size:14px;font-weight:600;color:var(--accent);white-space:nowrap}.li-bank{display:flex;flex-direction:column;gap:3px;padding-top:8px;border-top:1px solid var(--border)}.li-bank-row{display:flex;justify-content:space-between;font-size:12px}.li-bank-label{color:var(--text3)}.li-bank-value{font-weight:500;color:var(--text2);font-family:var(--m)}.li-bank-name{font-weight:500;color:var(--text)}.li-actions{margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.li-paid-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:4px 10px;border-radius:99px;background:var(--ad);color:var(--accent);font-weight:600}.li-ref{font-size:11px;color:var(--text3);font-family:var(--m);margin-top:3px}
.pay-progress{display:flex;align-items:center;gap:10px;padding:0 16px 12px}.pay-progress-bar{flex:1;height:5px;background:var(--bg3);border-radius:99px;overflow:hidden}.pay-progress-fill{height:100%;background:linear-gradient(90deg,var(--accent),#00E6AC);border-radius:99px;transition:width .3s}.pay-progress-text{font-size:12px;color:var(--text2);font-family:var(--m);white-space:nowrap}
.timeline-section{padding:10px 16px 24px}.tl-item{display:flex;gap:12px;padding-bottom:14px;position:relative}.tl-item:last-child{padding-bottom:0}.tl-item::before{content:'';position:absolute;left:11px;top:24px;bottom:0;width:2px;background:var(--border)}.tl-item:last-child::before{display:none}.tl-dot{width:24px;height:24px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;z-index:1}.tl-dot.submitted{background:var(--bd);color:var(--blue)}.tl-dot.approved{background:var(--ad);color:var(--accent)}.tl-dot.rejected{background:var(--wd);color:var(--warn)}.tl-dot.paid{background:var(--ad);color:var(--accent)}.tl-dot.proof_requested{background:var(--od);color:var(--orange)}.tl-dot.proof_uploaded{background:var(--ad);color:var(--accent)}.tl-dot.resubmitted{background:var(--bd);color:var(--blue)}.tl-dot.recalled{background:rgba(255,255,255,.06);color:var(--text3)}.tl-content{flex:1;min-width:0}.tl-actor{font-size:13px;font-weight:600}.tl-note{font-size:13px;color:var(--text2);margin-top:2px;line-height:1.4}.tl-time{font-size:11px;color:var(--text3);margin-top:3px;font-family:var(--m)}
.action-bar{padding:12px 16px;display:flex;gap:8px;flex-wrap:wrap}.btn{padding:10px 18px;border-radius:var(--rs);border:none;font-family:var(--f);font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px}.btn:active{transform:scale(.97)}.btn-primary{background:var(--accent);color:var(--bg)}.btn-primary:hover{background:var(--accent2)}.btn-danger{background:var(--warn);color:#fff}.btn-danger:hover{opacity:.9}.btn-outline{background:transparent;border:1px solid var(--border);color:var(--text)}.btn-outline:hover{background:var(--bg3)}.btn-ghost{background:rgba(255,255,255,.04);border:none;color:var(--text2)}.btn-ghost:hover{background:var(--bg3);color:var(--text)}.btn-sm{padding:6px 12px;font-size:12px;border-radius:6px}.btn-block{width:100%}
.form-page{padding:16px}.form-group{margin-bottom:14px}.form-label{display:block;font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}.form-input,.form-select,.form-textarea{width:100%;padding:10px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-family:var(--f);font-size:14px;outline:none;transition:border-color .15s}.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--accent)}.form-textarea{min-height:72px;resize:vertical}.form-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239DA3B4' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}
.line-item-form{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:14px;margin-bottom:10px;position:relative}.line-item-num{font-size:11px;font-weight:600;color:var(--accent);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}.remove-item{position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:50%;background:var(--wd);border:none;color:var(--warn);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.grand-total{display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);margin-bottom:16px}.gt-label{font-size:14px;font-weight:600;color:var(--text2)}.gt-amount{font-family:var(--m);font-size:20px;font-weight:700;color:var(--accent)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:200;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)}.modal{background:var(--bg2);border-radius:16px 16px 0 0;max-width:480px;width:100%;padding:20px;max-height:70vh;overflow-y:auto;animation:slideUp .2s ease-out}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}.modal-title{font-size:17px;font-weight:700;margin-bottom:16px}
.search-bar{margin:14px 16px 10px;position:relative}.search-bar input{width:100%;padding:10px 14px 10px 38px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-family:var(--f);font-size:14px;outline:none}.search-bar input:focus{border-color:var(--accent)}.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:16px}.filter-chips{display:flex;gap:6px;padding:0 16px 10px;overflow-x:auto}.filter-chips::-webkit-scrollbar{display:none}.chip{padding:6px 14px;border-radius:99px;font-size:12px;font-weight:500;background:var(--bg3);color:var(--text3);border:1px solid transparent;cursor:pointer;white-space:nowrap;transition:all .15s}.chip.active{background:var(--ad);color:var(--accent);border-color:rgba(0,200,150,.2)}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;text-align:center}.empty-icon{font-size:36px;margin-bottom:10px;opacity:.25}.empty-title{font-size:14px;font-weight:600;color:var(--text2)}.empty-desc{font-size:13px;color:var(--text3);margin-top:4px}
.page-title{padding:14px 16px 0;font-size:19px;font-weight:700;letter-spacing:-.5px}.sub-label{font-size:13px;color:var(--text3);padding:0 16px;margin-top:2px}
.fab{position:fixed;bottom:84px;right:calc(50% - 212px);width:50px;height:50px;border-radius:50%;background:var(--accent);color:var(--bg);border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(0,200,150,.3);z-index:90;display:flex;align-items:center;justify-content:center;transition:all .15s}.fab:hover{transform:scale(1.05);box-shadow:0 6px 24px rgba(0,200,150,.4)}.fab:active{transform:scale(.95)}
.success-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.7);display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn .2s}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.success-check{width:72px;height:72px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:36px;color:var(--bg);margin-bottom:14px;animation:popIn .3s ease-out}@keyframes popIn{0%{transform:scale(0)}80%{transform:scale(1.1)}100%{transform:scale(1)}}.success-text{font-size:17px;font-weight:700}.success-sub{font-size:14px;color:var(--text2);margin-top:4px}
.user-menu{position:absolute;top:54px;right:8px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:8px;z-index:150;min-width:200px;box-shadow:0 8px 30px rgba(0,0,0,.5)}.um-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--rs)}.um-name{font-size:13px;font-weight:600}.um-detail{font-size:11px;color:var(--text3)}.signout-btn{padding:10px;text-align:center;font-size:13px;color:var(--warn);cursor:pointer;border-top:1px solid var(--border);margin-top:8px;font-weight:500}.signout-btn:hover{background:var(--wd);border-radius:var(--rs)}
.usr-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:14px;display:flex;align-items:center;gap:12px}.usr-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0}.usr-info{flex:1;min-width:0}.usr-name{font-size:14px;font-weight:600}.usr-email{font-size:12px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.usr-company{font-size:11px;color:var(--text3);margin-top:2px}.usr-role{font-size:10px;font-weight:600;padding:3px 10px;border-radius:99px;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}
.usr-section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);padding:16px 16px 8px}
.filter-chips-scroll{display:flex;gap:6px;padding:0 16px 10px;overflow-x:auto}.filter-chips-scroll::-webkit-scrollbar{display:none}
.date-filters{display:flex;gap:8px;padding:0 16px 10px;align-items:center}.date-filters label{font-size:11px;color:var(--text3);font-weight:500;white-space:nowrap}.date-filters input[type=date]{flex:1;padding:7px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-family:var(--f);font-size:12px;outline:none;min-width:0}.date-filters input[type=date]:focus{border-color:var(--accent)}.date-filters input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.6)}.date-clear{padding:4px 8px;border-radius:6px;background:none;border:1px solid var(--border);color:var(--text3);font-size:11px;cursor:pointer;white-space:nowrap;font-family:var(--f)}.date-clear:hover{border-color:var(--accent);color:var(--accent)}
.add-company-btn{margin:14px 16px 0;padding:12px;background:var(--bg2);border:2px dashed var(--border);border-radius:var(--r);display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-size:14px;font-weight:500;color:var(--text3);transition:all .15s;font-family:var(--f)}.add-company-btn:hover{border-color:var(--accent);color:var(--accent);background:var(--ad)}
.color-options{display:flex;gap:8px;flex-wrap:wrap}.color-dot{width:32px;height:32px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:all .15s}.color-dot:hover{transform:scale(1.1)}.color-dot.selected{border-color:var(--text)}
.cat-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.cat-tag{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:99px;background:var(--bg4);font-size:12px;font-weight:500}.cat-tag-x{cursor:pointer;opacity:.5;font-size:14px}.cat-tag-x:hover{opacity:1}
.cat-input-row{display:flex;gap:8px}.cat-input-row input{flex:1}.cat-input-row button{flex-shrink:0}
`;

const StatusBadge = ({ status }) => {
    const l = { pending: "Pending", approved: "Approved", paid: "Paid", partially_paid: "Part Paid", rejected: "Rejected", recalled: "Recalled" };
    return <span className={"status " + status}>{l[status] || status}</span>;
};
const TLI = { submitted: "\u2197", approved: "\u2713", rejected: "\u2715", paid: "\u20A6", proof_requested: "?", proof_uploaded: "\u2713", resubmitted: "\u21BB", recalled: "\u21A9" };

export default function App() {
    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState(SEED);
    const [tab, setTab] = useState("dashboard");
    const [detailId, setDetailId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editReq, setEditReq] = useState(null);
    const [modal, setModal] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchQ, setSearchQ] = useState("");
    const [filterSt, setFilterSt] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [coVer, setCoVer] = useState(0);

    const addCompany = (co) => { COMPANIES[co.id] = co; setCoVer(v => v + 1); };

    const role = user?.role;
    const company = user ? COMPANIES[user.company] : null;
    const visible = requests.filter(r => {
        if (!user) return false;
        if (role === "requester") return r.company === user.company && r.requester_id === user.id;
        return true;
    });
    const pending = visible.filter(r => r.status === "pending");
    const approved = visible.filter(r => ["approved", "partially_paid"].includes(r.status));
    const paid = visible.filter(r => r.status === "paid");

    const flash = (m, s) => { setSuccess({ msg: m, sub: s }); setTimeout(() => setSuccess(null), 2000); };
    const openDetail = id => { setDetailId(id); setTab("detail"); };
    const goBack = () => { setDetailId(null); setTab("dashboard"); };

    const doApprove = id => {
        setRequests(p => p.map(r => r.id === id ? { ...r, status: "approved", approved_by: user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString(), timeline: [...r.timeline, { id: uid(), action: "approved", actor_name: user.name, note: "Approved for payment", created_at: new Date().toISOString() }] } : r));
        flash("Request Approved", "Sent to Finance");
    };
    const doReject = (id, reason, note) => {
        setRequests(p => p.map(r => r.id === id ? { ...r, status: "rejected", rejected_reason: reason, rejected_note: note, rejected_by: user.id, updated_at: new Date().toISOString(), timeline: [...r.timeline, { id: uid(), action: "rejected", actor_name: user.name, note: reason + (note ? " \u2014 " + note : ""), created_at: new Date().toISOString() }] } : r));
        setModal(null); flash("Request Rejected", "Requester notified");
    };
    const doRecall = id => {
        setRequests(p => p.map(r => r.id === id ? { ...r, status: "recalled", updated_at: new Date().toISOString(), timeline: [...r.timeline, { id: uid(), action: "recalled", actor_name: user.name, note: "Recalled for editing", created_at: new Date().toISOString() }] } : r));
        flash("Request Recalled", "You can now edit and resubmit");
    };
    const doPay = (reqId, liId, ref) => {
        setRequests(p => p.map(r => {
            if (r.id !== reqId) return r;
            const items = r.line_items.map(li => li.id === liId ? { ...li, is_paid: true, paid_by: user.id, paid_at: new Date().toISOString(), payment_ref: ref } : li);
            const all = items.every(li => li.is_paid), any = items.some(li => li.is_paid);
            const payee = r.line_items.find(li => li.id === liId);
            return { ...r, line_items: items, status: all ? "paid" : any ? "partially_paid" : r.status, updated_at: new Date().toISOString(), timeline: [...r.timeline, { id: uid(), action: "paid", actor_name: user.name, note: "Paid " + payee.beneficiary_name + " \u2014 " + ref, created_at: new Date().toISOString() }] };
        }));
        setModal(null); flash("Payment Recorded", "");
    };
    const doRequestProof = (reqId, liId) => {
        setRequests(p => p.map(r => r.id === reqId ? { ...r, line_items: r.line_items.map(li => li.id === liId ? { ...li, proof_requested: true, proof_requested_by: user.id } : li), timeline: [...r.timeline, { id: uid(), action: "proof_requested", actor_name: user.name, note: "Proof requested for " + r.line_items.find(l => l.id === liId).beneficiary_name, created_at: new Date().toISOString() }] } : r));
    };
    const doUploadProof = (reqId, liId) => {
        setRequests(p => p.map(r => r.id === reqId ? { ...r, line_items: r.line_items.map(li => li.id === liId ? { ...li, proof_image_url: "receipt.jpg" } : li), timeline: [...r.timeline, { id: uid(), action: "proof_uploaded", actor_name: user.name, note: "Proof uploaded for " + r.line_items.find(l => l.id === liId).beneficiary_name, created_at: new Date().toISOString() }] } : r));
        flash("Proof Uploaded", "");
    };
    const doSubmit = data => {
        if (editReq) {
            setRequests(p => p.map(r => r.id === editReq.id ? { ...r, ...data, status: "pending", rejected_reason: null, rejected_note: null, rejected_by: null, resubmit_count: r.resubmit_count + 1, updated_at: new Date().toISOString(), line_items: data.line_items.map((li, i) => ({ id: uid(), ...li, is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: i })), timeline: [...r.timeline, { id: uid(), action: "resubmitted", actor_name: user.name, note: "Edited and resubmitted", created_at: new Date().toISOString() }] } : r));
            setEditReq(null); flash("Request Resubmitted", "Sent for review");
        } else {
            const submitCo = data.company || user.company; const co = COMPANIES[submitCo]; const prefix = co.prefix[data.category] || "XX";
            const count = requests.filter(r => r.company === submitCo && r.category === data.category).length + 1;
            const nr = { id: uid(), ref_id: prefix + "-" + String(count).padStart(3, "0"), date: new Date().toISOString().split("T")[0], company: submitCo, category: data.category, requester_id: user.id, description: data.description, total_amount: data.line_items.reduce((s, li) => s + li.total, 0), status: "pending", approved_by: null, approved_at: null, rejected_reason: null, rejected_note: null, rejected_by: null, resubmit_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), line_items: data.line_items.map((li, i) => ({ id: uid(), ...li, is_paid: false, paid_by: null, paid_at: null, payment_ref: null, proof_requested: false, proof_image_url: null, sort_order: i })), timeline: [{ id: uid(), action: "submitted", actor_name: user.name, note: "Request submitted", created_at: new Date().toISOString() }] };
            setRequests(p => [nr, ...p]); flash("Request Submitted", "Ref: " + nr.ref_id);
        }
        setShowForm(false); setTab("dashboard");
    };

    if (!user) return (<><style>{CSS}</style><div className="app"><LoginPage onLogin={setUser} /></div></>);

    const navItems = [{ id: "dashboard", icon: "\u2302", label: "Home" }, ...(role === "admin" ? [{ id: "approvals", icon: "\u2713", label: "Approvals", badge: pending.length }] : []), ...(role === "finance" ? [{ id: "payments", icon: "\u20A6", label: "Payments", badge: approved.length }] : []), { id: "history", icon: "\u2630", label: "History" }, { id: "users", icon: "\u263A", label: "Users" }];

    return (
        <><style>{CSS}</style>
            <div className="app logged-in">
                <div className="header">
                    <div className="header-left"><div className="header-logo" style={{ background: company ? company.color : "linear-gradient(135deg,#00C896,#54A0FF)" }}>{company ? company.short[0] : "P"}</div><span className="header-title">{company ? company.short : "Payment Hub"}</span></div>
                    <div className="header-right"><span className={"role-badge " + role}>{role}</span><div className="avatar" onClick={() => setShowMenu(!showMenu)}>{user.name.split(" ").map(n => n[0]).join("")}</div></div>
                </div>
                {showMenu && <div className="user-menu"><div className="um-user"><div className="avatar" style={{ width: 36, height: 36 }}>{user.name.split(" ").map(n => n[0]).join("")}</div><div><div className="um-name">{user.name}</div><div className="um-detail">{company ? company.name : "All Companies"}</div></div></div><div className="signout-btn" onClick={() => { setUser(null); setShowMenu(false); setTab("dashboard"); setDetailId(null); setShowForm(false); }}>Sign Out</div></div>}
                <div className="content" onClick={() => showMenu && setShowMenu(false)}>
                    {showForm ? <RequestForm onSubmit={doSubmit} onCancel={() => { setShowForm(false); setEditReq(null); }} user={user} company={company} editData={editReq} />
                        : tab === "detail" && detailId ? <DetailView r={requests.find(r => r.id === detailId)} user={user} company={company} onBack={goBack} onApprove={doApprove} onReject={id => setModal({ type: "reject", reqId: id })} onPay={(rid, lid) => setModal({ type: "pay", reqId: rid, liId: lid })} onRequestProof={doRequestProof} onUploadProof={doUploadProof} onRecall={doRecall} onEditResubmit={req => { setEditReq(req); setShowForm(true); }} />
                            : tab === "approvals" ? <ListView title="Approvals" sub={pending.length + " pending"} items={pending} onOpen={openDetail} emptyMsg="All caught up!" emptySub="No requests awaiting approval" />
                                : tab === "payments" ? <PaymentsView items={approved} proofItems={visible.filter(r => r.line_items.some(li => li.proof_requested && !li.proof_image_url))} onOpen={openDetail} />
                                    : tab === "history" ? <HistoryView items={visible} onOpen={openDetail} q={searchQ} setQ={setSearchQ} filter={filterSt} setFilter={setFilterSt} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
                                        : tab === "users" ? <UsersView currentUser={user} addCompany={addCompany} flash={flash} />
                                            : <DashboardView items={visible} user={user} company={company} onOpen={openDetail} pending={pending} approved={approved} paid={paid} goHistory={() => setTab("history")} />}
                </div>
                {!showForm && tab !== "detail" && (role === "requester" || role === "admin") && <button className="fab" onClick={() => { setEditReq(null); setShowForm(true); }}>{"\uFF0B"}</button>}
                {!showForm && tab !== "detail" && <div className="nav">{navItems.map(n => <div key={n.id} className={"nav-item " + (tab === n.id ? "active" : "")} onClick={() => setTab(n.id)}>{n.badge > 0 && <span className="badge">{n.badge}</span>}<span className="n-icon">{n.icon}</span><span className="n-label">{n.label}</span></div>)}</div>}
                {modal?.type === "reject" && <RejectModal reqId={modal.reqId} onReject={doReject} onClose={() => setModal(null)} />}
                {modal?.type === "pay" && <PayModal li={requests.find(r => r.id === modal.reqId)?.line_items.find(l => l.id === modal.liId)} onPay={ref => doPay(modal.reqId, modal.liId, ref)} onClose={() => setModal(null)} />}
                {success && <div className="success-overlay" onClick={() => setSuccess(null)}><div className="success-check">{"\u2713"}</div><div className="success-text">{success.msg}</div>{success.sub && <div className="success-sub">{success.sub}</div>}</div>}
            </div></>
    );
}

function LoginPage({ onLogin }) {
    const [co, setCo] = useState(null);
    const sharedUsers = Object.values(USERS).filter(u => u.company === "all");
    const companyUsers = co ? Object.values(USERS).filter(u => u.company === co) : [];
    const colors = { requester: { bg: "var(--bd)", fg: "var(--blue)" }, admin: { bg: "var(--od)", fg: "var(--orange)" }, finance: { bg: "var(--ad)", fg: "var(--accent)" } };
    const UserRow = ({ u }) => (<div className="user-row" onClick={() => onLogin(u)}><div className="ur-avatar" style={{ background: colors[u.role].bg, color: colors[u.role].fg }}>{u.name.split(" ").map(n => n[0]).join("")}</div><div className="ur-info"><div className="ur-name">{u.name}</div><div className="ur-email">{u.email}</div></div><span className="ur-role" style={{ background: colors[u.role].bg, color: colors[u.role].fg }}>{u.role}</span></div>);
    return (
        <div className="login-page">
            <div className="login-hero"><div className="login-logo" style={{ background: "linear-gradient(135deg,#00C896,#00E6AC)" }}>P</div><div className="login-app-name">Payment Hub</div><div className="login-sub">Structured payment requests & approvals</div></div>
            {sharedUsers.length > 0 && <><div className="login-section"><div className="login-section-label">Admin & Finance (All Companies)</div></div>
                <div className="user-list">{sharedUsers.map(u => <UserRow key={u.id} u={u} />)}</div></>}
            <div className="login-section"><div className="login-section-label">Select Company (Requester)</div>
                <div className="company-cards">{Object.values(COMPANIES).map(c => <div key={c.id} className={"company-card " + (co === c.id ? "selected" : "")} onClick={() => setCo(c.id)}><div className="cc-icon" style={{ background: c.color }}>{c.short.slice(0, 2)}</div><div className="cc-name">{c.name}</div><div className="cc-tag">{c.categories.join(" \u00B7 ")}</div></div>)}</div>
            </div>
            {co && <><div className="login-section"><div className="login-section-label">Sign in as Requester</div></div>
                <div className="user-list">{companyUsers.map(u => <UserRow key={u.id} u={u} />)}</div></>}
        </div>
    );
}

function DashboardView({ items, user, company, onOpen, pending, approved, paid, goHistory }) {
    const recent = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    const s = arr => arr.reduce((s, r) => s + r.total_amount, 0);
    return (<><div className="page-title">Dashboard</div><div className="sub-label">Welcome, {user.name.split(" ")[0]} \u00B7 {company ? company.name : "All Companies"}</div>
        <div className="stat-cards"><div className="stat-card pending"><div className="s-num">{pending.length}</div><div className="s-val">{fmtNGN(s(pending))}</div><div className="s-lbl">Pending</div></div><div className="stat-card approved"><div className="s-num">{approved.length}</div><div className="s-val">{fmtNGN(s(approved))}</div><div className="s-lbl">Approved</div></div><div className="stat-card paid"><div className="s-num">{paid.length}</div><div className="s-val">{fmtNGN(s(paid))}</div><div className="s-lbl">Paid</div></div></div>
        <div className="section-header"><span className="section-title">Recent Requests</span><span className="section-link" onClick={goHistory}>View all &rarr;</span></div>
        <div className="req-list">{recent.map(r => <ReqCard key={r.id} r={r} onOpen={onOpen} />)}</div></>);
}

function ReqCard({ r, onOpen }) {
    const co = COMPANIES[r.company];
    return (<div className="req-card" onClick={() => onOpen(r.id)}><div className="req-top"><div><div className="req-ref">{r.ref_id}</div><div className="req-cat"><span className="cat-dot" style={{ background: co?.color }} />{r.category}</div></div><StatusBadge status={r.status} /></div><div className="req-desc">{r.description}</div><div className="req-bottom"><span className="req-amount">{fmtNGN(r.total_amount)}</span><div className="req-meta">{r.line_items.length} payee{r.line_items.length > 1 ? "s" : ""}<br />{fmtDate(r.date)}</div></div></div>);
}

function DetailView({ r, user, company, onBack, onApprove, onReject, onPay, onRequestProof, onUploadProof, onRecall, onEditResubmit }) {
    if (!r) return null;
    const role = user.role, isOwner = r.requester_id === user.id, co = COMPANIES[r.company];
    const paidN = r.line_items.filter(li => li.is_paid).length, totalN = r.line_items.length;
    const req = Object.values(USERS).find(u => u.id === r.requester_id);
    const canReject = (role === "admin" || role === "finance") && ["pending", "approved"].includes(r.status);
    const canApprove = role === "admin" && r.status === "pending";
    const canRecall = role === "requester" && isOwner && ["pending", "approved"].includes(r.status) && !r.line_items.some(li => li.is_paid);
    const canEdit = role === "requester" && isOwner && ["rejected", "recalled"].includes(r.status);
    const ss = s => { if (s === "rejected") return ["done", "rejected", "", "done", ""]; if (s === "recalled") return ["done", "recalled", "", "", ""]; if (s === "paid") return ["done", "done", "done", "done", "done"]; if (s === "partially_paid") return ["done", "done", "current", "done", "done"]; if (s === "approved") return ["done", "done", "current", "done", ""]; return ["done", "current", "", "", ""]; };
    const [s1, s2, s3, l1, l2] = ss(r.status);

    return (<div>
        <div className="detail-header"><button className="back-btn" onClick={onBack}>{"\u2190"}</button><div className="detail-title-group"><div className="detail-ref">{r.ref_id}</div><div className="detail-cat"><span className="cat-dot" style={{ background: co?.color }} />{r.category} \u00B7 {co?.name}</div></div><StatusBadge status={r.status} /></div>
        <div className="stepper"><div className="step"><div className={"step-dot " + s1}>{"\u2713"}</div><div className="step-label">Submitted</div></div><div className={"step-line " + l1} /><div className="step"><div className={"step-dot " + s2}>{r.status === "rejected" ? "\u2715" : r.status === "recalled" ? "\u21A9" : s2 === "done" ? "\u2713" : "2"}</div><div className="step-label">{r.status === "rejected" ? "Rejected" : r.status === "recalled" ? "Recalled" : "Admin"}</div></div><div className={"step-line " + l2} /><div className="step"><div className={"step-dot " + s3}>{s3 === "done" ? "\u2713" : "3"}</div><div className="step-label">Finance</div></div></div>
        {r.status === "rejected" && <div className="rejection-banner rejected"><div className="rb-title" style={{ color: "var(--warn)" }}>{"\u26A0"} Request Rejected</div><div className="rb-reason">{r.rejected_reason}</div>{r.rejected_note && <div className="rb-note">{r.rejected_note}</div>}{r.resubmit_count > 0 && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>Resubmitted {r.resubmit_count}x</div>}</div>}
        {r.status === "recalled" && <div className="rejection-banner recalled"><div className="rb-title" style={{ color: "var(--text2)" }}>{"\u21A9"} Recalled for Editing</div><div className="rb-note">You recalled this request. Edit and resubmit when ready.</div></div>}
        <div className="detail-info"><div className="info-item"><div className="info-label">Requester</div><div className="info-value">{req?.name || "\u2014"}</div></div><div className="info-item"><div className="info-label">Date</div><div className="info-value">{fmtDate(r.date)}</div></div><div className="info-item" style={{ gridColumn: "1 / -1" }}><div className="info-label">Description</div><div className="info-value">{r.description}</div></div><div className="info-item"><div className="info-label">Total</div><div className="info-value amount">{fmtNGN(r.total_amount)}</div></div><div className="info-item"><div className="info-label">Payees</div><div className="info-value">{totalN}</div></div></div>
        {["approved", "partially_paid", "paid"].includes(r.status) && <div className="pay-progress"><div className="pay-progress-bar"><div className="pay-progress-fill" style={{ width: (paidN / totalN * 100) + "%" }} /></div><span className="pay-progress-text">{paidN}/{totalN} paid</span></div>}
        <div className="line-items-section"><div className="li-header">Line Items ({totalN})</div>{r.line_items.map(li => <div className="li-card" key={li.id}><div className="li-top"><div className="li-desc">{li.description}</div><div className="li-amount">{fmtNGN(li.total)}</div></div>{li.payment_for && <div style={{ fontSize: 12, color: "var(--blue)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><span style={{ opacity: 0.6 }}>{"▸"}</span> For: {li.payment_for}</div>}{li.quantity > 1 && <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>{li.quantity} x {fmtNGN(li.unit_price)}</div>}<div className="li-bank"><div className="li-bank-row"><span className="li-bank-label">Beneficiary</span><span className="li-bank-name">{li.beneficiary_name}</span></div><div className="li-bank-row"><span className="li-bank-label">Account</span><span className="li-bank-value">{li.account_number}</span></div><div className="li-bank-row"><span className="li-bank-label">Bank</span><span className="li-bank-value">{li.bank_name}</span></div></div><div className="li-actions">{li.is_paid ? <div><span className="li-paid-badge">{"\u2713"} PAID</span>{li.payment_ref && <div className="li-ref">Ref: {li.payment_ref}</div>}{li.paid_at && <div className="li-ref">{fmtFull(li.paid_at)}</div>}{li.proof_image_url ? <div style={{ marginTop: 6, fontSize: 12, color: "var(--accent)" }}>{"\uD83E\uDDFE"} Proof uploaded</div> : <>{(role === "admin" || isOwner) && !li.proof_requested && <button className="btn btn-outline btn-sm" style={{ marginTop: 6 }} onClick={() => onRequestProof(r.id, li.id)}>Request Proof</button>}{li.proof_requested && !li.proof_image_url && role === "finance" && <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }} onClick={() => onUploadProof(r.id, li.id)}>{"\uD83D\uDCF7"} Upload Proof</button>}{li.proof_requested && !li.proof_image_url && role !== "finance" && <span style={{ fontSize: 11, color: "var(--orange)", marginTop: 6 }}>{"\u23F3"} Proof requested</span>}</>}</div> : role === "finance" && ["approved", "partially_paid"].includes(r.status) && <button className="btn btn-primary btn-sm" onClick={() => onPay(r.id, li.id)}>Pay {fmtNGN(li.total)}</button>}</div></div>)}</div>
        <div className="action-bar">{canApprove && <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onApprove(r.id)}>{"\u2713"} Approve</button>}{canReject && <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => onReject(r.id)}>{"\u2715"} Reject</button>}{canRecall && <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => onRecall(r.id)}>{"\u21A9"} Recall</button>}{canEdit && <button className="btn btn-primary btn-block" onClick={() => onEditResubmit(r)}>Edit & Resubmit</button>}</div>
        <div className="line-items-section"><div className="li-header">Activity Timeline</div></div>
        <div className="timeline-section">{[...r.timeline].reverse().map(ev => <div className="tl-item" key={ev.id}><div className={"tl-dot " + ev.action}>{TLI[ev.action] || "\u2022"}</div><div className="tl-content"><div className="tl-actor">{ev.actor_name}</div><div className="tl-note">{ev.note}</div><div className="tl-time">{fmtFull(ev.created_at)}</div></div></div>)}</div>
    </div>);
}

function ListView({ title, sub, items, onOpen, emptyMsg, emptySub }) {
    return (<><div className="page-title">{title}</div><div className="sub-label">{sub}</div><div className="req-list" style={{ marginTop: 12 }}>{items.length === 0 ? <div className="empty-state"><div className="empty-icon">{"\u2713"}</div><div className="empty-title">{emptyMsg}</div><div className="empty-desc">{emptySub}</div></div> : items.map(r => <ReqCard key={r.id} r={r} onOpen={onOpen} />)}</div></>);
}

function PaymentsView({ items, proofItems, onOpen }) {
    return (<><div className="page-title">Payments</div><div className="section-header"><span className="section-title">Ready to Pay ({items.length})</span></div><div className="req-list">{items.length === 0 ? <div className="empty-state" style={{ padding: 24 }}><div className="empty-title">No payments pending</div></div> : items.map(r => <ReqCard key={r.id} r={r} onOpen={onOpen} />)}</div>{proofItems.length > 0 && <><div className="section-header"><span className="section-title">Proof Needed ({proofItems.length})</span></div><div className="req-list">{proofItems.map(r => <ReqCard key={r.id} r={r} onOpen={onOpen} />)}</div></>}</>);
}

function HistoryView({ items, onOpen, q, setQ, filter, setFilter, dateFrom, setDateFrom, dateTo, setDateTo }) {
    const list = items.filter(r => {
        if (filter !== "all" && r.status !== filter) return false;
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
        if (q) { const s = q.toLowerCase(); return r.description.toLowerCase().includes(s) || r.ref_id.toLowerCase().includes(s) || r.date.includes(s) || r.line_items.some(li => li.beneficiary_name.toLowerCase().includes(s) || (li.payment_for && li.payment_for.toLowerCase().includes(s))); }
        return true;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const hasDateFilter = dateFrom || dateTo;
    return (<><div className="page-title">History</div>
        <div className="search-bar"><span className="search-icon">{"\u2315"}</span><input placeholder="Search requests, payees, dates..." value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="date-filters"><label>From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /><label>To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />{hasDateFilter && <button className="date-clear" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>}</div>
        <div className="filter-chips">{["all", "pending", "approved", "partially_paid", "paid", "rejected", "recalled"].map(f => <span key={f} className={"chip " + (filter === f ? "active" : "")} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "partially_paid" ? "Part Paid" : f.charAt(0).toUpperCase() + f.slice(1)}</span>)}</div>
        <div className="req-list">{list.length === 0 ? <div className="empty-state"><div className="empty-icon">{"\u2630"}</div><div className="empty-title">No requests found</div><div className="empty-desc">{hasDateFilter ? "Try adjusting your date range" : "Try a different search"}</div></div> : list.map(r => <ReqCard key={r.id} r={r} onOpen={onOpen} />)}</div>
    </>);
}

function RequestForm({ onSubmit, onCancel, user, company, editData }) {
    const firstCo = user.company === "all" ? Object.keys(COMPANIES)[0] : user.company;
    const [formCo, setFormCo] = useState(editData?.company || firstCo);
    const [cat, setCat] = useState(editData?.category || (COMPANIES[editData?.company || firstCo] || company || { categories: ["Others"] }).categories[0]);
    const [desc, setDesc] = useState(editData?.description || "");
    const blank = { description: "", payment_for: "", quantity: 1, unit_price: "", beneficiary_name: "", account_number: "", bank_name: "" };
    const [items, setItems] = useState(editData ? editData.line_items.map(li => ({ description: li.description, payment_for: li.payment_for || "", quantity: li.quantity, unit_price: li.unit_price / 100, beneficiary_name: li.beneficiary_name, account_number: li.account_number, bank_name: li.bank_name })) : [{ ...blank }]);
    const upd = (i, f, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
    const total = items.reduce((s, it) => s + (it.quantity || 1) * (parseFloat(it.unit_price) || 0), 0);
    const submit = () => {
        if (!desc.trim()) return alert("Enter a description");
        for (const it of items) { if (!it.description || !it.unit_price || !it.beneficiary_name || !it.account_number || !it.bank_name) return alert("Fill all line item fields"); }
        onSubmit({ company: formCo, category: cat, description: desc, line_items: items.map(it => ({ description: it.description, payment_for: it.payment_for, quantity: it.quantity || 1, unit_price: Math.round(parseFloat(it.unit_price) * 100), total: Math.round((it.quantity || 1) * parseFloat(it.unit_price) * 100), beneficiary_name: it.beneficiary_name, account_number: it.account_number, bank_name: it.bank_name })) });
    };
    return (
        <div className="form-page">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}><button className="back-btn" onClick={onCancel}>{"\u2190"}</button><div style={{ fontSize: 19, fontWeight: 700 }}>{editData ? "Edit & Resubmit" : "New Request"}</div></div>
            <div style={{ background: "var(--bg2)", borderRadius: "var(--r)", padding: 12, marginBottom: 14, display: "flex", gap: 10, alignItems: "center" }}><div className="avatar" style={{ width: 36, height: 36, background: (company ? company.color : "var(--accent)") + "22", color: company ? company.color : "var(--accent)" }}>{user.name.split(" ").map(n => n[0]).join("")}</div><div><div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div><div style={{ fontSize: 12, color: "var(--text3)" }}>{company ? company.name : "All Companies"}</div></div></div>
            {user.company === "all" && <div className="form-group"><label className="form-label">Company</label><select className="form-select" value={formCo} onChange={e => { setFormCo(e.target.value); setCat(COMPANIES[e.target.value]?.categories[0] || ""); }}>{Object.values(COMPANIES).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
            <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={cat} onChange={e => setCat(e.target.value)}>{(COMPANIES[formCo] || company || { categories: [] }).categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this payment for?" /></div>
            <div className="form-label" style={{ marginBottom: 10 }}>Line Items</div>
            {items.map((it, i) => <div className="line-item-form" key={i}><div className="line-item-num">Payee {i + 1}</div>{items.length > 1 && <button className="remove-item" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}>{"\u2715"}</button>}<div className="form-group"><input className="form-input" placeholder="Item description" value={it.description} onChange={e => upd(i, "description", e.target.value)} /></div><div className="form-group"><label className="form-label">Payment For</label><input className="form-input" placeholder="e.g. Truck Driver, Mechanic, Supplier" value={it.payment_for} onChange={e => upd(i, "payment_for", e.target.value)} /></div><div className="form-row" style={{ marginBottom: 12 }}><div><label className="form-label">Qty</label><input className="form-input" type="number" min="1" value={it.quantity} onChange={e => upd(i, "quantity", parseInt(e.target.value) || 1)} /></div><div><label className="form-label">Unit Price ({"\u20A6"})</label><input className="form-input" type="number" placeholder="0.00" value={it.unit_price} onChange={e => upd(i, "unit_price", e.target.value)} /></div></div><div style={{ textAlign: "right", fontSize: 13, fontFamily: "var(--m)", color: "var(--accent)", fontWeight: 600, marginBottom: 12 }}>= {fmtNGN(Math.round((it.quantity || 1) * (parseFloat(it.unit_price) || 0) * 100))}</div><div className="form-group"><label className="form-label">Beneficiary Name</label><input className="form-input" placeholder="Name on bank account" value={it.beneficiary_name} onChange={e => upd(i, "beneficiary_name", e.target.value)} /></div><div className="form-row"><div><label className="form-label">Account No.</label><input className="form-input" placeholder="10 digits" maxLength={10} value={it.account_number} onChange={e => upd(i, "account_number", e.target.value.replace(/\D/g, ""))} /></div><div><label className="form-label">Bank</label><select className="form-select" value={it.bank_name} onChange={e => upd(i, "bank_name", e.target.value)}><option value="">Select...</option>{BANKS.map(b => <option key={b} value={b}>{b}</option>)}</select></div></div></div>)}
            <button className="btn btn-outline btn-block" style={{ marginBottom: 16 }} onClick={() => setItems(p => [...p, { ...blank }])}>{"\uFF0B"} Add Another Payee</button>
            <div className="grand-total"><span className="gt-label">Grand Total</span><span className="gt-amount">{fmtNGN(Math.round(total * 100))}</span></div>
            <button className="btn btn-primary btn-block" onClick={submit}>{editData ? "Resubmit Request" : "Submit \u00B7 " + fmtNGN(Math.round(total * 100))}</button>
        </div>
    );
}

function UsersView({ currentUser, addCompany, flash }) {
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [companyFilter, setCompanyFilter] = useState("all");
    const [showAddCo, setShowAddCo] = useState(false);
    const allUsers = Object.values(USERS);
    const allCompanies = Object.values(COMPANIES);
    const filtered = allUsers.filter(u => {
        if (roleFilter !== "all" && u.role !== roleFilter) return false;
        if (companyFilter !== "all" && u.company !== companyFilter && u.company !== "all") return false;
        if (q) { const s = q.toLowerCase(); return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.role.toLowerCase().includes(s) || COMPANIES[u.company]?.name.toLowerCase().includes(s); }
        return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
    const colors = { requester: { bg: "var(--bd)", fg: "var(--blue)" }, admin: { bg: "var(--od)", fg: "var(--orange)" }, finance: { bg: "var(--ad)", fg: "var(--accent)" } };
    const grouped = {};
    filtered.forEach(u => { const co = u.company === "all" ? "Admin & Finance" : (COMPANIES[u.company]?.name || u.company); if (!grouped[co]) grouped[co] = []; grouped[co].push(u); });

    const handleAddCompany = (co) => { addCompany(co); setShowAddCo(false); flash("Company Added", co.name + " is now available"); };

    return (<><div className="page-title">Users</div><div className="sub-label">{allUsers.length} users \u00B7 {allCompanies.length} companies</div>
        <div className="search-bar"><span className="search-icon">{"\u2315"}</span><input placeholder="Search by name, email, role..." value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="filter-chips-scroll">{["all", "requester", "admin", "finance"].map(f => <span key={f} className={"chip " + (roleFilter === f ? "active" : "")} onClick={() => setRoleFilter(f)}>{f === "all" ? "All Roles" : f.charAt(0).toUpperCase() + f.slice(1)}</span>)}{allCompanies.map(c => <span key={c.id} className={"chip " + (companyFilter === c.id ? "active" : "")} onClick={() => setCompanyFilter(companyFilter === c.id ? "all" : c.id)}>{c.short}</span>)}</div>

        <button className="add-company-btn" onClick={() => setShowAddCo(true)}>{"\uFF0B"} Add New Company</button>

        {filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">{"\u263A"}</div><div className="empty-title">No users found</div><div className="empty-desc">Try a different search or filter</div></div>
            : Object.entries(grouped).map(([coName, users]) => <div key={coName}><div className="usr-section-label">{coName} ({users.length})</div><div className="req-list">{users.map(u => <div className="usr-card" key={u.id}><div className="usr-avatar" style={{ background: colors[u.role].bg, color: colors[u.role].fg }}>{u.name.split(" ").map(n => n[0]).join("")}</div><div className="usr-info"><div className="usr-name">{u.name}{u.id === currentUser.id ? <span style={{ fontSize: 10, color: "var(--accent)", marginLeft: 6 }}>YOU</span> : null}</div><div className="usr-email">{u.email}</div></div><span className="usr-role" style={{ background: colors[u.role].bg, color: colors[u.role].fg }}>{u.role}</span></div>)}</div></div>)}

        {showAddCo && <AddCompanyModal onAdd={handleAddCompany} onClose={() => setShowAddCo(false)} />}
    </>);
}

function AddCompanyModal({ onAdd, onClose }) {
    const [name, setName] = useState("");
    const [short, setShort] = useState("");
    const [color, setColor] = useState("#00C896");
    const [cats, setCats] = useState([]);
    const [catInput, setCatInput] = useState("");
    const palette = ["#00C896", "#54A0FF", "#FF6B6B", "#FF9F43", "#A78BFA", "#F368E0", "#1DD1A1", "#EE5A24", "#FDA7DF", "#3DC1D3", "#E77F67", "#778CA3"];

    const addCat = () => { const c = catInput.trim(); if (c && !cats.includes(c)) { setCats(p => [...p, c]); setCatInput(""); } };
    const removeCat = (c) => setCats(p => p.filter(x => x !== c));

    const submit = () => {
        if (!name.trim()) return alert("Enter a company name");
        if (!short.trim() || short.trim().length < 2) return alert("Enter a short name (2-4 chars)");
        if (cats.length === 0) return alert("Add at least one payment category");
        const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (COMPANIES[id]) return alert("A company with a similar name already exists");
        const s = short.trim().toUpperCase();
        const prefix = {};
        cats.forEach(c => { prefix[c] = s[0] + c[0].toUpperCase(); });
        onAdd({ id, name: name.trim(), short: s, color, categories: cats, prefix });
    };

    return (
        <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add New Company</div>
            <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" placeholder="e.g. Swift Haulage Ltd" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Short Name (2-4 chars)</label><input className="form-input" placeholder="e.g. SHL" maxLength={4} value={short} onChange={e => setShort(e.target.value.toUpperCase())} style={{ fontFamily: "var(--m)", letterSpacing: 2 }} /></div>
            <div className="form-group"><label className="form-label">Brand Color</label><div className="color-options">{palette.map(c => <div key={c} className={"color-dot " + (color === c ? "selected" : "")} style={{ background: c }} onClick={() => setColor(c)} />)}</div></div>
            <div className="form-group"><label className="form-label">Payment Categories</label>
                <div className="cat-input-row"><input className="form-input" placeholder="e.g. Fuel, Maintenance" value={catInput} onChange={e => setCatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCat(); } }} /><button className="btn btn-outline btn-sm" onClick={addCat}>Add</button></div>
                {cats.length > 0 && <div className="cat-tags">{cats.map(c => <span className="cat-tag" key={c}>{c}<span className="cat-tag-x" onClick={() => removeCat(c)}>{"\u2715"}</span></span>)}</div>}
                {cats.length === 0 && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>Type a category name and press Enter or tap Add</div>}
            </div>

            {name && short && cats.length > 0 && <div style={{ background: "var(--bg3)", borderRadius: "var(--rs)", padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>Preview</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" }}>{short.slice(0, 2)}</div>
                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div><div style={{ fontSize: 11, color: "var(--text3)" }}>{cats.join(" \u00B7 ")}</div></div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>Ref prefixes: {cats.map(c => short[0] + c[0].toUpperCase() + "-001").join(", ")}</div>
            </div>}

            <div style={{ display: "flex", gap: 8 }}><button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button><button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>Add Company</button></div>
        </div></div>
    );
}

function RejectModal({ reqId, onReject, onClose }) {
    const [reason, setReason] = useState(""); const [note, setNote] = useState("");
    return (<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-title">Reject Request</div><div className="form-group"><label className="form-label">Reason</label><select className="form-select" value={reason} onChange={e => setReason(e.target.value)}><option value="">Select reason...</option>{REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div><div className="form-group"><label className="form-label">Note (optional)</label><textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="What needs to be fixed?" /></div><div style={{ display: "flex", gap: 8 }}><button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button><button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { if (!reason) return alert("Select a reason"); onReject(reqId, reason, note); }}>Reject</button></div></div></div>);
}

function PayModal({ li, onPay, onClose }) {
    const [autoRef] = useState(() => genPayRef());
    if (!li) return null;
    return (<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-title">Confirm Payment</div><div style={{ background: "var(--bg3)", borderRadius: "var(--rs)", padding: 12, marginBottom: 16 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>{li.beneficiary_name}</div><div style={{ fontSize: 13, color: "var(--text2)", fontFamily: "var(--m)" }}>{li.bank_name} \u00B7 {li.account_number}</div><div style={{ fontFamily: "var(--m)", fontSize: 18, fontWeight: 700, color: "var(--accent)", marginTop: 6 }}>{fmtNGN(li.total)}</div></div><div style={{ background: "var(--bg3)", borderRadius: "var(--rs)", padding: 10, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>Payment Reference</div><div style={{ fontFamily: "var(--m)", fontSize: 15, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>{autoRef}</div></div><div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 500 }}>Auto-generated</div></div><div style={{ display: "flex", gap: 8 }}><button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button><button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onPay(autoRef)}>Confirm Payment</button></div></div></div>);
}
