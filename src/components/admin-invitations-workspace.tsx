"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import styles from "./admin-invitations.module.css";

export interface GuestRecord {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  status: "accepted" | "declined" | "pending";
  ceremonies: string[];
  dietary?: string;
  accommodation?: string;
}

export interface CustomerInvitation {
  id: string;
  slug: string;
  templateId: "royal-wedding" | "foundation-preview";
  templateName: string;
  partnerOne: string;
  partnerTwo: string;
  weddingDate: string;
  venue: string;
  customerName: string;
  customerPhone: string;
  status: "active" | "draft" | "expired";
  orderPrice: number;
  discount: number;
  couponCode: string;
  cashCollected: number;
  validityMonths: number;
  createdAt: string;
  expiresAt: string;
  rsvpEnabled: boolean;
  openingAnimation: boolean;
  guestList: GuestRecord[];
}

const INITIAL_INVITATIONS: CustomerInvitation[] = [
  {
    id: "inv-001",
    slug: "aarav-weds-meera",
    templateId: "royal-wedding",
    templateName: "Royal Wedding",
    partnerOne: "Aarav Sharma",
    partnerTwo: "Meera Patel",
    weddingDate: "2027-02-21",
    venue: "City Palace, Jaipur",
    customerName: "Aarav Sharma",
    customerPhone: "+91 98765 43210",
    status: "active",
    orderPrice: 25000,
    discount: 2500,
    couponCode: "ROYAL10",
    cashCollected: 22500,
    validityMonths: 12,
    createdAt: "2026-10-15",
    expiresAt: "2027-10-15",
    rsvpEnabled: true,
    openingAnimation: true,
    guestList: [
      {
        id: "g-1",
        name: "Rajesh & Sunita Patel",
        phone: "+91 98220 11223",
        partySize: 2,
        status: "accepted",
        ceremonies: ["Sangeet", "Wedding", "Reception"],
        dietary: "Jain Vegetarian",
        accommodation: "Assistance requested",
      },
      {
        id: "g-2",
        name: "Vikram Mehta",
        phone: "+91 98111 22334",
        partySize: 1,
        status: "accepted",
        ceremonies: ["Wedding", "Reception"],
        dietary: "Vegetarian",
        accommodation: "Arranged independently",
      },
      {
        id: "g-3",
        name: "Anand Verma & Family",
        phone: "+91 98777 55443",
        partySize: 4,
        status: "accepted",
        ceremonies: ["Haldi", "Mehendi", "Sangeet", "Wedding", "Reception"],
        dietary: "No restrictions",
        accommodation: "Assistance requested",
      },
      {
        id: "g-4",
        name: "Pooja Desai",
        phone: "+91 99000 88776",
        partySize: 2,
        status: "declined",
        ceremonies: [],
        dietary: "",
        accommodation: "",
      },
    ],
  },
  {
    id: "inv-002",
    slug: "vivaan-weds-ananya",
    templateId: "royal-wedding",
    templateName: "Royal Wedding",
    partnerOne: "Vivaan Singhania",
    partnerTwo: "Ananya Roy",
    weddingDate: "2027-04-18",
    venue: "Umaid Bhawan Palace, Jodhpur",
    customerName: "Vivaan Singhania",
    customerPhone: "+91 98123 45678",
    status: "active",
    orderPrice: 30000,
    discount: 0,
    couponCode: "DIRECTCASH",
    cashCollected: 30000,
    validityMonths: 12,
    createdAt: "2026-10-20",
    expiresAt: "2027-10-20",
    rsvpEnabled: true,
    openingAnimation: true,
    guestList: [
      {
        id: "g-5",
        name: "Rohan Kapoor",
        phone: "+91 98333 44556",
        partySize: 2,
        status: "accepted",
        ceremonies: ["Wedding", "Reception"],
        dietary: "Vegetarian",
      },
      {
        id: "g-6",
        name: "Karan Johar",
        phone: "+91 98444 55667",
        partySize: 1,
        status: "accepted",
        ceremonies: ["Sangeet", "Wedding"],
      },
    ],
  },
  {
    id: "inv-003",
    slug: "kabir-weds-rhea",
    templateId: "foundation-preview",
    templateName: "Foundation Preview",
    partnerOne: "Kabir Mehra",
    partnerTwo: "Rhea Kapur",
    weddingDate: "2027-01-15",
    venue: "Taj Lake Palace, Udaipur",
    customerName: "Kabir Mehra",
    customerPhone: "+91 98989 12121",
    status: "draft",
    orderPrice: 15000,
    discount: 1500,
    couponCode: "WELCOME10",
    cashCollected: 0,
    validityMonths: 6,
    createdAt: "2026-10-28",
    expiresAt: "2027-04-28",
    rsvpEnabled: false,
    openingAnimation: false,
    guestList: [],
  },
  {
    id: "inv-004",
    slug: "dev-weds-ishita",
    templateId: "royal-wedding",
    templateName: "Royal Wedding",
    partnerOne: "Dev Oberoi",
    partnerTwo: "Ishita Sen",
    weddingDate: "2026-09-10",
    venue: "Rambagh Palace, Jaipur",
    customerName: "Dev Oberoi",
    customerPhone: "+91 97777 88888",
    status: "expired",
    orderPrice: 25000,
    discount: 5000,
    couponCode: "OFFLINE-VIP",
    cashCollected: 20000,
    validityMonths: 6,
    createdAt: "2026-03-10",
    expiresAt: "2026-09-10",
    rsvpEnabled: true,
    openingAnimation: true,
    guestList: [
      {
        id: "g-7",
        name: "Amitabh Banerjee",
        phone: "+91 98111 99999",
        partySize: 3,
        status: "accepted",
        ceremonies: ["Reception"],
      },
    ],
  },
];

export function AdminInvitationsWorkspace() {
  const [invitations, setInvitations] =
    useState<CustomerInvitation[]>(INITIAL_INVITATIONS);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "draft" | "expired"
  >("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPartnerOne, setNewPartnerOne] = useState("");
  const [newPartnerTwo, setNewPartnerTwo] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newTemplateId, setNewTemplateId] = useState<
    "royal-wedding" | "foundation-preview"
  >("royal-wedding");
  const [newSlug, setNewSlug] = useState("");
  const [newWeddingDate, setNewWeddingDate] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newPrice, setNewPrice] = useState(25000);
  const [newCoupon, setNewCoupon] = useState("");
  const [newDiscount, setNewDiscount] = useState(0);
  const [newRsvp, setNewRsvp] = useState(true);
  const [newOpening, setNewOpening] = useState(true);
  const [newValidity, setNewValidity] = useState(12);

  // RSVP Drawer state
  const [activeRsvpInv, setActiveRsvpInv] =
    useState<CustomerInvitation | null>(null);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestSize, setNewGuestSize] = useState(1);
  const [newGuestStatus, setNewGuestStatus] = useState<
    "accepted" | "declined"
  >("accepted");

  // Edit / Renew modal state
  const [editingInv, setEditingInv] = useState<CustomerInvitation | null>(null);

  // Helpers
  function autoSlug(one: string, two: string) {
    const slug1 = one.trim().toLowerCase().split(/\s+/)[0] || "";
    const slug2 = two.trim().toLowerCase().split(/\s+/)[0] || "";
    if (slug1 && slug2) return `${slug1}-weds-${slug2}`;
    if (slug1) return `${slug1}-wedding`;
    return "";
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug =
      newSlug.trim() || autoSlug(newPartnerOne, newPartnerTwo) || `inv-${Date.now()}`;
    const netCash = Math.max(0, newPrice - newDiscount);
    const created: CustomerInvitation = {
      id: `inv-${Date.now()}`,
      slug: finalSlug,
      templateId: newTemplateId,
      templateName:
        newTemplateId === "royal-wedding" ? "Royal Wedding" : "Foundation Preview",
      partnerOne: newPartnerOne.trim(),
      partnerTwo: newPartnerTwo.trim(),
      weddingDate: newWeddingDate,
      venue: newVenue.trim(),
      customerName: newCustomerName.trim() || newPartnerOne.trim(),
      customerPhone: newCustomerPhone.trim(),
      status: netCash > 0 ? "active" : "draft",
      orderPrice: newPrice,
      discount: newDiscount,
      couponCode: newCoupon.trim() || (newDiscount > 0 ? "CUSTOM-DISCOUNT" : "OFFLINE-CASH"),
      cashCollected: netCash,
      validityMonths: newValidity,
      createdAt: new Date().toISOString().split("T")[0],
      expiresAt: new Date(Date.now() + newValidity * 30 * 86400000)
        .toISOString()
        .split("T")[0],
      rsvpEnabled: newRsvp,
      openingAnimation: newOpening,
      guestList: [],
    };

    setInvitations([created, ...invitations]);
    setShowCreateModal(false);
    setFeedback(
      `Invitation created for ${created.partnerOne} & ${created.partnerTwo}. Cash collected: ₹${netCash.toLocaleString("en-IN")}. Slug reserved: /invite/${created.slug}`,
    );

    // Reset form
    setNewPartnerOne("");
    setNewPartnerTwo("");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewSlug("");
    setNewWeddingDate("");
    setNewVenue("");
    setNewDiscount(0);
  }

  function toggleStatus(inv: CustomerInvitation) {
    const nextStatus: "active" | "draft" | "expired" =
      inv.status === "active"
        ? "expired"
        : inv.status === "expired"
          ? "draft"
          : "active";
    const updated = invitations.map((item) =>
      item.id === inv.id ? { ...item, status: nextStatus } : item,
    );
    setInvitations(updated);
    setFeedback(`Updated status of "${inv.slug}" to ${nextStatus}.`);
  }

  function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRsvpInv || !newGuestName.trim()) return;

    const guest: GuestRecord = {
      id: `g-${Date.now()}`,
      name: newGuestName.trim(),
      phone: newGuestPhone.trim(),
      partySize: newGuestSize,
      status: newGuestStatus,
      ceremonies:
        newGuestStatus === "accepted" ? ["Wedding", "Reception"] : [],
    };

    const updated = invitations.map((item) => {
      if (item.id === activeRsvpInv.id) {
        return {
          ...item,
          guestList: [...item.guestList, guest],
        };
      }
      return item;
    });

    setInvitations(updated);
    setActiveRsvpInv({
      ...activeRsvpInv,
      guestList: [...activeRsvpInv.guestList, guest],
    });
    setNewGuestName("");
    setNewGuestPhone("");
    setNewGuestSize(1);
    setFeedback(`Recorded RSVP for ${guest.name}.`);
  }

  function exportCsv(inv: CustomerInvitation) {
    const headers = [
      "Guest Name",
      "Phone",
      "Party Size",
      "Attendance",
      "Ceremonies",
      "Dietary",
      "Accommodation",
    ];
    const rows = inv.guestList.map((g) => [
      `"${g.name}"`,
      `"${g.phone}"`,
      g.partySize,
      g.status,
      `"${g.ceremonies.join(", ")}"`,
      `"${g.dietary || ""}"`,
      `"${g.accommodation || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${inv.slug}-guestlist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function copySlug(slug: string) {
    navigator.clipboard?.writeText(
      `${window.location.origin}/invite/${slug}`,
    );
    setFeedback(`Copied link: ${window.location.origin}/invite/${slug}`);
  }

  // Filtered invitations
  const filtered = invitations.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (templateFilter !== "all" && inv.templateId !== templateFilter)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName =
        inv.partnerOne.toLowerCase().includes(q) ||
        inv.partnerTwo.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerPhone.toLowerCase().includes(q) ||
        inv.slug.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  // KPI Calculations
  const totalInvs = invitations.length;
  const activeInvs = invitations.filter((i) => i.status === "active").length;
  const rsvpInvs = invitations.filter((i) => i.rsvpEnabled).length;
  const totalCash = invitations.reduce((acc, i) => acc + i.cashCollected, 0);

  return (
    <div className={styles.workspace}>
      {feedback && (
        <div className={styles.feedbackBanner} role="status">
          <span>{feedback}</span>
          <button
            type="button"
            className={styles.modalClose}
            onClick={() => setFeedback(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className={styles.kpis}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Total Invitations</span>
            <Icon name="mail" size={16} />
          </div>
          <span className={styles.kpiValue}>
            {totalInvs.toString().padStart(2, "0")}
          </span>
          <span className={styles.kpiFootnote}>Customer orders on file</span>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Active Live Links</span>
            <Icon name="check" size={16} />
          </div>
          <span className={styles.kpiValue}>
            {activeInvs.toString().padStart(2, "0")}
          </span>
          <span className={styles.kpiFootnote}>
            Serving /invite/[slug] routes
          </span>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>RSVP Enabled</span>
            <Icon name="phone" size={16} />
          </div>
          <span className={styles.kpiValue}>
            {rsvpInvs.toString().padStart(2, "0")}
          </span>
          <span className={styles.kpiFootnote}>Tracking guest lists</span>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>
            <span>Offline Cash Volume</span>
            <Icon name="shield" size={16} />
          </div>
          <span className={styles.kpiValue}>
            ₹{totalCash.toLocaleString("en-IN")}
          </span>
          <span className={styles.kpiFootnote}>Collected in person</span>
        </div>
      </div>

      {/* Toolbar: Search, Filters, and Actions */}
      <div className={styles.toolbar}>
        <div className={styles.searchAndFilter}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <Icon name="search" size={15} />
            </span>
            <input
              type="search"
              placeholder="Search by couple, slug, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.statusTabs} role="tablist">
            {(["all", "active", "draft", "expired"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.statusTab} ${
                  statusFilter === tab ? styles.active : ""
                }`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <select
            className={styles.templateSelect}
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
          >
            <option value="all">All templates</option>
            <option value="royal-wedding">Royal Wedding</option>
            <option value="foundation-preview">Foundation Preview</option>
          </select>
        </div>
        <button
          type="button"
          className={`${styles.btnAction} ${styles.btnActionPrimary}`}
          onClick={() => setShowCreateModal(true)}
        >
          + Personalize invitation
        </button>
      </div>

      {/* Invitations Table */}
      <div className={styles.tablePanel}>
        <div className={styles.tableWrapper}>
          <table className={styles.invTable}>
            <thead>
              <tr>
                <th>Couple & Celebration</th>
                <th>Purchased URL Slug</th>
                <th>Template</th>
                <th>Customer Contact</th>
                <th>RSVP Status</th>
                <th>Offline Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    No invitations match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div className={styles.coupleCell}>
                        <span className={styles.coupleNames}>
                          {inv.partnerOne} & {inv.partnerTwo}
                        </span>
                        <span className={styles.eventMeta}>
                          {inv.weddingDate} · {inv.venue}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.slugCell}>
                        <code className={styles.slugCode}>/invite/{inv.slug}</code>
                        <button
                          type="button"
                          className={styles.copyButton}
                          title="Copy link"
                          onClick={() => copySlug(inv.slug)}
                        >
                          <Icon name="copy" size={13} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={styles.templateBadge}>
                        <span
                          className={`${styles.dot} ${
                            inv.templateId === "royal-wedding"
                              ? styles.dotRoyal
                              : styles.dotFoundation
                          }`}
                        />
                        {inv.templateName}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div>{inv.customerName}</div>
                        <small style={{ color: "#94a3b8" }}>
                          {inv.customerPhone}
                        </small>
                      </div>
                    </td>
                    <td>
                      {inv.rsvpEnabled ? (
                        <button
                          type="button"
                          className={styles.rsvpBadge}
                          onClick={() => setActiveRsvpInv(inv)}
                          title="View and manage RSVP guest list"
                        >
                          <Icon name="phone" size={12} />
                          <span>
                            {inv.guestList.filter((g) => g.status === "accepted").length} Attending
                          </span>
                        </button>
                      ) : (
                        <span className={styles.rsvpDisabled}>Disabled</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <strong>₹{inv.cashCollected.toLocaleString("en-IN")}</strong>
                        {inv.discount > 0 && (
                          <div style={{ fontSize: "10px", color: "#16a34a" }}>
                            {inv.couponCode} (-₹{inv.discount})
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${
                          inv.status === "active"
                            ? styles.statusActive
                            : inv.status === "draft"
                              ? styles.statusDraft
                              : styles.statusExpired
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.btnAction}
                          onClick={() => toggleStatus(inv)}
                          title="Toggle Status (Active / Draft / Expired)"
                        >
                          {inv.status === "active"
                            ? "Expire"
                            : inv.status === "expired"
                              ? "Draft"
                              : "Activate"}
                        </button>
                        <button
                          type="button"
                          className={styles.btnAction}
                          onClick={() => setEditingInv(inv)}
                        >
                          Edit
                        </button>
                        {inv.templateId === "royal-wedding" ? (
                          <Link
                            className={styles.btnAction}
                            href="/preview/royal-wedding"
                            target="_blank"
                            title="Open design preview"
                          >
                            Preview ↗
                          </Link>
                        ) : (
                          <Link
                            className={styles.btnAction}
                            href="/templates/foundation-preview"
                            target="_blank"
                            title="Open design preview"
                          >
                            Preview ↗
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Personalize New Invitation</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Groom’s Name</label>
                    <input
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={newPartnerOne}
                      onChange={(e) => {
                        setNewPartnerOne(e.target.value);
                        if (!newSlug) {
                          setNewSlug(autoSlug(e.target.value, newPartnerTwo));
                        }
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Bride’s Name</label>
                    <input
                      required
                      placeholder="e.g. Meera Patel"
                      value={newPartnerTwo}
                      onChange={(e) => {
                        setNewPartnerTwo(e.target.value);
                        if (!newSlug) {
                          setNewSlug(autoSlug(newPartnerOne, e.target.value));
                        }
                      }}
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Customer Contact Name</label>
                    <input
                      placeholder="Billing / Account Name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Customer Mobile Phone</label>
                    <input
                      required
                      placeholder="+91 98765 43210"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Design Template</label>
                    <select
                      value={newTemplateId}
                      onChange={(e) =>
                        setNewTemplateId(
                          e.target.value as "royal-wedding" | "foundation-preview",
                        )
                      }
                    >
                      <option value="royal-wedding">
                        Royal Wedding (Patrika, GSAP & Slot Reel)
                      </option>
                      <option value="foundation-preview">
                        Foundation Preview (Minimalist)
                      </option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>URL Slug (/invite/[slug])</label>
                    <input
                      required
                      placeholder="aarav-weds-meera"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Wedding Date</label>
                    <input
                      type="date"
                      required
                      value={newWeddingDate}
                      onChange={(e) => setNewWeddingDate(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Venue / City</label>
                    <input
                      required
                      placeholder="e.g. City Palace, Jaipur"
                      value={newVenue}
                      onChange={(e) => setNewVenue(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Package Price (₹)</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Coupon Code & Discount (₹)</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        placeholder="e.g. ROYAL10"
                        value={newCoupon}
                        onChange={(e) => setNewCoupon(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Discount"
                        style={{ width: "90px" }}
                        value={newDiscount}
                        onChange={(e) => setNewDiscount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroupFull}>
                  <label>Features & Toggles</label>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={newRsvp}
                        onChange={(e) => setNewRsvp(e.target.checked)}
                      />
                      Enable RSVP Form & Responses
                    </label>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={newOpening}
                        onChange={(e) => setNewOpening(e.target.checked)}
                      />
                      Enable Envelope Opening Animation
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Validity Subscription</label>
                  <select
                    value={newValidity}
                    onChange={(e) => setNewValidity(Number(e.target.value))}
                  >
                    <option value={6}>6 Months validity</option>
                    <option value={12}>1 Year validity (Standard)</option>
                    <option value={24}>2 Years validity (Extended)</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btnAction} ${styles.btnActionPrimary}`}
                >
                  Save & Activate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RSVP Drawer */}
      {activeRsvpInv && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.drawerContent}`}>
            <div className={styles.modalHeader}>
              <div>
                <h2>RSVP Management: {activeRsvpInv.partnerOne} & {activeRsvpInv.partnerTwo}</h2>
                <small style={{ color: "#64748b" }}>
                  URL: /invite/{activeRsvpInv.slug}
                </small>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => exportCsv(activeRsvpInv)}
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setActiveRsvpInv(null)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className={styles.modalBody}>
              {/* Guest Counts */}
              <div className={styles.guestSummaryGrid}>
                <div className={styles.guestSummaryCard}>
                  <strong>
                    {activeRsvpInv.guestList.reduce((acc, g) => acc + g.partySize, 0)}
                  </strong>
                  <span>Total Headcount</span>
                </div>
                <div className={styles.guestSummaryCard}>
                  <strong>
                    {activeRsvpInv.guestList
                      .filter((g) => g.status === "accepted")
                      .reduce((acc, g) => acc + g.partySize, 0)}
                  </strong>
                  <span>Joyfully Attending</span>
                </div>
                <div className={styles.guestSummaryCard}>
                  <strong>
                    {activeRsvpInv.guestList
                      .filter((g) => g.status === "declined")
                      .reduce((acc, g) => acc + g.partySize, 0)}
                  </strong>
                  <span>Declined</span>
                </div>
                <div className={styles.guestSummaryCard}>
                  <strong>{activeRsvpInv.guestList.length}</strong>
                  <span>Total Responses</span>
                </div>
              </div>

              {/* Guest Table */}
              <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                <table className={styles.guestTable}>
                  <thead>
                    <tr>
                      <th>Guest Name</th>
                      <th>Phone</th>
                      <th>Party</th>
                      <th>Status</th>
                      <th>Dietary / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRsvpInv.guestList.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                          No guest responses recorded yet.
                        </td>
                      </tr>
                    ) : (
                      activeRsvpInv.guestList.map((g) => (
                        <tr key={g.id}>
                          <td>
                            <strong>{g.name}</strong>
                          </td>
                          <td>{g.phone}</td>
                          <td>{g.partySize}</td>
                          <td>
                            <span
                              className={`${styles.statusPill} ${
                                g.status === "accepted"
                                  ? styles.statusActive
                                  : styles.statusExpired
                              }`}
                            >
                              {g.status}
                            </span>
                          </td>
                          <td>{g.dietary || g.accommodation || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Guest Manual Form */}
              <form onSubmit={handleAddGuest} style={{ marginTop: "16px" }}>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#334155" }}>
                  Record Phone/In-Person RSVP
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr auto", gap: "8px" }}>
                  <input
                    required
                    placeholder="Guest name..."
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid #dbe1eb", borderRadius: "6px" }}
                  />
                  <input
                    placeholder="Phone number..."
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid #dbe1eb", borderRadius: "6px" }}
                  />
                  <input
                    type="number"
                    min={1}
                    value={newGuestSize}
                    onChange={(e) => setNewGuestSize(Number(e.target.value))}
                    style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid #dbe1eb", borderRadius: "6px" }}
                  />
                  <select
                    value={newGuestStatus}
                    onChange={(e) => setNewGuestStatus(e.target.value as "accepted" | "declined")}
                    style={{ padding: "6px 10px", fontSize: "12px", border: "1px solid #dbe1eb", borderRadius: "6px" }}
                  >
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                  </select>
                  <button
                    type="submit"
                    className={`${styles.btnAction} ${styles.btnActionPrimary}`}
                    style={{ padding: "6px 12px" }}
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnAction}
                onClick={() => setActiveRsvpInv(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingInv && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Edit Invitation: {editingInv.slug}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setEditingInv(null)}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setInvitations(
                  invitations.map((i) => (i.id === editingInv.id ? editingInv : i)),
                );
                setEditingInv(null);
                setFeedback(`Saved changes for ${editingInv.slug}.`);
              }}
            >
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Partner One</label>
                    <input
                      value={editingInv.partnerOne}
                      onChange={(e) =>
                        setEditingInv({ ...editingInv, partnerOne: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Partner Two</label>
                    <input
                      value={editingInv.partnerTwo}
                      onChange={(e) =>
                        setEditingInv({ ...editingInv, partnerTwo: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Wedding Date</label>
                    <input
                      type="date"
                      value={editingInv.weddingDate}
                      onChange={(e) =>
                        setEditingInv({ ...editingInv, weddingDate: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Venue</label>
                    <input
                      value={editingInv.venue}
                      onChange={(e) =>
                        setEditingInv({ ...editingInv, venue: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select
                      value={editingInv.status}
                      onChange={(e) =>
                        setEditingInv({
                          ...editingInv,
                          status: e.target.value as "active" | "draft" | "expired",
                        })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>RSVP Status</label>
                    <select
                      value={editingInv.rsvpEnabled ? "yes" : "no"}
                      onChange={(e) =>
                        setEditingInv({
                          ...editingInv,
                          rsvpEnabled: e.target.value === "yes",
                        })
                      }
                    >
                      <option value="yes">Enabled</option>
                      <option value="no">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => setEditingInv(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`${styles.btnAction} ${styles.btnActionPrimary}`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
